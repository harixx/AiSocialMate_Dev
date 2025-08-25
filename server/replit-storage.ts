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
    const current = await this.db.get(key);
    const currentNumber = typeof current === 'number' ? current : 0;
    const next = currentNumber + 1;
    await this.db.set(key, next);
    console.log(`🔢 Generated ID for ${type}: ${next} (previous: ${current})`);
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
        const item = await this.db.get(key);
        console.log(`📄 Retrieved item for key ${key}:`, item ? 'Found' : 'Not found');
        if (item) items.push(item);
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
    const validKeys: string[] = [];

    for (const key of keys.value) {
      // Skip malformed keys
      if (key.includes('[object Object]')) {
        console.log(`🗑️ Skipping malformed key: ${key}`);
        continue;
      }

      // Validate key format
      if (!key.match(/^alert:\d+$/)) {
        console.log(`⚠️ Invalid key format: ${key}`);
        continue;
      }

      const item = await this.db.get(key);
      if (item.ok && item.value) {
        const alert = item.value as Alert;
        // Ensure the alert has required properties
        if (alert.name && alert.id && typeof alert.id === 'number') {
          alerts.push(alert);
          validKeys.push(key);
          console.log(`✅ Valid alert loaded: ${alert.name} (ID: ${alert.id})`);
        } else {
          console.log(`❌ Invalid alert data in key ${key}:`, alert);
        }
      }
    }

    console.log(`✅ Returning ${alerts.length} valid alerts`);
    return alerts.sort((a, b) => a.id - b.id);
  }

  async getAlert(id: number): Promise<Alert | undefined> {
    return await this.db.get(`alert:${id}`);
  }

  // Create Alert
  async createAlert(alertData: any): Promise<Alert> {
    const alerts = await this.getAlerts();

    // Generate a proper sequential ID
    const existingIds = alerts
      .map(a => a.id)
      .filter(id => typeof id === 'number' && !isNaN(id))
      .sort((a, b) => a - b);

    const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;

    console.log(`🔢 Generated ID for alert: ${nextId}`);

    const alert: Alert = {
      ...alertData,
      id: nextId,
      isActive: alertData.isActive ?? true,
      createdAt: new Date(),
      lastRun: null,
      nextRunTime: this.calculateNextRunTime(alertData.frequency || 'daily')
    };

    const key = `alert:${nextId}`;
    console.log(`💾 Storing alert with key: ${key}`);

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
    return alertId ? runs.filter(run => run.alertId === alertId) : runs;
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
      filtered = filtered.filter(record => record.alertId === alertId);
    }

    if (competitorName) {
      filtered = filtered.filter(record => record.competitorName === competitorName);
    }

    return filtered.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async checkDuplicatePresence(dedupeKey: string, competitorName: string, windowDays: number): Promise<boolean> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - windowDays);

    const records = await this.getAllByType<PresenceRecord>('presenceRecord');
    return records.some(record =>
      record.dedupeKey === dedupeKey &&
      record.competitorName === competitorName &&
      record.createdAt && record.createdAt > cutoffDate
    );
  }

  // Quota Usage
  async getQuotaUsage(month: string): Promise<QuotaUsage | undefined> {
    return await this.db.get(`quotaUsage:${month}`);
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

  // Placeholder for calculateNextRunTime as it's not provided in the original code
  // Assuming a simple daily calculation for demonstration
  private calculateNextRunTime(frequency: string): Date | null {
    if (frequency === 'daily') {
      const nextRun = new Date();
      nextRun.setDate(nextRun.getDate() + 1);
      return nextRun;
    }
    // Add other frequency calculations if needed
    return null;
  }
}