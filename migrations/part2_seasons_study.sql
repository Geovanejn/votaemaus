-- PARTE 2: SEASONS E ESTUDOS

CREATE TABLE IF NOT EXISTS "seasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"description" text,
	"cover_image_url" text,
	"pdf_url" text,
	"ai_extracted_title" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"total_lessons" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"created_by" integer REFERENCES "users"("id"),
	"ai_metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "study_weeks" (
	"id" serial PRIMARY KEY NOT NULL,
	"week_number" integer NOT NULL,
	"year" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"pdf_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"created_by" integer REFERENCES "users"("id"),
	"ai_metadata" text,
	"season_id" integer REFERENCES "seasons"("id"),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "study_weeks_week_number_year_unique" UNIQUE("week_number","year")
);

CREATE TABLE IF NOT EXISTS "study_lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"study_week_id" integer REFERENCES "study_weeks"("id"),
	"season_id" integer REFERENCES "seasons"("id"),
	"order_index" integer NOT NULL,
	"lesson_number" integer,
	"title" text NOT NULL,
	"type" text DEFAULT 'study' NOT NULL,
	"description" text,
	"xp_reward" integer DEFAULT 10 NOT NULL,
	"estimated_minutes" integer DEFAULT 5 NOT NULL,
	"icon" text,
	"is_bonus" boolean DEFAULT false NOT NULL,
	"has_bonus_quiz" boolean DEFAULT false NOT NULL,
	"bonus_quiz_questions" text,
	"is_locked" boolean DEFAULT true NOT NULL,
	"is_released" boolean DEFAULT false NOT NULL,
	"release_date" timestamp,
	"unlock_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "study_units" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL REFERENCES "study_lessons"("id"),
	"order_index" integer NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"xp_value" integer DEFAULT 2 NOT NULL,
	"stage" text DEFAULT 'estude' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"custom_icon_url" text,
	"xp_reward" integer DEFAULT 0 NOT NULL,
	"category" text NOT NULL,
	"requirement" text,
	"is_secret" boolean DEFAULT false NOT NULL,
	"season_id" integer REFERENCES "seasons"("id")
);
