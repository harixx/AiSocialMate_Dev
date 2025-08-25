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

export const storage = new ReplitStorage();