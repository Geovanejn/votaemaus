-- PARTE 6: TABELAS FINAIS

CREATE TABLE IF NOT EXISTS "final_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL REFERENCES "seasons"("id"),
	"title" text NOT NULL,
	"description" text,
	"questions" text NOT NULL,
	"time_limit_minutes" integer DEFAULT 30 NOT NULL,
	"xp_reward" integer DEFAULT 100 NOT NULL,
	"passing_score" integer DEFAULT 70 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_final_challenge_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL REFERENCES "users"("id"),
	"challenge_id" integer NOT NULL REFERENCES "final_challenges"("id"),
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"score" integer DEFAULT 0 NOT NULL,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"is_perfect" boolean DEFAULT false NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"answers_given" text,
	"challenge_token" text,
	CONSTRAINT "user_final_challenge_progress_user_id_challenge_id_unique" UNIQUE("user_id","challenge_id")
);

CREATE TABLE IF NOT EXISTS "weekly_goal_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL REFERENCES "users"("id"),
	"week_key" text NOT NULL,
	"lessons_completed" integer DEFAULT 0 NOT NULL,
	"verses_read" integer DEFAULT 0 NOT NULL,
	"missions_completed" integer DEFAULT 0 NOT NULL,
	"devotionals_read" integer DEFAULT 0 NOT NULL,
	"is_goal_met" boolean DEFAULT false NOT NULL,
	"xp_bonus" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_goal_progress_user_id_week_key_unique" UNIQUE("user_id","week_key")
);

CREATE TABLE IF NOT EXISTS "weekly_practice_bonus" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL REFERENCES "users"("id"),
	"week_key" text NOT NULL,
	"bonus_xp" integer DEFAULT 50 NOT NULL,
	"earned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_practice_bonus_user_week_unique" UNIQUE("user_id", "week_key")
);

CREATE TABLE IF NOT EXISTS "devotional_readings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL REFERENCES "users"("id"),
	"devotional_id" integer NOT NULL REFERENCES "devotionals"("id"),
	"read_at" timestamp DEFAULT now() NOT NULL,
	"week_key" text,
	CONSTRAINT "devotional_readings_user_id_devotional_id_unique" UNIQUE("user_id","devotional_id")
);

CREATE TABLE IF NOT EXISTS "user_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL REFERENCES "users"("id"),
	"achievement_id" integer NOT NULL REFERENCES "achievements"("id"),
	"unlocked_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_achievements_user_id_achievement_id_unique" UNIQUE("user_id","achievement_id")
);

CREATE TABLE IF NOT EXISTS "verse_readings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL REFERENCES "users"("id"),
	"verse_id" integer NOT NULL REFERENCES "bible_verses"("id"),
	"read_at" timestamp DEFAULT now() NOT NULL,
	"hearts_recovered" integer DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS "daily_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL REFERENCES "users"("id"),
	"activity_date" text NOT NULL,
	"minutes_studied" integer DEFAULT 0 NOT NULL,
	"lessons_completed" integer DEFAULT 0 NOT NULL,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"streak_maintained" boolean DEFAULT false NOT NULL,
	CONSTRAINT "daily_activity_user_id_activity_date_unique" UNIQUE("user_id","activity_date")
);
