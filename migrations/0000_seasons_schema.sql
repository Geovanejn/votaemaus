CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"custom_icon_url" text,
	"xp_reward" integer DEFAULT 0 NOT NULL,
	"category" text NOT NULL,
	"requirement" text,
	"is_secret" boolean DEFAULT false NOT NULL,
	"season_id" integer,
	CONSTRAINT "achievements_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"image_url" text,
	"background_color" text,
	"link_url" text,
	"link_text" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bible_verses" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference" text NOT NULL,
	"text" text NOT NULL,
	"reflection" text,
	"category" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" text NOT NULL,
	"position" text NOT NULL,
	"photo_url" text,
	"instagram" text,
	"whatsapp" text,
	"bio" text,
	"term_start" text NOT NULL,
	"term_end" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_current" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"user_id" integer NOT NULL,
	"position_id" integer NOT NULL,
	"election_id" integer NOT NULL,
	CONSTRAINT "candidates_user_id_position_id_election_id_unique" UNIQUE("user_id","position_id","election_id")
);
--> statement-breakpoint
CREATE TABLE "daily_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"activity_date" text NOT NULL,
	"minutes_studied" integer DEFAULT 0 NOT NULL,
	"lessons_completed" integer DEFAULT 0 NOT NULL,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"streak_maintained" boolean DEFAULT false NOT NULL,
	CONSTRAINT "daily_activity_user_id_activity_date_unique" UNIQUE("user_id","activity_date")
);
--> statement-breakpoint
CREATE TABLE "daily_mission_content" (
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
--> statement-breakpoint
CREATE TABLE "daily_missions" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"xp_reward" integer DEFAULT 10 NOT NULL,
	"requirement" text,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devotional_readings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"devotional_id" integer NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL,
	"week_key" text,
	CONSTRAINT "devotional_readings_user_id_devotional_id_unique" UNIQUE("user_id","devotional_id")
);
--> statement-breakpoint
CREATE TABLE "devotionals" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"verse" text NOT NULL,
	"verse_reference" text NOT NULL,
	"content" text NOT NULL,
	"summary" text,
	"prayer" text,
	"image_url" text,
	"author" text,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "election_attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"election_id" integer NOT NULL,
	"election_position_id" integer,
	"member_id" integer NOT NULL,
	"is_present" boolean DEFAULT false NOT NULL,
	"marked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "election_positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"election_id" integer NOT NULL,
	"position_id" integer NOT NULL,
	"order_index" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"current_scrutiny" integer DEFAULT 1 NOT NULL,
	"opened_at" timestamp,
	"closed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "election_winners" (
	"id" serial PRIMARY KEY NOT NULL,
	"election_id" integer NOT NULL,
	"position_id" integer NOT NULL,
	"candidate_id" integer NOT NULL,
	"won_at_scrutiny" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "elections" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "instagram_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"caption" text,
	"image_url" text NOT NULL,
	"permalink" text,
	"posted_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leaderboard_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"period_type" text NOT NULL,
	"period_key" text NOT NULL,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"rank_position" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leaderboard_entries_user_id_period_type_period_key_unique" UNIQUE("user_id","period_type","period_key")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"data" text,
	"read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pdf_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"election_id" integer NOT NULL,
	"verification_hash" text NOT NULL,
	"president_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pdf_verifications_verification_hash_unique" UNIQUE("verification_hash")
);
--> statement-breakpoint
CREATE TABLE "positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "positions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "prayer_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text,
	"whatsapp" text,
	"category" text DEFAULT 'outros' NOT NULL,
	"request" text NOT NULL,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"prayed_by" integer,
	"prayed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used" timestamp,
	CONSTRAINT "push_subscriptions_user_id_endpoint_unique" UNIQUE("user_id","endpoint")
);
--> statement-breakpoint
CREATE TABLE "season_final_challenges" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"title" text DEFAULT 'Desafio Final' NOT NULL,
	"description" text,
	"questions" text NOT NULL,
	"question_count" integer DEFAULT 15 NOT NULL,
	"time_limit_seconds" integer DEFAULT 150 NOT NULL,
	"xp_reward" integer DEFAULT 100 NOT NULL,
	"perfect_xp_bonus" integer DEFAULT 50 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "season_rankings" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"lessons_completed" integer DEFAULT 0 NOT NULL,
	"correct_percentage" integer DEFAULT 0 NOT NULL,
	"final_challenge_score" integer,
	"is_mastered" boolean DEFAULT false NOT NULL,
	"rank_position" integer,
	"is_winner" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "season_rankings_season_id_user_id_unique" UNIQUE("season_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "seasons" (
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
	"created_by" integer,
	"ai_metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"page" text NOT NULL,
	"section" text NOT NULL,
	"title" text,
	"content" text,
	"image_url" text,
	"metadata" text,
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "site_content_page_section_unique" UNIQUE("page","section")
);
--> statement-breakpoint
CREATE TABLE "site_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"short_description" text,
	"image_url" text,
	"start_date" text NOT NULL,
	"end_date" text,
	"time" text,
	"location" text,
	"location_url" text,
	"price" text,
	"registration_url" text,
	"category" text DEFAULT 'geral' NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_all_day" boolean DEFAULT false NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_lessons" (
	"id" serial PRIMARY KEY NOT NULL,
	"study_week_id" integer,
	"season_id" integer,
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
--> statement-breakpoint
CREATE TABLE "study_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
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
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "study_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "study_units" (
	"id" serial PRIMARY KEY NOT NULL,
	"lesson_id" integer NOT NULL,
	"order_index" integer NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"xp_value" integer DEFAULT 2 NOT NULL,
	"stage" text DEFAULT 'estude' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_weeks" (
	"id" serial PRIMARY KEY NOT NULL,
	"week_number" integer NOT NULL,
	"year" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"pdf_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"created_by" integer,
	"ai_metadata" text,
	"season_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "study_weeks_week_number_year_unique" UNIQUE("week_number","year")
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"achievement_id" integer NOT NULL,
	"unlocked_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_achievements_user_id_achievement_id_unique" UNIQUE("user_id","achievement_id")
);
--> statement-breakpoint
CREATE TABLE "user_daily_missions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"mission_id" integer NOT NULL,
	"assigned_date" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"xp_awarded" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "user_daily_missions_user_id_mission_id_assigned_date_unique" UNIQUE("user_id","mission_id","assigned_date")
);
--> statement-breakpoint
CREATE TABLE "user_final_challenge_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"challenge_id" integer NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"time_spent_seconds" integer,
	"correct_answers" integer DEFAULT 0 NOT NULL,
	"total_questions" integer DEFAULT 15 NOT NULL,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"is_perfect" boolean DEFAULT false NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"answers_given" text,
	"challenge_token" text,
	CONSTRAINT "user_final_challenge_progress_user_id_challenge_id_unique" UNIQUE("user_id","challenge_id")
);
--> statement-breakpoint
CREATE TABLE "user_lesson_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"lesson_id" integer NOT NULL,
	"status" text DEFAULT 'locked' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"mistakes_count" integer DEFAULT 0 NOT NULL,
	"perfect_score" boolean DEFAULT false NOT NULL,
	"time_spent_seconds" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "user_lesson_progress_user_id_lesson_id_unique" UNIQUE("user_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "user_season_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"season_id" integer NOT NULL,
	"lessons_completed" integer DEFAULT 0 NOT NULL,
	"total_lessons" integer DEFAULT 0 NOT NULL,
	"bonus_lessons_completed" integer DEFAULT 0 NOT NULL,
	"xp_earned" integer DEFAULT 0 NOT NULL,
	"correct_answers" integer DEFAULT 0 NOT NULL,
	"total_answers" integer DEFAULT 0 NOT NULL,
	"hearts_lost" integer DEFAULT 0 NOT NULL,
	"final_challenge_completed" boolean DEFAULT false NOT NULL,
	"final_challenge_perfect" boolean DEFAULT false NOT NULL,
	"is_mastered" boolean DEFAULT false NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"last_activity_at" timestamp,
	CONSTRAINT "user_season_progress_user_id_season_id_unique" UNIQUE("user_id","season_id")
);
--> statement-breakpoint
CREATE TABLE "user_unit_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"unit_id" integer NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"answer_given" text,
	"is_correct" boolean,
	"attempts" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "user_unit_progress_user_id_unit_id_unique" UNIQUE("user_id","unit_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
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
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"is_password_reset" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verse_readings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"verse_id" integer NOT NULL,
	"read_at" timestamp DEFAULT now() NOT NULL,
	"hearts_recovered" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"voter_id" integer NOT NULL,
	"candidate_id" integer NOT NULL,
	"position_id" integer NOT NULL,
	"election_id" integer NOT NULL,
	"scrutiny_round" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_goal_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
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
--> statement-breakpoint
CREATE TABLE "xp_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"source" text NOT NULL,
	"source_id" integer,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_members" ADD CONSTRAINT "board_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_activity" ADD CONSTRAINT "daily_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devotional_readings" ADD CONSTRAINT "devotional_readings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devotional_readings" ADD CONSTRAINT "devotional_readings_devotional_id_devotionals_id_fk" FOREIGN KEY ("devotional_id") REFERENCES "public"."devotionals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devotionals" ADD CONSTRAINT "devotionals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "election_attendance" ADD CONSTRAINT "election_attendance_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "election_attendance" ADD CONSTRAINT "election_attendance_election_position_id_election_positions_id_fk" FOREIGN KEY ("election_position_id") REFERENCES "public"."election_positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "election_attendance" ADD CONSTRAINT "election_attendance_member_id_users_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "election_positions" ADD CONSTRAINT "election_positions_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "election_positions" ADD CONSTRAINT "election_positions_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "election_winners" ADD CONSTRAINT "election_winners_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "election_winners" ADD CONSTRAINT "election_winners_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "election_winners" ADD CONSTRAINT "election_winners_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leaderboard_entries" ADD CONSTRAINT "leaderboard_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdf_verifications" ADD CONSTRAINT "pdf_verifications_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_requests" ADD CONSTRAINT "prayer_requests_prayed_by_users_id_fk" FOREIGN KEY ("prayed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_final_challenges" ADD CONSTRAINT "season_final_challenges_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_rankings" ADD CONSTRAINT "season_rankings_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_rankings" ADD CONSTRAINT "season_rankings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_content" ADD CONSTRAINT "site_content_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_events" ADD CONSTRAINT "site_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_lessons" ADD CONSTRAINT "study_lessons_study_week_id_study_weeks_id_fk" FOREIGN KEY ("study_week_id") REFERENCES "public"."study_weeks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_lessons" ADD CONSTRAINT "study_lessons_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_profiles" ADD CONSTRAINT "study_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_units" ADD CONSTRAINT "study_units_lesson_id_study_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."study_lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_weeks" ADD CONSTRAINT "study_weeks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_weeks" ADD CONSTRAINT "study_weeks_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_daily_missions" ADD CONSTRAINT "user_daily_missions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_daily_missions" ADD CONSTRAINT "user_daily_missions_mission_id_daily_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."daily_missions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_final_challenge_progress" ADD CONSTRAINT "user_final_challenge_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_final_challenge_progress" ADD CONSTRAINT "user_final_challenge_progress_challenge_id_season_final_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."season_final_challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_lesson_id_study_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."study_lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_season_progress" ADD CONSTRAINT "user_season_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_season_progress" ADD CONSTRAINT "user_season_progress_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_unit_progress" ADD CONSTRAINT "user_unit_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_unit_progress" ADD CONSTRAINT "user_unit_progress_unit_id_study_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."study_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verse_readings" ADD CONSTRAINT "verse_readings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verse_readings" ADD CONSTRAINT "verse_readings_verse_id_bible_verses_id_fk" FOREIGN KEY ("verse_id") REFERENCES "public"."bible_verses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_voter_id_users_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_position_id_positions_id_fk" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_goal_progress" ADD CONSTRAINT "weekly_goal_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_transactions" ADD CONSTRAINT "xp_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;