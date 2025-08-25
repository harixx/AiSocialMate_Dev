
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
    const current = await this.db.get(key) || 0;
    const next = current + 1;
    await this.db.set(key, next);
    return next;
  }

  private async getAllByType<T>(type: string): Promise<T[]> {
    try {
      console.log(`🔍 Getting all items of type: ${type}`);
      const keys = await this.db.list(`${type}:`);
      console.log(`📋 Found keys for ${type}:`, keys);
      // Ensure keys is an array
      const keyArray = Array.isArray(keys) ? keys : [];
      console.log(`📊 Key array length: ${keyArray.length}`);
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
  async getAlerts(): Promise<Alert[]> {
    return await this.getAllByType<Alert>('alert');
  }

  async getAlert(id: number): Promise<Alert | undefined> {
    return await this.db.get(`alert:${id}`);
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = await this.getNextId('alert');
    const now = new Date();
    const alert: Alert = { 
      ...insertAlert,
      maxResults: insertAlert.maxResults ?? 10,
      minOpportunityScore: insertAlert.minOpportunityScore ?? "medium",
      includeNegativeSentiment: insertAlert.includeNegativeSentiment ?? false,
      emailNotifications: insertAlert.emailNotifications ?? true,
      email: insertAlert.email ?? null,
      reportUrl: insertAlert.reportUrl ?? null,
      webhookUrl: insertAlert.webhookUrl ?? null,
      isActive: true,
      id,
      createdAt: now,
      lastRun: null
    };
    console.log(`💾 Storing alert with key: alert:${id}`, alert);
    await this.db.set(`alert:${id}`, alert);
    console.log(`✅ Alert stored successfully with ID: ${id}`);
    return alert;
  }

  async updateAlert(id: number, alertUpdate: Partial<Alert>): Promise<Alert | undefined> {
    const existingAlert = await this.getAlert(id);
    if (!existingAlert) return undefined;

    const updatedAlert = { ...existingAlert, ...alertUpdate };
    await this.db.set(`alert:${id}`, updatedAlert);
    return updatedAlert;
  }

  async deleteAlert(id: number): Promise<boolean> {
    const alert = await this.getAlert(id);
    if (!alert) return false;
    await this.db.delete(`alert:${id}`);
    return true;
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
}
