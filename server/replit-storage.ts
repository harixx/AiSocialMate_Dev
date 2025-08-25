import Database from "@replit/database";
import {
  type User, type InsertUser, type Alert, type InsertAlert,
  type SearchResult, type InsertSearchResult,
  type GeneratedReply, type InsertGeneratedReply,
  type Faq, type InsertFaq,
  type InsertAlertRun, type AlertRun,
  type InsertPresenceRecord, type PresenceRecord,
  type QuotaUsage
} from "@shared/schema";
import { IStorage } from "./storage";

export class ReplitStorage implements IStorage {
  private db: Database;

  constructor() {
    this.db = new Database();
  }

  // Helper methods for generating IDs and managing data
  private async getNextId(type: string): Promise<number> {
    const key = `${type}_counter`;
    const result = await this.db.get(key);
    
    // Handle nested response structure
    let current = result;
    if (result && typeof result === 'object' && 'ok' in result && result.ok && 'value' in result) {
      current = result.value;
    }
    
    const currentNumber = typeof current === 'number' ? current : 0;
    const next = currentNumber + 1;
    await this.db.set(key, next);
    console.log(`🔢 Generated ID for ${type}: ${next} (previous: ${currentNumber})`);
    return next;
  }

  private async getAllByType<T>(type: string): Promise<T[]> {
    try {
      console.log(`🔍 Getting all items of type: ${type}`);
      const keys = await this.db.list(`${type}:`);
      console.log(`📋 Found keys for ${type}:`, keys);

      // Handle Replit Database response format
      let keyArray: string[] = [];
      if (keys && typeof keys === 'object' && 'value' in keys) {
        keyArray = Array.isArray(keys.value) ? keys.value : [];
      } else if (Array.isArray(keys)) {
        keyArray = keys;
      }

      console.log(`📊 Key array length: ${keyArray.length}`, keyArray);
      const items: T[] = [];
      for (const key of keyArray) {
        const result = await this.db.get(key);
        console.log(`📄 Retrieved item for key ${key}:`, result ? 'Found' : 'Not found');
        console.log(`📄 Raw data structure for ${key}:`, JSON.stringify(result).substring(0, 200));
        
        if (result) {
          // Handle deeply nested Replit Database response format
          let item = result;
          
          // Keep unwrapping while we have nested ok/value structures
          let unwrapCount = 0;
          while (item && typeof item === 'object' && 'ok' in item && item.ok && 'value' in item && unwrapCount < 5) {
            console.log(`📄 Unwrapping nested response for ${key} (level ${unwrapCount + 1})`);
            item = item.value;
            unwrapCount++;
          }
          
          console.log(`📄 Final unwrapped item for ${key}:`, JSON.stringify(item).substring(0, 200));
          
          if (item) {
            items.push(item as T);
          }
        }
      }
      console.log(`✅ Returning ${items.length} items for type ${type}`);
      return items;
    } catch (error) {
      console.error(`Error in getAllByType for ${type}:`, error);
      return [];
    }
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return await this.db.get(`user:${id}`);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await this.getAllByType<User>('user');
    return users.find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = await this.getNextId('user');
    const user: User = { ...insertUser, id };
    await this.db.set(`user:${id}`, user);
    return user;
  }

  // Alerts
  // Get Alerts
  async getAlerts(): Promise<Alert[]> {
    console.log('🔍 Getting all items of type: alert');
    const keys = await this.db.list('alert:');
    console.log('📋 Found keys for alert:', keys);

    if (!keys.ok || !keys.value) {
      console.log('❌ Failed to get alert keys or no keys found');
      return [];
    }

    const alerts: Alert[] = [];
    const invalidKeys: string[] = [];

    for (const key of keys.value) {
      // Skip malformed keys and mark for cleanup
      if (key.includes('[object Object]')) {
        console.log(`🗑️ Marking malformed key for cleanup: ${key}`);
        invalidKeys.push(key);
        continue;
      }

      // Validate key format
      if (!key.match(/^alert:\d+$/)) {
        console.log(`⚠️ Invalid key format, marking for cleanup: ${key}`);
        invalidKeys.push(key);
        continue;
      }

      const item = await this.db.get(key);
      if (item.ok && item.value) {
        const alert = item.value as Alert;
        // Ensure the alert has required properties
        if (alert.name && alert.id && typeof alert.id === 'number') {
          // Additional validation for data integrity
          if (alert.competitors && Array.isArray(alert.competitors) && 
              alert.platforms && Array.isArray(alert.platforms)) {

            // Ensure dates are properly converted from strings to Date objects
            if (alert.nextRunTime && typeof alert.nextRunTime === 'string') {
              alert.nextRunTime = new Date(alert.nextRunTime);
            }
            if (alert.lastRun && typeof alert.lastRun === 'string') {
              alert.lastRun = new Date(alert.lastRun);
            }
            if (alert.createdAt && typeof alert.createdAt === 'string') {
              alert.createdAt = new Date(alert.createdAt);
            }

            alerts.push(alert);
            console.log(`✅ Valid alert loaded: ${alert.name} (ID: ${alert.id}) - Next run: ${alert.nextRunTime}`);
          } else {
            console.log(`❌ Alert missing required arrays, marking for cleanup: ${key}`);
            invalidKeys.push(key);
          }
        } else {
          console.log(`❌ Invalid alert data, marking for cleanup: ${key}`, alert);
          invalidKeys.push(key);
        }
      } else {
        console.log(`❌ Failed to load alert data for key: ${key}`);
        invalidKeys.push(key);
      }
    }

    // Clean up invalid keys automatically
    if (invalidKeys.length > 0) {
      console.log(`🧹 Auto-cleaning ${invalidKeys.length} invalid keys`);
      for (const invalidKey of invalidKeys) {
        try {
          await this.db.delete(invalidKey);
          console.log(`✅ Cleaned up invalid key: ${invalidKey}`);
        } catch (error) {
          console.error(`❌ Failed to clean up key ${invalidKey}:`, error);
        }
      }
    }

    console.log(`✅ Returning ${alerts.length} valid alerts (cleaned ${invalidKeys.length} invalid entries)`);
    return alerts.sort((a, b) => a.id - b.id);
  }

  async getAlert(id: number): Promise<Alert | undefined> {
    const result = await this.db.get(`alert:${id}`);
    if (result.ok && result.value) {
      const alert = result.value as Alert;
      // Ensure dates are properly converted
      if (alert.nextRunTime && typeof alert.nextRunTime === 'string') {
        alert.nextRunTime = new Date(alert.nextRunTime);
      }
      if (alert.lastRun && typeof alert.lastRun === 'string') {
        alert.lastRun = new Date(alert.lastRun);
      }
      if (alert.createdAt && typeof alert.createdAt === 'string') {
        alert.createdAt = new Date(alert.createdAt);
      }
      return alert;
    }
    return undefined;
  }

  // Create Alert
  async createAlert(alertData: any): Promise<Alert> {
    // Validate input data
    if (!alertData.name || !alertData.competitors || !alertData.platforms) {
      throw new Error('Alert must have name, competitors, and platforms');
    }

    if (!Array.isArray(alertData.competitors) || !Array.isArray(alertData.platforms)) {
      throw new Error('Competitors and platforms must be arrays');
    }

    const alerts = await this.getAlerts();

    // Generate a proper sequential ID
    const existingIds = alerts
      .map(a => a.id)
      .filter(id => typeof id === 'number' && !isNaN(id))
      .sort((a, b) => a - b);

    const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

    console.log(`🔢 Generated ID for alert: ${nextId}`);

    // Ensure competitors have proper structure
    const validatedCompetitors = alertData.competitors.map((comp: any) => ({
      canonicalName: comp.canonicalName || comp.name || '',
      aliases: Array.isArray(comp.aliases) ? comp.aliases : [],
      domains: Array.isArray(comp.domains) ? comp.domains : []
    }));

    const alert: Alert = {
      ...alertData,
      id: nextId,
      competitors: validatedCompetitors,
      platforms: Array.isArray(alertData.platforms) ? alertData.platforms : [],
      isActive: alertData.isActive ?? true,
      createdAt: new Date(),
      lastRun: null,
      nextRunTime: this.calculateNextRunTime(alertData.frequency || 'daily')
    };

    const key = `alert:${nextId}`;
    console.log(`💾 Storing alert with key: ${key}`);
    console.log(`📋 Alert data:`, { 
      name: alert.name, 
      competitors: alert.competitors.length, 
      platforms: alert.platforms.length 
    });

    const result = await this.db.set(key, alert);
    if (!result.ok) {
      throw new Error('Failed to store alert');
    }

    console.log(`✅ Alert stored successfully with ID: ${nextId}`);
    return alert;
  }

  async updateAlert(id: number, alertUpdate: Partial<Alert>): Promise<Alert | undefined> {
    const existingAlert = await this.getAlert(id);
    if (!existingAlert) return undefined;

    const updatedAlert = { ...existingAlert, ...alertUpdate };
    await this.db.set(`alert:${id}`, updatedAlert);
    return updatedAlert;
  }

  // Delete Alert
  async deleteAlert(id: number): Promise<boolean> {
    if (!id || isNaN(id)) {
      console.log(`❌ Invalid alert ID for deletion: ${id}`);
      return false;
    }

    const key = `alert:${id}`;
    console.log(`🗑️ Deleting alert with key: ${key}`);

    const result = await this.db.delete(key);
    if (result.ok) {
      console.log(`✅ Alert ${id} deleted successfully`);
    } else {
      console.log(`❌ Failed to delete alert ${id}`);
    }

    return result.ok;
  }

  // Search Results
  async getSearchResults(type?: string): Promise<SearchResult[]> {
    const results = await this.getAllByType<SearchResult>('searchResult');
    return type ? results.filter(r => r.type === type) : results;
  }

  async createSearchResult(insertResult: InsertSearchResult): Promise<SearchResult> {
    const id = await this.getNextId('searchResult');
    const result: SearchResult = {
      ...insertResult,
      id,
      createdAt: new Date()
    };
    await this.db.set(`searchResult:${id}`, result);
    return result;
  }

  // Generated Replies
  async getGeneratedReplies(): Promise<GeneratedReply[]> {
    const replies = await this.getAllByType<GeneratedReply>('generatedReply');
    return replies.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createGeneratedReply(insertReply: InsertGeneratedReply): Promise<GeneratedReply> {
    const id = await this.getNextId('generatedReply');
    const reply: GeneratedReply = {
      ...insertReply,
      brandName: insertReply.brandName ?? null,
      brandContext: insertReply.brandContext ?? null,
      brandUrl: insertReply.brandUrl ?? null,
      creativity: insertReply.creativity ?? "0.7",
      aiProvider: insertReply.aiProvider ?? "openai",
      model: insertReply.model ?? "gpt-4o",
      feedback: insertReply.feedback ?? null,
      id,
      createdAt: new Date()
    };
    await this.db.set(`generatedReply:${id}`, reply);
    return reply;
  }

  // FAQs
  async getFaqs(): Promise<Faq[]> {
    return await this.getAllByType<Faq>('faq');
  }

  async createFaq(insertFaq: InsertFaq): Promise<Faq> {
    const id = await this.getNextId('faq');
    const now = new Date();
    const faq: Faq = {
      ...insertFaq,
      id,
      createdAt: now
    };
    await this.db.set(`faq:${id}`, faq);
    return faq;
  }

  // Alert Runs
  async createAlertRun(insertAlertRun: InsertAlertRun): Promise<AlertRun> {
    const id = await this.getNextId('alertRun');
    const now = new Date();
    const alertRun: AlertRun = {
      ...insertAlertRun,
      id,
      startTime: now
    };
    await this.db.set(`alertRun:${id}`, alertRun);
    return alertRun;
  }

  async updateAlertRun(id: number, updates: Partial<AlertRun>): Promise<AlertRun | undefined> {
    const alertRun = await this.db.get(`alertRun:${id}`);
    if (!alertRun) return undefined;

    const updatedAlertRun = { ...alertRun, ...updates };
    await this.db.set(`alertRun:${id}`, updatedAlertRun);
    return updatedAlertRun;
  }

  async getAlertRuns(alertId?: number): Promise<AlertRun[]> {
    const runs = await this.getAllByType<AlertRun>('alertRun');
    if (alertId) {
      console.log(`🔍 Filtering ${runs.length} alert runs for alertId: ${alertId}`);
      console.log('Alert runs:', runs.map(run => ({ id: run.id, alertId: run.alertId, status: run.status })));
      const filtered = runs.filter(run => Number(run.alertId) === Number(alertId));
      console.log(`✅ Filtered to ${filtered.length} matching runs`);
      return filtered;
    }
    return runs;
  }

  // Presence Records
  async createPresenceRecord(insertPresenceRecord: InsertPresenceRecord): Promise<PresenceRecord> {
    const id = await this.getNextId('presenceRecord');
    const now = new Date();
    const presenceRecord: PresenceRecord = {
      ...insertPresenceRecord,
      id,
      createdAt: now
    };
    await this.db.set(`presenceRecord:${id}`, presenceRecord);
    return presenceRecord;
  }

  async getPresenceRecords(alertId?: number, competitorName?: string): Promise<PresenceRecord[]>{
    const records = await this.getAllByType<PresenceRecord>('presenceRecord');
    let filtered = records;

    if (alertId) {
      console.log(`🔍 Filtering ${records.length} presence records for alertId: ${alertId}`);
      console.log('Presence records:', records.map(record => ({ id: record.id, alertId: record.alertId, competitorName: record.competitorName })));
      filtered = filtered.filter(record => Number(record.alertId) === Number(alertId));
      console.log(`✅ Filtered to ${filtered.length} matching presence records`);
    }

    if (competitorName) {
      filtered = filtered.filter(record => record.competitorName === competitorName);
    }

    return filtered.sort((a, b) => {
      const aTime = a.createdAt ? (a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime()) : 0;
      const bTime = b.createdAt ? (b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime()) : 0;
      return bTime - aTime;
    });
  }

  async checkDuplicatePresence(dedupeKey: string, competitorName: string, dedupeWindow: number): Promise<boolean> {
    try {
      const presenceRecords = await this.getPresenceRecords();
      const cutoffTime = new Date(Date.now() - dedupeWindow * 24 * 60 * 60 * 1000);

      // Check for duplicates based on dedupeKey and within the dedupe window
      const duplicate = presenceRecords.find(record => {
        if (record.dedupeKey === dedupeKey && record.competitorName === competitorName) {
          const recordDate = record.createdAt instanceof Date ? record.createdAt : new Date(record.createdAt);
          return recordDate > cutoffTime;
        }
        return false;
      });

      const isDuplicate = !!duplicate;
      console.log(`🔍 Duplicate check for ${competitorName}: ${isDuplicate ? 'DUPLICATE' : 'NEW'} (dedupeKey: ${dedupeKey.substring(0, 8)}...)`);

      return isDuplicate;
    } catch (error) {
      console.error('Error checking duplicate presence:', error);
      return false; // If error, don't block creation
    }
  }

  // Quota Usage
  async getQuotaUsage(month: string): Promise<QuotaUsage | undefined> {
    const result = await this.db.get(`quotaUsage:${month}`);
    
    // Handle deeply nested response structure from Replit Database
    let data = result;
    while (data && typeof data === 'object' && 'ok' in data && 'value' in data) {
      if (data.ok) {
        data = data.value;
      } else {
        // If we hit a failed response, return undefined
        console.log('Quota usage not found for month:', month);
        return undefined;
      }
    }
    
    // Check if we have valid quota data
    if (data && typeof data === 'object' && 'month' in data) {
      return data as QuotaUsage;
    }
    
    return undefined;
  }

  async updateQuotaUsage(month: string, apiCalls: number): Promise<void> {
    const existing = await this.getQuotaUsage(month);
    const now = new Date();

    if (existing) {
      existing.totalApiCalls += apiCalls;
      existing.remainingCalls = Math.max(0, existing.remainingCalls - apiCalls);
      existing.lastUpdated = now;
      await this.db.set(`quotaUsage:${month}`, existing);
    } else {
      const quotaUsage: QuotaUsage = {
        id: await this.getNextId('quotaUsage'),
        month,
        totalApiCalls: apiCalls,
        remainingCalls: Math.max(0, 1000 - apiCalls),
        lastUpdated: now
      };
      await this.db.set(`quotaUsage:${month}`, quotaUsage);
    }
  }

  // Due Alerts
  async getDueAlerts(): Promise<Alert[]> {
    const now = new Date();
    const alerts = await this.getAlerts();
    return alerts.filter(alert =>
      alert.isActive &&
      alert.nextRunTime &&
      alert.nextRunTime <= now
    );
  }

  // Calculate next run time based on frequency
  private calculateNextRunTime(frequency: string): Date {
    const now = new Date();
    switch (frequency) {
      case 'hourly':
        return new Date(now.getTime() + 60 * 60 * 1000); // +1 hour
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +1 week
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        return nextMonth;
      case 'daily':
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // +1 day
    }
  }
}