
import { storage } from "./storage";
import { config } from "./config";
import crypto from "crypto";

interface CompetitorConfig {
  canonicalName: string;
  aliases: string[];
  domains: string[];
}

interface SearchResult {
  title: string;
  link: string;
  snippet?: string;
  displayLink?: string;
  position?: number;
}

export class CompetitorAlertProcessor {
  private isProcessing = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.startScheduler();
  }

  startScheduler() {
    // Check for due alerts every minute
    this.intervalId = setInterval(async () => {
      if (!this.isProcessing) {
        await this.processDueAlerts();
      }
    }, 60 * 1000); // 1 minute

    console.log('📅 Competitor alert scheduler started');
  }

  stopScheduler() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async processDueAlerts() {
    try {
      this.isProcessing = true;
      const dueAlerts = await storage.getDueAlerts();

      console.log(`🔍 Found ${dueAlerts.length} due alerts to process`);

      for (const alert of dueAlerts) {
        await this.processAlert(alert);
      }
    } catch (error) {
      console.error('Error processing due alerts:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processAlert(alert: any) {
    const startTime = Date.now();
    console.log(`🎯 [${new Date().toISOString()}] Processing alert: ${alert.name} (ID: ${alert.id})`);

    const alertRun = await storage.createAlertRun({
      alertId: alert.id,
      status: 'running',
      apiCallsUsed: 0,
      newPresencesFound: 0,
      endTime: null,
      errorMessage: null
    });

    let apiCallsUsed = 0;
    let newPresencesFound = 0;

    try {
      // Check monthly quota
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const quotaUsage = await storage.getQuotaUsage(currentMonth);
      const remainingCalls = quotaUsage?.remainingCalls || 1000;

      if (remainingCalls <= 0) {
        throw new Error('Monthly API quota exceeded');
      }

      const competitors = Array.isArray(alert.competitors) ? alert.competitors : [];
      console.log(`📊 Processing ${competitors.length} competitors across ${alert.platforms.length} platforms`);

      for (const competitor of competitors) {
        for (const platform of alert.platforms) {
          if (apiCallsUsed >= remainingCalls) {
            console.log('⚠️ API quota limit reached, stopping processing');
            break;
          }

          console.log(`🔍 Searching for ${competitor.canonicalName} on ${platform}`);
          
          const query = this.buildCompetitorQuery(competitor, platform);
          const searchResults = await this.performSearch(query, alert.maxResults);
          apiCallsUsed++;

          const matches = await this.matchResultsToCompetitor(
            searchResults, 
            competitor, 
            alert.enableFuzzyMatching
          );

          console.log(`📝 Found ${matches.length} matches for ${competitor.canonicalName} on ${platform}`);

          for (const match of matches) {
            const dedupeKey = this.generateDedupeKey(match.title, match.link);
            const isDuplicate = await storage.checkDuplicatePresence(
              dedupeKey, 
              competitor.canonicalName, 
              alert.dedupeWindow
            );

            if (!isDuplicate) {
              await storage.createPresenceRecord({
                alertId: alert.id,
                runId: alertRun.id,
                competitorName: competitor.canonicalName,
                platform: platform,
                title: match.title,
                url: match.link,
                snippet: match.snippet || '',
                publishedAt: null, // Would be extracted from result if available
                dedupeKey: dedupeKey,
                detectionMethod: match.detectionMethod || 'exact'
              });
              newPresencesFound++;
            }
          }

          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Update quota usage
      await storage.updateQuotaUsage(currentMonth, apiCallsUsed);

      // Send notifications if new presences found
      if (newPresencesFound > 0) {
        await this.sendNotifications(alert, newPresencesFound);
      }

      // Update alert run as completed
      await storage.updateAlertRun(alertRun.id, {
        status: 'completed',
        endTime: new Date(),
        apiCallsUsed,
        newPresencesFound
      });

      // Update alert's next run time and last run
      const nextRunTime = this.calculateNextRunTime(alert.frequency);
      await storage.updateAlert(alert.id, {
        lastRun: new Date(),
        nextRunTime
      });

      const processingTime = Date.now() - startTime;
      console.log(`✅ [${new Date().toISOString()}] Alert ${alert.name} completed: ${newPresencesFound} new presences, ${apiCallsUsed} API calls, ${processingTime}ms processing time`);
      
      // Log performance metrics for monitoring
      if (processingTime > 60000) { // Alert if processing takes more than 1 minute
        console.warn(`⚠️ [PERFORMANCE] Alert ${alert.name} took ${processingTime}ms to process`);
      }
      
      if (apiCallsUsed > alert.maxResults * alert.platforms.length * competitors.length) {
        console.warn(`⚠️ [QUOTA] Alert ${alert.name} used more API calls than expected: ${apiCallsUsed}`);
      }

    } catch (error) {
      console.error(`❌ Alert ${alert.name} failed:`, error);

      await storage.updateAlertRun(alertRun.id, {
        status: 'failed',
        endTime: new Date(),
        apiCallsUsed,
        newPresencesFound,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });

      // Still update next run time to avoid getting stuck
      const nextRunTime = this.calculateNextRunTime(alert.frequency);
      await storage.updateAlert(alert.id, {
        nextRunTime
      });
    }
  }

  private buildCompetitorQuery(competitor: CompetitorConfig, platform: string): string {
    const platformDomain = this.getPlatformDomain(platform);
    const terms = [competitor.canonicalName];
    
    // Add aliases
    if (competitor.aliases && competitor.aliases.length > 0) {
      terms.push(...competitor.aliases.filter(alias => alias.trim()));
    }

    // Build query with exact phrase matching for precision
    const quotedTerms = terms.map(term => `"${term}"`).join(' OR ');
    return `(${quotedTerms}) site:${platformDomain}`;
  }

  private async performSearch(query: string, maxResults: number, retries = 3): Promise<SearchResult[]> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔍 [Attempt ${attempt}] Searching: ${query.substring(0, 50)}...`);
        
        const response = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': config.serper.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: query,
            num: Math.min(maxResults, 10),
            hl: 'en',
            gl: 'us'
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Serper API error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log(`✅ Search successful: ${(data.organic || []).length} results`);
        return data.organic || [];
        
      } catch (error) {
        console.error(`❌ Search attempt ${attempt} failed:`, error);
        
        if (attempt === retries) {
          console.error(`💥 Search failed after ${retries} attempts for query: ${query}`);
          return [];
        }
        
        // Exponential backoff: wait 2^attempt seconds
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    return [];
  }

  private async matchResultsToCompetitor(
    results: SearchResult[], 
    competitor: CompetitorConfig,
    enableFuzzyMatching: boolean
  ): Promise<Array<SearchResult & { detectionMethod: string }>> {
    const matches: Array<SearchResult & { detectionMethod: string }> = [];

    for (const result of results) {
      const text = `${result.title} ${result.snippet || ''}`.toLowerCase();
      let detectionMethod = '';

      // 1. Exact phrase matching
      if (this.exactMatch(text, competitor.canonicalName)) {
        detectionMethod = 'exact';
      }
      // 2. Alias matching
      else if (competitor.aliases?.some(alias => this.exactMatch(text, alias))) {
        detectionMethod = 'alias';
      }
      // 3. Domain matching
      else if (competitor.domains?.some(domain => result.link.includes(domain))) {
        detectionMethod = 'domain';
      }
      // 4. Fuzzy matching (if enabled)
      else if (enableFuzzyMatching && this.fuzzyMatch(text, competitor.canonicalName)) {
        detectionMethod = 'fuzzy';
      }

      if (detectionMethod) {
        matches.push({ ...result, detectionMethod });
      }
    }

    return matches;
  }

  private exactMatch(text: string, term: string): boolean {
    const regex = new RegExp(`\\b${this.escapeRegex(term.toLowerCase())}\\b`, 'i');
    return regex.test(text);
  }

  private fuzzyMatch(text: string, term: string): boolean {
    // Simple fuzzy matching - could be enhanced with more sophisticated algorithms
    const termLower = term.toLowerCase();
    const words = termLower.split(' ');
    
    // Check if most words from the term appear in the text
    const foundWords = words.filter(word => text.includes(word));
    return foundWords.length >= Math.ceil(words.length * 0.7); // 70% word match
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private generateDedupeKey(title: string, url: string): string {
    const content = `${title}${url}`;
    return crypto.createHash('md5').update(content).digest('hex');
  }

  private async sendNotifications(alert: any, newPresencesCount: number): Promise<void> {
    try {
      console.log(`📧 Sending notifications for alert ${alert.name}: ${newPresencesCount} new presences`);
      
      // Email notifications
      if (alert.emailNotifications && alert.email) {
        await this.sendEmailNotification(alert, newPresencesCount);
      }

      // Webhook notifications
      if (alert.webhookUrl) {
        const payload = {
          alertId: alert.id,
          alertName: alert.name,
          newPresencesFound: newPresencesCount,
          timestamp: new Date().toISOString()
        };

        try {
          await fetch(alert.webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'SocialMonitor-CompetitorAlert/1.0'
            },
            body: JSON.stringify(payload)
          });
          console.log(`🔗 Webhook notification sent to ${alert.webhookUrl}`);
        } catch (webhookError) {
          console.error('Webhook notification failed:', webhookError);
        }
      }

    } catch (error) {
      console.error('Notification sending failed:', error);
    }
  }

  private calculateNextRunTime(frequency: string): Date {
    const now = new Date();
    switch (frequency) {
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +1 week
      case 'daily':
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // +1 day
    }
  }

  private async sendEmailNotification(alert: any, newPresencesCount: number): Promise<void> {
    try {
      // For production use, you'll need to set up these environment variables:
      // SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
      const smtpConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      };

      // Check if SMTP is configured
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log(`📧 SMTP not configured. Would send email to ${alert.email}: ${newPresencesCount} new competitor mentions found`);
        console.log(`📧 To enable email sending, configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in your environment variables`);
        return;
      }

      // Import nodemailer dynamically to avoid requiring it if not used
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransporter(smtpConfig);

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">🎯 Competitor Alert: ${alert.name}</h2>
          <p>We've detected <strong>${newPresencesCount} new competitor mentions</strong> across your monitored platforms.</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Alert Details:</h3>
            <ul>
              <li><strong>Alert Name:</strong> ${alert.name}</li>
              <li><strong>Platforms:</strong> ${alert.platforms.join(', ')}</li>
              <li><strong>New Mentions:</strong> ${newPresencesCount}</li>
              <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          </div>

          <p>
            <a href="${process.env.APP_URL || 'http://localhost:5000'}" 
               style="background: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              View Full Dashboard
            </a>
          </p>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This email was sent by SocialMonitor AI. To stop receiving these notifications, 
            edit your alert settings in the dashboard.
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: alert.email,
        subject: `🎯 ${newPresencesCount} New Competitor Mentions - ${alert.name}`,
        html: emailHtml
      });

      console.log(`✅ Email sent successfully to ${alert.email}`);
    } catch (error) {
      console.error(`❌ Failed to send email notification:`, error);
    }
  }

  private getPlatformDomain(platform: string): string {
    const domains: Record<string, string> = {
      'Reddit': 'reddit.com',
      'Quora': 'quora.com',
      'Facebook': 'facebook.com',
      'Twitter': 'twitter.com',
      'LinkedIn': 'linkedin.com'
    };
    return domains[platform] || platform.toLowerCase() + '.com';
  }

  // Manual trigger for testing
  async triggerAlert(alertId: number): Promise<void> {
    const alerts = await storage.getAlerts();
    const alert = alerts.find(a => a.id === alertId);
    
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    console.log(`🚀 Manually triggering alert: ${alert.name}`);
    await this.processAlert(alert);
  }
}

// Export singleton instance
export const competitorAlertProcessor = new CompetitorAlertProcessor();
