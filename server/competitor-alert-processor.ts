import { storage } from "./storage";
import { getSerperAPIKey } from "./runtime-config";
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

interface AlertTimer {
  alertId: number;
  timerId: NodeJS.Timeout;
  nextRunTime: Date;
}

export class CompetitorAlertProcessor {
  private isProcessing = false;
  private alertTimers: Map<number, AlertTimer> = new Map();

  constructor() {
    this.initializeAlertTimers();
  }

  async initializeAlertTimers() {
    try {
      console.log('🚀 Initializing individual alert timers...');
      const alerts = await storage.getAlerts();

      for (const alert of alerts) {
        if (alert.isActive) {
          this.scheduleAlert(alert);
        }
      }

      console.log(`✅ Initialized ${this.alertTimers.size} alert timers`);
    } catch (error) {
      console.error('❌ Failed to initialize alert timers:', error);
    }
  }

  scheduleAlert(alert: any) {
    // Clear existing timer if any
    this.clearAlertTimer(alert.id);

    if (!alert.isActive) {
      console.log(`⏸️ Alert ${alert.name} is inactive, skipping scheduling`);
      return;
    }

    // Calculate next run time
    const nextRunTime = alert.nextRunTime ? new Date(alert.nextRunTime) : this.calculateNextRunTime(alert.frequency);
    const now = new Date();
    const delay = Math.max(0, nextRunTime.getTime() - now.getTime());

    console.log(`⏰ Scheduling alert "${alert.name}" to run in ${Math.round(delay / 1000)} seconds (${nextRunTime.toLocaleString()})`);

    // Schedule the alert
    const timerId = setTimeout(async () => {
      try {
        await this.processAlert(alert);

        // Reschedule for next run
        const updatedAlert = {
          ...alert,
          nextRunTime: this.calculateNextRunTime(alert.frequency)
        };
        this.scheduleAlert(updatedAlert);
      } catch (error) {
        console.error(`❌ Error processing scheduled alert ${alert.name}:`, error);

        // Still reschedule to avoid getting stuck
        const updatedAlert = {
          ...alert,
          nextRunTime: this.calculateNextRunTime(alert.frequency)
        };
        this.scheduleAlert(updatedAlert);
      }
    }, delay);

    // Store timer reference
    this.alertTimers.set(alert.id, {
      alertId: alert.id,
      timerId,
      nextRunTime
    });
  }

  clearAlertTimer(alertId: number): void {
    const timer = this.alertTimers.get(alertId);
    if (timer) {
      clearTimeout(timer.timerId);
      this.alertTimers.delete(alertId);
      console.log(`⏰ Cleared timer for alert ${alertId}`);
    }
  }

  // Add cleanup method for graceful shutdown
  cleanup(): void {
    console.log('🧹 Cleaning up alert processor timers...');
    for (const [alertId, timer] of this.alertTimers.entries()) {
      clearTimeout(timer.timerId); // Corrected: clearTimeout expects the timer ID, not the whole timer object
      console.log(`⏰ Cleared timer for alert ${alertId}`);
    }
    this.alertTimers.clear();
    console.log('✅ Alert processor cleanup completed');
  }

  // Called when alerts are created/updated/deleted
  async refreshAlertTimer(alertId: number) {
    try {
      const alerts = await storage.getAlerts();
      const alert = alerts.find(a => a.id === alertId);

      if (alert) {
        this.scheduleAlert(alert);
        console.log(`🔄 Refreshed timer for alert: ${alert.name}`);
      } else {
        this.clearAlertTimer(alertId);
        console.log(`🗑️ Alert ${alertId} not found, clearing timer`);
      }
    } catch (error) {
      console.error(`❌ Failed to refresh timer for alert ${alertId}:`, error);
    }
  }

  // Called when all alerts need to be refreshed
  async refreshAllAlertTimers() {
    try {
      console.log('🔄 Refreshing all alert timers...');

      // Clear all existing timers
      for (const [alertId] of this.alertTimers) {
        this.clearAlertTimer(alertId);
      }

      // Reinitialize all timers
      await this.initializeAlertTimers();
    } catch (error) {
      console.error('❌ Failed to refresh all alert timers:', error);
    }
  }

  stopAllTimers() {
    console.log('🛑 Stopping all alert timers...');
    for (const [alertId] of this.alertTimers) {
      this.clearAlertTimer(alertId);
    }
    console.log('✅ All alert timers stopped');
  }

  // Get status of all scheduled alerts
  getScheduledAlerts() {
    const scheduled = [];
    for (const [alertId, timer] of this.alertTimers) {
      scheduled.push({
        alertId,
        nextRunTime: timer.nextRunTime,
        timeUntilRun: timer.nextRunTime.getTime() - Date.now()
      });
    }
    return scheduled.sort((a, b) => a.nextRunTime.getTime() - b.nextRunTime.getTime());
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

          // Cache presence records once per competitor to avoid repeated database calls
          const cachedPresenceRecords = await storage.getPresenceRecords();
          const cutoffTime = new Date(Date.now() - alert.dedupeWindow * 24 * 60 * 60 * 1000);

          for (const match of matches) {
            const dedupeKey = this.generateDedupeKey(match.title, match.link);

            // Check for duplicates using cached data
            const duplicate = cachedPresenceRecords.find(record => {
              if (record.dedupeKey === dedupeKey && record.competitorName === competitor.canonicalName) {
                if (record.createdAt) {
                  const recordDate = record.createdAt instanceof Date ? record.createdAt : new Date(record.createdAt);
                  return recordDate > cutoffTime;
                }
              }
              return false;
            });

            const isDuplicate = !!duplicate;
            console.log(`🔍 Duplicate check for ${competitor.canonicalName}: ${isDuplicate ? 'DUPLICATE' : 'NEW'} (dedupeKey: ${dedupeKey.substring(0, 8)}...)`);

            if (!isDuplicate) {
              // Store presence record
              const newRecord = await storage.createPresenceRecord({
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

              // Add to cache for subsequent checks within this run
              cachedPresenceRecords.push(newRecord);
              newPresencesFound++;
            }
          }

          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Update quota usage
      await storage.updateQuotaUsage(currentMonth, apiCallsUsed);

      // Send notifications for automatic runs (always) - user requested emails for both manual and automatic triggers
      await this.sendNotifications(alert, newPresencesFound);

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
            'X-API-KEY': getSerperAPIKey(),
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

  private async sendEmailNotification(alert: any, newPresencesCount: number, isManualTrigger: boolean = false): Promise<void> {
    try {
      // Debug: Log all SMTP-related environment variables
      console.log('🔍 SMTP Environment Check:');
      console.log(`   SMTP_HOST: ${process.env.SMTP_HOST ? '✓ Set' : '✗ Missing'}`);
      console.log(`   SMTP_PORT: ${process.env.SMTP_PORT ? '✓ Set' : '✗ Missing'}`);
      console.log(`   SMTP_USER: ${process.env.SMTP_USER ? '✓ Set' : '✗ Missing'}`);
      console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? '✓ Set' : '✗ Missing'}`);

      const smtpConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        // Production-optimized settings for Railway and other hosting platforms
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000,   // 30 seconds
        socketTimeout: 60000,     // 60 seconds
        pool: true,               // Use connection pooling
        maxConnections: 1,        // Limit concurrent connections
        maxMessages: 3,           // Limit messages per connection
        rateDelta: 20000,         // 20 seconds between connections
        rateLimit: 5,             // Max 5 emails per rateDelta period
        // Additional Railway/production optimizations
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates in some hosting environments
        }
      };

      // Check if SMTP is configured
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log(`📧 SMTP not configured. Would send email to ${alert.email}: ${newPresencesCount} new competitor mentions found`);
        console.log(`📧 Required environment variables:`);
        console.log(`   - SMTP_USER: ${process.env.SMTP_USER ? 'Set' : 'Missing'}`);
        console.log(`   - SMTP_PASS: ${process.env.SMTP_PASS ? 'Set' : 'Missing'}`);
        console.log(`   - SMTP_HOST: ${process.env.SMTP_HOST || 'Using default: smtp.gmail.com'}`);
        console.log(`   - SMTP_PORT: ${process.env.SMTP_PORT || 'Using default: 587'}`);
        return;
      }

      console.log(`📧 SMTP Configuration validated, attempting to send email...`);
      console.log(`📧 Email will be sent to: ${alert.email}`);

      // Import nodemailer using dynamic import for ES modules
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport(smtpConfig);

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1f2937;">🎯 Competitor Alert: ${alert.name}</h2>
          ${isManualTrigger 
            ? `<p><strong>Manual alert triggered!</strong> This alert was run manually and found <strong>${newPresencesCount} new competitor mentions</strong> since the last check.</p>
               <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
                 <p style="margin: 0; color: #0369a1;"><strong>Note:</strong> This email was sent because you manually triggered the alert.</p>
               </div>`
            : newPresencesCount > 0
              ? `<p>We've detected <strong>${newPresencesCount} new competitor mentions</strong> across your monitored platforms during the scheduled scan.</p>`
              : `<p><strong>Scheduled alert completed!</strong> This alert ran automatically as scheduled and found <strong>${newPresencesCount} new competitor mentions</strong> since the last check.</p>
                 <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
                   <p style="margin: 0; color: #047857;"><strong>System Status:</strong> Your alert monitoring is working correctly. You'll receive emails for all scheduled runs.</p>
                 </div>`
          }

          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Alert Details:</h3>
            <ul>
              <li><strong>Alert Name:</strong> ${alert.name}</li>
              <li><strong>Platforms:</strong> ${alert.platforms.join(', ')}</li>
              <li><strong>New Mentions:</strong> ${newPresencesCount}</li>
              <li><strong>Trigger Type:</strong> ${isManualTrigger ? 'Manual' : 'Automatic'}</li>
              <li><strong>Frequency:</strong> ${alert.frequency}</li>
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
            This email was sent by SocialMonitor AI. ${isManualTrigger ? 'Manual trigger emails are always sent.' : 'Automatic emails are sent for all scheduled alert runs.'}
          </p>
        </div>
      `;

      const subject = isManualTrigger 
        ? `🔄 Manual Alert Triggered - ${alert.name} (${newPresencesCount} mentions found)`
        : newPresencesCount > 0
          ? `🎯 ${newPresencesCount} New Competitor Mentions - ${alert.name}`
          : `📊 Scheduled Alert Completed - ${alert.name} (${newPresencesCount} mentions found)`;

      // Add retry logic for email sending
      const maxRetries = 3;
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`📧 Sending email (attempt ${attempt}/${maxRetries})...`);
          
          await transporter.sendMail({
            from: process.env.FROM_EMAIL || process.env.SMTP_USER,
            to: alert.email,
            subject: subject,
            html: emailHtml
          });

          console.log(`✅ Email sent successfully to ${alert.email} on attempt ${attempt}`);
          return; // Success, exit the function
        } catch (error: any) {
          lastError = error;
          console.warn(`⚠️ Email sending attempt ${attempt} failed:`, error.message);
          
          if (attempt < maxRetries) {
            const delay = attempt * 5000; // Exponential backoff: 5s, 10s, 15s
            console.log(`🔄 Retrying in ${delay/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // If we get here, all retries failed
      throw lastError;
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

    // For manual triggers, always send an email notification regardless of new presences found
    if (alert.emailNotifications && alert.email) {
      console.log(`📧 Manual trigger: Sending email notification for alert ${alert.name} (always sent for manual triggers)`);
      await this.sendEmailNotification(alert, 0, true); // Send with 0 new presences and mark as manual trigger
    }

    // Reschedule the alert after manual trigger
    this.scheduleAlert(alert);
  }

  // Test email notification function
  async testEmailNotification(alertId: number): Promise<void> {
    const alerts = await storage.getAlerts();
    const alert = alerts.find(a => a.id === alertId);

    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    if (!alert.email) {
      throw new Error(`Alert ${alertId} has no email configured`);
    }

    console.log(`📧 Testing email notification for alert: ${alert.name}`);
    console.log(`📧 Sending test email to: ${alert.email}`);
    
    // Force send a test email with 1 new presence
    await this.sendEmailNotification(alert, 1);
  }
}

// Export singleton instance
export const competitorAlertProcessor = new CompetitorAlertProcessor();