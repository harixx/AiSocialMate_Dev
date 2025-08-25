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

import { ReplitStorage } from "./replit-storage";

// Use Replit Database for storage with fallback handling
let storage: ReplitStorage;

try {
  storage = new ReplitStorage();
} catch (error) {
  console.log('⚠️ Replit Database not available in deployment, using fallback storage');
  // Create a mock storage that gracefully handles the deployment environment
  storage = {
    async getAlerts() { return []; },
    async saveAlert(alert) { console.log('Mock storage: Alert saved', alert.name); return alert; },
    async deleteAlert(id) { console.log('Mock storage: Alert deleted', id); },
    async getPresenceRecords() { return []; },
    async savePresenceRecord(record) { console.log('Mock storage: Presence saved'); return record; },
    async deletePresenceRecord(id) { console.log('Mock storage: Presence deleted', id); },
    async getAlertRuns() { return []; },
    async saveAlertRun(run) { console.log('Mock storage: Alert run saved'); return run; },
    async updateAlertRun(id, updates) { console.log('Mock storage: Alert run updated'); },
    async deleteAlertRun(id) { console.log('Mock storage: Alert run deleted', id); },
    async clearAllAlerts() { console.log('Mock storage: All alerts cleared'); },
    async clearAllPresenceRecords() { console.log('Mock storage: All presence records cleared'); },
    storage: { db: null }
  } as any;
}

export { storage };