import { 
  users, alerts, searchResults, generatedReplies, faqs,
  type User, type InsertUser, type Alert, type InsertAlert,
  type SearchResult, type InsertSearchResult,
  type GeneratedReply, type InsertGeneratedReply,
  type Faq, type InsertFaq,
  type InsertAlertRun, type AlertRun,
  type InsertPresenceRecord, type PresenceRecord,
  type QuotaUsage
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Alerts
  getAlerts(): Promise<Alert[]>;
  getAlert(id: number): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: number, alert: Partial<Alert>): Promise<Alert | undefined>;
  deleteAlert(id: number): Promise<boolean>;

  // Search Results
  getSearchResults(type?: string): Promise<SearchResult[]>;
  createSearchResult(result: InsertSearchResult): Promise<SearchResult>;

  // Generated Replies
  getGeneratedReplies(): Promise<GeneratedReply[]>;
  createGeneratedReply(reply: InsertGeneratedReply): Promise<GeneratedReply>;

  // Alert Runs
  createAlertRun(insertAlertRun: InsertAlertRun): Promise<AlertRun>;
  updateAlertRun(id: number, updates: Partial<AlertRun>): Promise<AlertRun | undefined>;
  getAlertRuns(alertId?: number): Promise<AlertRun[]>;

  // Presence Records
  createPresenceRecord(insertPresenceRecord: InsertPresenceRecord): Promise<PresenceRecord>;
  getPresenceRecords(alertId?: number, competitorName?: string): Promise<PresenceRecord[]>;
  checkDuplicatePresence(dedupeKey: string, competitorName: string, windowDays: number): Promise<boolean>;

  // Quota Usage
  getQuotaUsage(month: string): Promise<QuotaUsage | undefined>;
  updateQuotaUsage(month: string, apiCalls: number): Promise<void>;

  // Due Alerts
  getDueAlerts(): Promise<Alert[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private alerts: Map<number, Alert>;
  private searchResults: Map<number, SearchResult>;
  private generatedReplies: Map<number, GeneratedReply>;
  private faqs: Map<number, Faq>;
  private alertRuns = new Map<number, AlertRun>();
  private presenceRecords = new Map<number, PresenceRecord>();
  private quotaUsage = new Map<string, QuotaUsage>();
  private currentUserId = 1;
  private currentAlertId = 1;
  private currentSearchResultId = 1;
  private currentGeneratedReplyId = 1;
  private currentFaqId = 1;
  private currentAlertRunId = 1;
  private currentPresenceRecordId = 1;

  constructor() {
    this.users = new Map();
    this.alerts = new Map();
    this.searchResults = new Map();
    this.generatedReplies = new Map();
    this.faqs = new Map();
    this.alertRuns = new Map();
    this.presenceRecords = new Map();
    this.quotaUsage = new Map();
    this.currentUserId = 1;
    this.currentAlertId = 1;
    this.currentSearchResultId = 1;
    this.currentGeneratedReplyId = 1;
    this.currentFaqId = 1;
    this.currentAlertRunId = 1;
    this.currentPresenceRecordId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values());
  }

  async getAlert(id: number): Promise<Alert | undefined> {
    return this.alerts.get(id);
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = this.currentAlertId++;
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
    this.alerts.set(id, alert);
    return alert;
  }

  async updateAlert(id: number, alertUpdate: Partial<Alert>): Promise<Alert | undefined> {
    const existingAlert = this.alerts.get(id);
    if (!existingAlert) return undefined;

    const updatedAlert = { ...existingAlert, ...alertUpdate };
    this.alerts.set(id, updatedAlert);
    return updatedAlert;
  }

  async deleteAlert(id: number): Promise<boolean> {
    return this.alerts.delete(id);
  }

  async getSearchResults(type?: string): Promise<SearchResult[]> {
    const results = Array.from(this.searchResults.values());
    return type ? results.filter(r => r.type === type) : results;
  }

  async createSearchResult(insertResult: InsertSearchResult): Promise<SearchResult> {
    const id = this.currentSearchResultId++;
    const result: SearchResult = { 
      ...insertResult, 
      id,
      createdAt: new Date()
    };
    this.searchResults.set(id, result);
    return result;
  }

  async getGeneratedReplies(): Promise<GeneratedReply[]> {
    return Array.from(this.generatedReplies.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createGeneratedReply(insertReply: InsertGeneratedReply): Promise<GeneratedReply> {
    const id = this.currentGeneratedReplyId++;
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
    this.generatedReplies.set(id, reply);
    return reply;
  }

  async createFaq(insertFaq: InsertFaq): Promise<Faq> {
    const id = this.currentFaqId++;
    const now = new Date();
    const faq: Faq = { 
      ...insertFaq,
      id,
      createdAt: now
    };
    this.faqs.set(id, faq);
    return faq;
  }

  async getFaqs(): Promise<Faq[]> {
    return Array.from(this.faqs.values());
  }

  async createAlertRun(insertAlertRun: InsertAlertRun): Promise<AlertRun> {
    const id = this.currentAlertRunId++;
    const now = new Date();
    const alertRun: AlertRun = {
      ...insertAlertRun,
      id,
      startTime: now
    };
    this.alertRuns.set(id, alertRun);
    return alertRun;
  }

  async updateAlertRun(id: number, updates: Partial<AlertRun>): Promise<AlertRun | undefined> {
    const alertRun = this.alertRuns.get(id);
    if (!alertRun) return undefined;

    const updatedAlertRun = { ...alertRun, ...updates };
    this.alertRuns.set(id, updatedAlertRun);
    return updatedAlertRun;
  }

  async getAlertRuns(alertId?: number): Promise<AlertRun[]> {
    const runs = Array.from(this.alertRuns.values());
    return alertId ? runs.filter(run => run.alertId === alertId) : runs;
  }

  async createPresenceRecord(insertPresenceRecord: InsertPresenceRecord): Promise<PresenceRecord> {
    const id = this.currentPresenceRecordId++;
    const now = new Date();
    const presenceRecord: PresenceRecord = {
      ...insertPresenceRecord,
      id,
      createdAt: now
    };
    this.presenceRecords.set(id, presenceRecord);
    return presenceRecord;
  }

  async getPresenceRecords(alertId?: number, competitorName?: string): Promise<PresenceRecord[]>{
    const records = Array.from(this.presenceRecords.values());
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

    const records = Array.from(this.presenceRecords.values());
    return records.some(record => 
      record.dedupeKey === dedupeKey && 
      record.competitorName === competitorName &&
      record.createdAt && record.createdAt > cutoffDate
    );
  }

  async getQuotaUsage(month: string): Promise<QuotaUsage | undefined> {
    return this.quotaUsage.get(month);
  }

  async updateQuotaUsage(month: string, apiCalls: number): Promise<void> {
    const existing = this.quotaUsage.get(month);
    const now = new Date();

    if (existing) {
      existing.totalApiCalls += apiCalls;
      existing.remainingCalls = Math.max(0, existing.remainingCalls - apiCalls);
      existing.lastUpdated = now;
    } else {
      this.quotaUsage.set(month, {
        id: Date.now(),
        month,
        totalApiCalls: apiCalls,
        remainingCalls: Math.max(0, 1000 - apiCalls), // Assume 1000 monthly limit
        lastUpdated: now
      });
    }
  }

  async getDueAlerts(): Promise<Alert[]> {
    const now = new Date();
    return Array.from(this.alerts.values()).filter(alert => 
      alert.isActive && 
      alert.nextRunTime && 
      alert.nextRunTime <= now
    );
  }
}

export const storage = new MemStorage();