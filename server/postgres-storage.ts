import { eq, and, desc, gte } from 'drizzle-orm';
import { db } from './db';
import {
  users, alerts, searchResults, generatedReplies, faqs,
  alertRuns, presenceRecords, quotaUsage,
  type User, type InsertUser, type Alert, type InsertAlert,
  type SearchResult, type InsertSearchResult,
  type GeneratedReply, type InsertGeneratedReply,
  type Faq, type InsertFaq,
  type InsertAlertRun, type AlertRun,
  type InsertPresenceRecord, type PresenceRecord,
  type QuotaUsage
} from "@shared/schema";
import { IStorage } from "./storage";

export class PostgresStorage implements IStorage {
  
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Alerts
  async getAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts).orderBy(desc(alerts.createdAt));
  }

  async getAlert(id: number): Promise<Alert | undefined> {
    const result = await db.select().from(alerts).where(eq(alerts.id, id));
    return result[0];
  }

  async createAlert(alert: InsertAlert): Promise<Alert> {
    const result = await db.insert(alerts).values(alert).returning();
    return result[0];
  }

  async updateAlert(id: number, alertUpdate: Partial<Alert>): Promise<Alert | undefined> {
    const result = await db.update(alerts)
      .set(alertUpdate)
      .where(eq(alerts.id, id))
      .returning();
    return result[0];
  }

  async deleteAlert(id: number): Promise<boolean> {
    const result = await db.delete(alerts).where(eq(alerts.id, id)).returning();
    return result.length > 0;
  }

  // Search Results
  async getSearchResults(type?: string): Promise<SearchResult[]> {
    if (type) {
      return await db.select().from(searchResults)
        .where(eq(searchResults.type, type))
        .orderBy(desc(searchResults.createdAt));
    }
    return await db.select().from(searchResults).orderBy(desc(searchResults.createdAt));
  }

  async createSearchResult(result: InsertSearchResult): Promise<SearchResult> {
    const inserted = await db.insert(searchResults).values(result).returning();
    return inserted[0];
  }

  // Generated Replies
  async getGeneratedReplies(): Promise<GeneratedReply[]> {
    return await db.select().from(generatedReplies).orderBy(desc(generatedReplies.createdAt));
  }

  async createGeneratedReply(reply: InsertGeneratedReply): Promise<GeneratedReply> {
    const inserted = await db.insert(generatedReplies).values(reply).returning();
    return inserted[0];
  }

  // FAQs
  async getFaqs(): Promise<Faq[]> {
    return await db.select().from(faqs).orderBy(desc(faqs.createdAt));
  }

  async createFaq(faq: InsertFaq): Promise<Faq> {
    const inserted = await db.insert(faqs).values(faq).returning();
    return inserted[0];
  }

  // Alert Runs
  async createAlertRun(insertAlertRun: InsertAlertRun): Promise<AlertRun> {
    const inserted = await db.insert(alertRuns).values(insertAlertRun).returning();
    return inserted[0];
  }

  async updateAlertRun(id: number, updates: Partial<AlertRun>): Promise<AlertRun | undefined> {
    const result = await db.update(alertRuns)
      .set(updates)
      .where(eq(alertRuns.id, id))
      .returning();
    return result[0];
  }

  async getAlertRuns(alertId?: number): Promise<AlertRun[]> {
    if (alertId !== undefined) {
      return await db.select().from(alertRuns)
        .where(eq(alertRuns.alertId, alertId))
        .orderBy(desc(alertRuns.startTime));
    }
    return await db.select().from(alertRuns).orderBy(desc(alertRuns.startTime));
  }

  // Presence Records
  async createPresenceRecord(insertPresenceRecord: InsertPresenceRecord): Promise<PresenceRecord> {
    const inserted = await db.insert(presenceRecords).values(insertPresenceRecord).returning();
    return inserted[0];
  }

  async getPresenceRecords(alertId?: number, competitorName?: string): Promise<PresenceRecord[]> {
    let query = db.select().from(presenceRecords);
    
    if (alertId !== undefined && competitorName) {
      query = query.where(
        and(
          eq(presenceRecords.alertId, alertId),
          eq(presenceRecords.competitorName, competitorName)
        )
      ) as any;
    } else if (alertId !== undefined) {
      query = query.where(eq(presenceRecords.alertId, alertId)) as any;
    } else if (competitorName) {
      query = query.where(eq(presenceRecords.competitorName, competitorName)) as any;
    }
    
    return await query.orderBy(desc(presenceRecords.createdAt));
  }

  async checkDuplicatePresence(dedupeKey: string, competitorName: string, windowDays: number): Promise<boolean> {
    const windowDate = new Date();
    windowDate.setDate(windowDate.getDate() - windowDays);
    
    const result = await db.select().from(presenceRecords)
      .where(
        and(
          eq(presenceRecords.dedupeKey, dedupeKey),
          eq(presenceRecords.competitorName, competitorName),
          gte(presenceRecords.createdAt, windowDate)
        )
      );
    
    return result.length > 0;
  }

  // Quota Usage
  async getQuotaUsage(month: string): Promise<QuotaUsage | undefined> {
    const result = await db.select().from(quotaUsage).where(eq(quotaUsage.month, month));
    return result[0];
  }

  async updateQuotaUsage(month: string, apiCalls: number): Promise<void> {
    const existing = await this.getQuotaUsage(month);
    
    if (existing) {
      await db.update(quotaUsage)
        .set({ 
          totalApiCalls: (existing.totalApiCalls || 0) + apiCalls,
          lastUpdated: new Date()
        })
        .where(eq(quotaUsage.month, month));
    } else {
      await db.insert(quotaUsage).values({
        month,
        totalApiCalls: apiCalls
      });
    }
  }

  // Due Alerts
  async getDueAlerts(): Promise<Alert[]> {
    const now = new Date();
    return await db.select().from(alerts)
      .where(
        and(
          eq(alerts.isActive, true),
          gte(alerts.nextRunTime, now)
        )
      );
  }
}
