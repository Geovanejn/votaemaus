-- PARTE 1: TABELAS BASE (SEM DEPENDÊNCIAS)

CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"has_password" boolean DEFAULT false NOT NULL,
	"photo_url" text,
	"birthdate" text,
	"is_admin" boolean DEFAULT false NOT NULL,
	"is_member" boolean DEFAULT true NOT NULL,
	"active_member" boolean DEFAULT true NOT NULL,
	"secretaria" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "positions_name_unique" UNIQUE("name")
);

CREATE TABLE IF NOT EXISTS "elections" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp
);

CREATE TABLE IF NOT EXISTS "bible_verses" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference" text NOT NULL,
	"text" text NOT NULL,
	"reflection" text,
	"category" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "daily_mission_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_date" text NOT NULL,
	"daily_verse" text,
	"bible_fact" text,
	"bible_character" text,
	"daily_theme" text,
	"timed_quiz_questions" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_mission_content_content_date_unique" UNIQUE("content_date")
);

CREATE TABLE IF NOT EXISTS "daily_missions" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"xp_reward" integer DEFAULT 10 NOT NULL,
	"requirement" text,
	"is_active" boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS "streak_milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"days" integer NOT NULL,
	"crystal_reward" integer NOT NULL,
	"xp_reward" integer DEFAULT 0 NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"badge_icon" text,
	CONSTRAINT "streak_milestones_days_unique" UNIQUE("days")
);

CREATE TABLE IF NOT EXISTS "instagram_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"instagram_id" text,
	"caption" text,
	"image_url" text NOT NULL,
	"video_url" text,
	"media_type" text DEFAULT 'IMAGE',
	"permalink" text,
	"likes_count" integer DEFAULT 0,
	"comments_count" integer DEFAULT 0,
	"posted_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured_banner" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_password_reset" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "anonymous_push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"endpoint" text NOT NULL UNIQUE,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used" timestamp
);
