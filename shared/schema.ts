import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  keywords: text("keywords"),
  competitors: jsonb("competitors"), // Array of competitor objects with name, aliases, domains
  platforms: text("platforms").array().notNull(),
  frequency: text("frequency").notNull(),
  minOpportunityScore: text("min_opportunity_score").default("medium"),
  maxResults: integer("max_results").default(10),
  includeNegativeSentiment: boolean("include_negative_sentiment").default(false),
  emailNotifications: boolean("email_notifications").default(true),
  email: text("email"),
  reportUrl: text("report_url"),
  webhookUrl: text("webhook_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastRun: timestamp("last_run"),
  nextRunTime: timestamp("next_run_time"),
  enableFuzzyMatching: boolean("enable_fuzzy_matching").default(false),
  dedupeWindow: integer("dedupe_window").default(30), // days
});

export const searchResults = pgTable("search_results", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'brand-opportunity' | 'thread-discovery'
  query: text("query").notNull(),
  results: jsonb("results").notNull(),
  platforms: text("platforms").array().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const generatedReplies = pgTable("generated_replies", {
  id: serial("id").primaryKey(),
  threadUrl: text("thread_url").notNull(),
  replyType: text("reply_type").notNull(),
  tone: text("tone").notNull(),
  brandName: text("brand_name"),
  brandContext: text("brand_context"),
  brandUrl: text("brand_url"),
  generatedText: text("generated_text").notNull(),
  creativity: text("creativity").default("0.7"),
  aiProvider: text("ai_provider").default("openai"),
  model: text("model").default("gpt-4o"),
  feedback: text("feedback"), // 'like' | 'dislike' | null
  createdAt: timestamp("created_at").defaultNow(),
});

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  keyword: text("keyword").notNull(),
  brandName: text("brand_name").notNull(),
  brandWebsite: text("brand_website"),
  brandDescription: text("brand_description"),
  platforms: text("platforms").array().notNull(),
  questions: jsonb("questions").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const alertRuns = pgTable("alert_runs", {
  id: serial("id").primaryKey(),
  alertId: integer("alert_id").references(() => alerts.id),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  status: text("status").notNull(), // 'running', 'completed', 'failed'
  apiCallsUsed: integer("api_calls_used").default(0),
  newPresencesFound: integer("new_presences_found").default(0),
  errorMessage: text("error_message"),
});

export const presenceRecords = pgTable("presence_records", {
  id: serial("id").primaryKey(),
  alertId: integer("alert_id").references(() => alerts.id),
  runId: integer("run_id").references(() => alertRuns.id),
  competitorName: text("competitor_name").notNull(),
  platform: text("platform").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  snippet: text("snippet"),
  publishedAt: timestamp("published_at"),
  dedupeKey: text("dedupe_key").notNull(), // hash for deduplication
  detectionMethod: text("detection_method").notNull(), // 'exact', 'alias', 'domain', 'fuzzy'
  createdAt: timestamp("created_at").defaultNow(),
});

export const quotaUsage = pgTable("quota_usage", {
  id: serial("id").primaryKey(),
  month: text("month").notNull(), // YYYY-MM format
  totalApiCalls: integer("total_api_calls").default(0),
  remainingCalls: integer("remaining_calls").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
  lastRun: true,
});

export const insertSearchResultSchema = createInsertSchema(searchResults).omit({
  id: true,
  createdAt: true,
});

export const insertGeneratedReplySchema = createInsertSchema(generatedReplies).omit({
  id: true,
  createdAt: true,
});

export const insertFAQSchema = createInsertSchema(faqs).omit({
  id: true,
  createdAt: true,
});

export const insertFaqSchema = createInsertSchema(faqs).omit({
  id: true,
  createdAt: true,
});

export const insertAlertRunSchema = createInsertSchema(alertRuns).omit({
  id: true,
  startTime: true,
});

export const insertPresenceRecordSchema = createInsertSchema(presenceRecords).omit({
  id: true,
  createdAt: true,
});

export const insertQuotaUsageSchema = createInsertSchema(quotaUsage).omit({
  id: true,
  lastUpdated: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type SearchResult = typeof searchResults.$inferSelect;
export type InsertSearchResult = z.infer<typeof insertSearchResultSchema>;
export type GeneratedReply = typeof generatedReplies.$inferSelect;
export type InsertGeneratedReply = z.infer<typeof insertGeneratedReplySchema>;
export type Faq = typeof faqs.$inferSelect;
export type InsertFaq = z.infer<typeof insertFaqSchema>;
export type AlertRun = typeof alertRuns.$inferSelect;
export type InsertAlertRun = z.infer<typeof insertAlertRunSchema>;
export type PresenceRecord = typeof presenceRecords.$inferSelect;
export type InsertPresenceRecord = z.infer<typeof insertPresenceRecordSchema>;
export type QuotaUsage = typeof quotaUsage.$inferSelect;
export type InsertQuotaUsage = z.infer<typeof insertQuotaUsageSchema>;