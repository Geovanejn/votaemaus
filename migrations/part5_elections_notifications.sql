-- PARTE 5: ELEICOES E NOTIFICACOES

CREATE TABLE IF NOT EXISTS "candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"election_id" integer NOT NULL REFERENCES "elections"("id"),
	"user_id" integer NOT NULL REFERENCES "users"("id"),
	"position_id" integer NOT NULL REFERENCES "positions"("id"),
	"photo_url" text,
	"bio" text,
	"proposals" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"election_id" integer NOT NULL REFERENCES "elections"("id"),
	"voter_id" integer NOT NULL REFERENCES "users"("id"),
	"candidate_id" integer NOT NULL REFERENCES "candidates"("id"),
	"position_id" integer NOT NULL REFERENCES "positions"("id"),
	"scrutiny" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "votes_election_voter_position_scrutiny_unique" UNIQUE("election_id","voter_id","position_id","scrutiny")
);

CREATE TABLE IF NOT EXISTS "election_positions" (
	"id" serial PRIMARY KEY NOT NULL,
	"election_id" integer NOT NULL REFERENCES "elections"("id"),
	"position_id" integer NOT NULL REFERENCES "positions"("id"),
	"is_active" boolean DEFAULT false NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"current_scrutiny" integer DEFAULT 1 NOT NULL,
	"winner_id" integer REFERENCES "candidates"("id"),
	"winning_scrutiny" integer,
	CONSTRAINT "election_positions_election_position_unique" UNIQUE("election_id","position_id")
);

CREATE TABLE IF NOT EXISTS "election_attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"election_id" integer NOT NULL REFERENCES "elections"("id"),
	"user_id" integer NOT NULL REFERENCES "users"("id"),
	"checked_in_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "election_attendance_election_user_unique" UNIQUE("election_id","user_id")
);

CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL REFERENCES "users"("id"),
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);

CREATE TABLE IF NOT EXISTS "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer REFERENCES "users"("id"),
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text DEFAULT 'general' NOT NULL,
	"link" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer REFERENCES "users"("id"),
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"resource_id" integer,
	"details" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "xp_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL REFERENCES "users"("id"),
	"amount" integer NOT NULL,
	"source" text NOT NULL,
	"source_id" integer,
	"description" text,
	"season_id" integer REFERENCES "seasons"("id"),
	"created_at" timestamp DEFAULT now() NOT NULL
);
