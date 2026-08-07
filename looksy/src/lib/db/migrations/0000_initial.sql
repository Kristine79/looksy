CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"style_preferences" jsonb,
	"notification_settings" jsonb DEFAULT '{"pushEnabled":true,"emailEnabled":true,"quietHoursStart":"22:00","quietHoursEnd":"07:00"}'::jsonb,
	"quiz_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"clerk_user_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"avatar_url" varchar(2048),
	"location" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_user_id_unique" UNIQUE("clerk_user_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "clothing_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"sub_type" varchar(100),
	"brand" varchar(255),
	"material" varchar(100),
	"pattern" varchar(50),
	"colors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"seasons" text[] DEFAULT '{}' NOT NULL,
	"formality" smallint DEFAULT 3 NOT NULL,
	"condition" varchar(50) DEFAULT 'good' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"wear_count" integer DEFAULT 0 NOT NULL,
	"last_worn" timestamp with time zone,
	"notes" text,
	"ai_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"ai_confidence" real,
	"ai_model_version" varchar(100),
	"ai_payload" jsonb,
	"ai_error" text,
	"ai_processed_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_clothing_items_formality" CHECK ("clothing_items"."formality" between 1 and 5),
	CONSTRAINT "chk_clothing_items_ai_confidence" CHECK ("clothing_items"."ai_confidence" is null or "clothing_items"."ai_confidence" between 0 and 1)
);
--> statement-breakpoint
CREATE TABLE "item_photos" (
	"id" uuid PRIMARY KEY NOT NULL,
	"item_id" uuid NOT NULL,
	"url" varchar(2048) NOT NULL,
	"thumbnail_url" varchar(2048),
	"storage_path" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item_embeddings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"item_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"text_repr" text,
	"model" varchar(100) DEFAULT 'text-embedding-3-small' NOT NULL,
	"dimension" smallint DEFAULT 1536 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outfit_feedback" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"outfit_id" uuid,
	"action" varchar(20) NOT NULL,
	"swap_out_item_id" uuid,
	"swap_in_item_id" uuid,
	"rating" smallint,
	"feedback_tags" text[],
	"notes" text,
	"context" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_outfit_feedback_rating" CHECK ("outfit_feedback"."rating" is null or "outfit_feedback"."rating" between 1 and 4)
);
--> statement-breakpoint
CREATE TABLE "outfit_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"outfit_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outfits" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255),
	"source" varchar(20) DEFAULT 'ai' NOT NULL,
	"status" varchar(20) DEFAULT 'generated' NOT NULL,
	"occasion" varchar(50),
	"mood" varchar(50),
	"weather" jsonb,
	"explanation" text,
	"scores" jsonb,
	"evidence" jsonb,
	"generation_context" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wear_log" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"outfit_id" uuid,
	"worn_at" timestamp with time zone DEFAULT now() NOT NULL,
	"occasion" varchar(50),
	"weather" jsonb,
	"source" varchar(20) DEFAULT 'outfit' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wear_log_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"wear_log_id" uuid NOT NULL,
	"item_id" uuid,
	"position" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fashion_memories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"category" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"confidence" real DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'emerging' NOT NULL,
	"data_points" integer DEFAULT 0 NOT NULL,
	"consistency" real DEFAULT 0 NOT NULL,
	"source" varchar(20) DEFAULT 'behavioral' NOT NULL,
	"last_signal_at" timestamp with time zone,
	"last_confirmed" timestamp with time zone,
	"last_influenced" timestamp with time zone,
	"user_confirmed_at" timestamp with time zone,
	"user_corrected_at" timestamp with time zone,
	"correction_text" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_fashion_memories_confidence" CHECK ("fashion_memories"."confidence" between 0 and 1),
	CONSTRAINT "chk_fashion_memories_consistency" CHECK ("fashion_memories"."consistency" between 0 and 1)
);
--> statement-breakpoint
CREATE TABLE "memory_evidence" (
	"id" uuid PRIMARY KEY NOT NULL,
	"memory_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"text" text NOT NULL,
	"source_type" varchar(30) NOT NULL,
	"source_id" uuid,
	"data" jsonb,
	"confidence" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_memory_evidence_confidence" CHECK ("memory_evidence"."confidence" is null or "memory_evidence"."confidence" between 0 and 1)
);
--> statement-breakpoint
CREATE TABLE "user_style_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"style_vec" vector(1536) NOT NULL,
	"dna" jsonb,
	"items_analyzed" integer DEFAULT 0 NOT NULL,
	"outfits_analyzed" integer DEFAULT 0 NOT NULL,
	"model" varchar(100) DEFAULT 'text-embedding-3-small' NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"event_name" varchar(100) NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clothing_items" ADD CONSTRAINT "clothing_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_photos" ADD CONSTRAINT "item_photos_item_id_clothing_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."clothing_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_embeddings" ADD CONSTRAINT "item_embeddings_item_id_clothing_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."clothing_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_embeddings" ADD CONSTRAINT "item_embeddings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outfit_feedback" ADD CONSTRAINT "outfit_feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outfit_feedback" ADD CONSTRAINT "outfit_feedback_outfit_id_outfits_id_fk" FOREIGN KEY ("outfit_id") REFERENCES "public"."outfits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outfit_feedback" ADD CONSTRAINT "outfit_feedback_swap_out_item_id_clothing_items_id_fk" FOREIGN KEY ("swap_out_item_id") REFERENCES "public"."clothing_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outfit_feedback" ADD CONSTRAINT "outfit_feedback_swap_in_item_id_clothing_items_id_fk" FOREIGN KEY ("swap_in_item_id") REFERENCES "public"."clothing_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outfit_items" ADD CONSTRAINT "outfit_items_outfit_id_outfits_id_fk" FOREIGN KEY ("outfit_id") REFERENCES "public"."outfits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outfit_items" ADD CONSTRAINT "outfit_items_item_id_clothing_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."clothing_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outfits" ADD CONSTRAINT "outfits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wear_log" ADD CONSTRAINT "wear_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wear_log" ADD CONSTRAINT "wear_log_outfit_id_outfits_id_fk" FOREIGN KEY ("outfit_id") REFERENCES "public"."outfits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wear_log_items" ADD CONSTRAINT "wear_log_items_wear_log_id_wear_log_id_fk" FOREIGN KEY ("wear_log_id") REFERENCES "public"."wear_log"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wear_log_items" ADD CONSTRAINT "wear_log_items_item_id_clothing_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."clothing_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fashion_memories" ADD CONSTRAINT "fashion_memories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_evidence" ADD CONSTRAINT "memory_evidence_memory_id_fashion_memories_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."fashion_memories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_style_profiles" ADD CONSTRAINT "user_style_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_clothing_items_user_status" ON "clothing_items" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_clothing_items_user_type" ON "clothing_items" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "idx_clothing_items_user_created" ON "clothing_items" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_clothing_items_seasons" ON "clothing_items" USING gin ("seasons");--> statement-breakpoint
CREATE INDEX "idx_clothing_items_ai_pending" ON "clothing_items" USING btree ("ai_status") WHERE "clothing_items"."ai_status" in ('pending', 'processing');--> statement-breakpoint
CREATE INDEX "idx_item_photos_item_sort" ON "item_photos" USING btree ("item_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_item_photos_primary" ON "item_photos" USING btree ("item_id") WHERE "item_photos"."is_primary" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_item_embeddings_item_model" ON "item_embeddings" USING btree ("item_id","model");--> statement-breakpoint
CREATE INDEX "idx_item_embeddings_user" ON "item_embeddings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_item_embeddings_vec" ON "item_embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "idx_outfit_feedback_user_created" ON "outfit_feedback" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_outfit_feedback_outfit" ON "outfit_feedback" USING btree ("outfit_id");--> statement-breakpoint
CREATE INDEX "idx_outfit_feedback_action" ON "outfit_feedback" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_outfit_feedback_swap_out" ON "outfit_feedback" USING btree ("swap_out_item_id");--> statement-breakpoint
CREATE INDEX "idx_outfit_feedback_swap_in" ON "outfit_feedback" USING btree ("swap_in_item_id");--> statement-breakpoint
CREATE INDEX "idx_outfit_items_outfit_pos" ON "outfit_items" USING btree ("outfit_id","position");--> statement-breakpoint
CREATE INDEX "idx_outfit_items_item" ON "outfit_items" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "idx_outfits_user_created" ON "outfits" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_outfits_user_status" ON "outfits" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_wear_log_user_worn" ON "wear_log" USING btree ("user_id","worn_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_wear_log_items_log" ON "wear_log_items" USING btree ("wear_log_id");--> statement-breakpoint
CREATE INDEX "idx_wear_log_items_item" ON "wear_log_items" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "idx_fashion_memories_user_status" ON "fashion_memories" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_fashion_memories_user_type" ON "fashion_memories" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "idx_fashion_memories_user_status_conf" ON "fashion_memories" USING btree ("user_id","status","confidence" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_memory_evidence_memory" ON "memory_evidence" USING btree ("memory_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_analytics_events_name_created" ON "analytics_events" USING btree ("event_name","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_analytics_events_user_created" ON "analytics_events" USING btree ("user_id","created_at" DESC NULLS LAST);