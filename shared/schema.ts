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
  keywords: text("keywords").notNull(),
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
