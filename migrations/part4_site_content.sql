-- PARTE 4: CONTEUDO DO SITE

CREATE TABLE IF NOT EXISTS "devotionals" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"author_id" integer REFERENCES "users"("id"),
	"author_name" text,
	"bible_reference" text,
	"image_url" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"views_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "site_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"max_participants" integer,
	"registration_deadline" timestamp,
	"created_by" integer REFERENCES "users"("id"),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "event_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL REFERENCES "site_events"("id"),
	"user_id" integer REFERENCES "users"("id"),
	"guest_name" text,
	"guest_email" text,
	"guest_phone" text,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "event_registrations_event_user_unique" UNIQUE("event_id","user_id")
);

CREATE TABLE IF NOT EXISTS "board_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer REFERENCES "users"("id"),
	"position_id" integer REFERENCES "positions"("id"),
	"position_name" text NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"photo_url" text,
	"display_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"image_url" text NOT NULL,
	"link_url" text,
	"link_text" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "site_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL UNIQUE,
	"title" text,
	"content" text,
	"image_url" text,
	"metadata" text,
	"updated_by" integer REFERENCES "users"("id"),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "prayer_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"whatsapp" text,
	"request" text NOT NULL,
	"category" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"prayed_by" integer REFERENCES "users"("id"),
	"prayed_at" timestamp,
	"is_public" boolean DEFAULT false NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"approved_by" integer REFERENCES "users"("id"),
	"approved_at" timestamp,
	"auto_moderation_status" text,
	"moderation_details" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "devotional_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"devotional_id" integer NOT NULL REFERENCES "devotionals"("id"),
	"user_id" integer REFERENCES "users"("id"),
	"author_name" text,
	"content" text NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"approved_by" integer REFERENCES "users"("id"),
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
