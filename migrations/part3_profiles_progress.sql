-- PARTE 3: PROFILES E PROGRESSO

CREATE TABLE IF NOT EXISTS "study_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL UNIQUE REFERENCES "users"("id"),
	"total_xp" integer DEFAULT 0 NOT NULL,
	"current_level" integer DEFAULT 1 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"hearts" integer DEFAULT 5 NOT NULL,
	"hearts_max" integer DEFAULT 5 NOT NULL,
	"hearts_refill_at" timestamp,
	"last_activity_date" text,
	"daily_goal_minutes" integer DEFAULT 10 NOT NULL,
	"timezone" text DEFAULT 'America/Sao_Paulo' NOT NULL,
	"weekly_lessons_goal" integer DEFAULT 1 NOT NULL,
	"weekly_verses_goal" integer DEFAULT 7 NOT NULL,
	"weekly_missions_goal" integer DEFAULT 3 NOT NULL,
	"weekly_devotionals_goal" integer DEFAULT 1 NOT NULL,
	"verses_read_for_recovery" integer DEFAULT 0 NOT NULL,
	"crystals" integer DEFAULT 0 NOT NULL,
	"streak_freezes_available" integer DEFAULT 0 NOT NULL,
	"last_lesson_completed_at" timestamp,
	"streak_warning_day" integer DEFAULT 0 NOT NULL,
	"total_streak_freeze_used" integer DEFAULT 0 NOT NULL,
	"consecutive_perfect_lessons" integer DEFAULT 0 NOT NULL,
	"last_perfect_lesson_date" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_lesson_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL REFERENCES "users"("id"),
	"lesson_id" integer NOT NULL REFERENCES "study_lessons"("id"),
	"current_unit_index" integer DEFAULT 0 NOT NULL,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"is_perfect" boolean DEFAULT false NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"answers_given" text,
	CONSTRAINT "user_lesson_progress_user_id_lesson_id_unique" UNIQUE("user_id","lesson_id")
);

CREATE TABLE IF NOT EXISTS "user_unit_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL REFERENCES "users"("id"),
	"unit_id" integer NOT NULL REFERENCES "study_units"("id"),
	"is_completed" boolean DEFAULT false NOT NULL,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"answer_given" text,
	"is_correct" boolean,
	"completed_at" timestamp,
	CONSTRAINT "user_unit_progress_user_id_unit_id_unique" UNIQUE("user_id","unit_id")
);

CREATE TABLE IF NOT EXISTS "user_daily_missions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL REFERENCES "users"("id"),
	"mission_id" integer NOT NULL REFERENCES "daily_missions"("id"),
	"mission_date" text NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "user_daily_missions_user_id_mission_id_date_unique" UNIQUE("user_id","mission_id","mission_date")
);
