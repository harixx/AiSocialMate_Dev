CREATE TABLE "alert_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"alert_id" integer,
	"start_time" timestamp DEFAULT now(),
	"end_time" timestamp,
	"status" text NOT NULL,
	"api_calls_used" integer DEFAULT 0,
	"new_presences_found" integer DEFAULT 0,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"keywords" text,
	"competitors" jsonb,
	"platforms" text[] NOT NULL,
	"frequency" text NOT NULL,
	"min_opportunity_score" text DEFAULT 'medium',
	"max_results" integer DEFAULT 10,
	"include_negative_sentiment" boolean DEFAULT false,
	"email_notifications" boolean DEFAULT true,
	"email" text,
	"report_url" text,
	"webhook_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"last_run" timestamp,
	"next_run_time" timestamp,
	"enable_fuzzy_matching" boolean DEFAULT false,
	"dedupe_window" integer DEFAULT 30
);
--> statement-breakpoint
CREATE TABLE "faqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"keyword" text NOT NULL,
	"brand_name" text NOT NULL,
	"brand_website" text,
	"brand_description" text,
	"platforms" text[] NOT NULL,
	"questions" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "generated_replies" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_url" text NOT NULL,
	"reply_type" text NOT NULL,
	"tone" text NOT NULL,
	"brand_name" text,
	"brand_context" text,
	"brand_url" text,
	"generated_text" text NOT NULL,
	"creativity" text DEFAULT '0.7',
	"ai_provider" text DEFAULT 'openai',
	"model" text DEFAULT 'gpt-4o',
	"feedback" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "presence_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"alert_id" integer,
	"run_id" integer,
	"competitor_name" text NOT NULL,
	"platform" text NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"snippet" text,
	"published_at" timestamp,
	"dedupe_key" text NOT NULL,
	"detection_method" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quota_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"month" text NOT NULL,
	"total_api_calls" integer DEFAULT 0,
	"remaining_calls" integer DEFAULT 0,
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "search_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"query" text NOT NULL,
	"results" jsonb NOT NULL,
	"platforms" text[] NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "alert_runs" ADD CONSTRAINT "alert_runs_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."alerts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presence_records" ADD CONSTRAINT "presence_records_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."alerts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presence_records" ADD CONSTRAINT "presence_records_run_id_alert_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."alert_runs"("id") ON DELETE no action ON UPDATE no action;