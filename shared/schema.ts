import { sql } from "drizzle-orm";
import { pgTable, serial, integer, text, boolean, unique, timestamp, real, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import crypto from "crypto";

// ==================== UTILS ====================

export function getGravatarUrl(email: string): string {
  const hash = crypto.createHash("md5").update(email.toLowerCase().trim()).digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?d=mp&s=200`;
}

export function generatePdfVerificationHash(electionId: number, electionName: string, timestamp: string): string {
  const data = `${electionId}-${electionName}-${timestamp}-${Math.random()}`;
  return crypto.createHash("sha256").update(data).digest("hex");
}

export type Secretaria = "none" | "espiritualidade" | "marketing" | "tesouraria" | null;

// ==================== CORE: USUÁRIOS E AUTH ====================

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  hasPassword: boolean("has_password").notNull().default(false),
  photoUrl: text("photo_url"),
  birthdate: text("birthdate"),
  isAdmin: boolean("is_admin").notNull().default(false),
  isMember: boolean("is_member").notNull().default(true),
  activeMember: boolean("active_member").notNull().default(true),
  secretaria: text("secretaria"),
  isTreasurer: boolean("is_treasurer").notNull().default(false),
  activeMemberSince: timestamp("active_member_since"),
});

export const verificationCodes = pgTable("verification_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isPasswordReset: boolean("is_password_reset").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ==================== SISTEMA DE VOTAÇÃO (VOTAEMAUS) ====================

export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const elections = pgTable("elections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
});

export const electionPositions = pgTable("election_positions", {
  id: serial("id").primaryKey(),
  electionId: integer("election_id").notNull().references(() => elections.id),
  positionId: integer("position_id").notNull().references(() => positions.id),
  orderIndex: integer("order_index").notNull(),
  status: text("status").notNull().default("pending"),
  currentScrutiny: integer("current_scrutiny").notNull().default(1),
  openedAt: timestamp("opened_at"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  positionId: integer("position_id").notNull().references(() => positions.id),
  electionId: integer("election_id").notNull().references(() => elections.id),
}, (table) => ({
  uniqueCandidate: unique().on(table.userId, table.positionId, table.electionId),
}));

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  voterId: integer("voter_id").notNull().references(() => users.id),
  candidateId: integer("candidate_id").notNull().references(() => candidates.id),
  positionId: integer("position_id").notNull().references(() => positions.id),
  electionId: integer("election_id").notNull().references(() => elections.id),
  scrutinyRound: integer("scrutiny_round").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const electionWinners = pgTable("election_winners", {
  id: serial("id").primaryKey(),
  electionId: integer("election_id").notNull().references(() => elections.id),
  positionId: integer("position_id").notNull().references(() => positions.id),
  candidateId: integer("candidate_id").notNull().references(() => candidates.id),
  wonAtScrutiny: integer("won_at_scrutiny").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const electionAttendance = pgTable("election_attendance", {
  id: serial("id").primaryKey(),
  electionId: integer("election_id").notNull().references(() => elections.id),
  electionPositionId: integer("election_position_id").references(() => electionPositions.id),
  memberId: integer("member_id").notNull().references(() => users.id),
  isPresent: boolean("is_present").notNull().default(false),
  markedAt: timestamp("marked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pdfVerifications = pgTable("pdf_verifications", {
  id: serial("id").primaryKey(),
  electionId: integer("election_id").notNull().references(() => elections.id),
  verificationHash: text("verification_hash").notNull().unique(),
  presidentName: text("president_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ==================== CONTEÚDO DO SITE ====================

export const devotionals = pgTable("devotionals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  verse: text("verse").notNull(),
  verseReference: text("verse_reference").notNull(),
  content: text("content").notNull(),
  contentHtml: text("content_html"),
  summary: text("summary"),
  prayer: text("prayer"),
  imageUrl: text("image_url"),
  author: text("author"),
  youtubeUrl: text("youtube_url"),
  instagramUrl: text("instagram_url"),
  audioUrl: text("audio_url"),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
  isPublished: boolean("is_published").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const siteEvents = pgTable("site_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  location: text("location"),
  category: text("category").notNull().default("geral"),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const prayerRequests = pgTable("prayer_requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  whatsapp: text("whatsapp"),
  category: text("category").notNull().default("outros"),
  request: text("request").notNull(),
  status: text("status").notNull().default("pending"),
  prayedBy: integer("prayed_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const instagramPosts = pgTable("instagram_posts", {
  id: serial("id").primaryKey(),
  instagramId: text("instagram_id"),
  caption: text("caption"),
  imageUrl: text("image_url").notNull(),
  permalink: text("permalink"),
  postedAt: timestamp("posted_at").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

// ==================== SISTEMA DE ESTUDOS (DEOGLORY) ====================

export const studyProfiles = pgTable("study_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  totalXp: integer("total_xp").notNull().default(0),
  currentLevel: integer("current_level").notNull().default(1),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  hearts: integer("hearts").notNull().default(5),
  heartsMax: integer("hearts_max").notNull().default(5),
  crystals: integer("crystals").notNull().default(0),
  lastLessonDate: text("last_lesson_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const seasons = pgTable("seasons", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, published, archived
  isLocked: boolean("is_locked").notNull().default(false),
  totalLessons: integer("total_lessons").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const studyLessons = pgTable("study_lessons", {
  id: serial("id").primaryKey(),
  seasonId: integer("season_id").references(() => seasons.id),
  orderIndex: integer("order_index").notNull(),
  title: text("title").notNull(),
  xpReward: integer("xp_reward").notNull().default(10),
  isLocked: boolean("is_locked").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const studyUnits = pgTable("study_units", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => studyLessons.id),
  orderIndex: integer("order_index").notNull(),
  type: text("type").notNull(), // text, quiz, verse
  content: text("content").notNull(),
  xpValue: integer("xp_value").notNull().default(2),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bibleVerses = pgTable("bible_verses", {
  id: serial("id").primaryKey(),
  reference: text("reference").notNull().unique(), // <--- CRÍTICO PARA O SEED
  text: text("text").notNull(),
  reflection: text("reflection"),
  category: text("category"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const verseReadings = pgTable("verse_readings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  verseId: integer("verse_id").notNull().references(() => bibleVerses.id),
  readAt: timestamp("read_at").notNull().defaultNow(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  xpReward: integer("xp_reward").notNull().default(0),
  category: text("category").notNull(),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
}, (table) => ({
  uniqueUserAchievement: unique().on(table.userId, table.achievementId),
}));

export const dailyMissions = pgTable("daily_missions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  xpReward: integer("xp_reward").notNull().default(10),
  isActive: boolean("is_active").notNull().default(true),
});

export const userDailyMissions = pgTable("user_daily_missions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  missionId: integer("mission_id").notNull().references(() => dailyMissions.id),
  assignedDate: text("assigned_date").notNull(), // YYYY-MM-DD
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  uniqueUserMissionDate: unique().on(table.userId, table.missionId, table.assignedDate),
}));

// ==================== TESOURARIA E LOJA ====================

export const treasuryEntries = pgTable("treasury_entries", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // income, expense
  category: text("category").notNull(),
  description: text("description"),
  amount: integer("amount").notNull(),
  userId: integer("user_id").references(() => users.id),
  paymentStatus: text("payment_status").notNull().default("pending"),
  referenceMonth: integer("reference_month"),
  referenceYear: integer("reference_year").notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shopCategories = pgTable("shop_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  isDefault: boolean("is_default").notNull().default(false),
});

export const shopItems = pgTable("shop_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  categoryId: integer("category_id").notNull().references(() => shopCategories.id),
  isAvailable: boolean("is_available").notNull().default(true),
  stockQuantity: integer("stock_quantity"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shopOrders = pgTable("shop_orders", {
  id: serial("id").primaryKey(),
  orderCode: text("order_code").notNull().unique(),
  userId: integer("user_id").notNull().references(() => users.id),
  totalAmount: integer("total_amount").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  orderStatus: text("order_status").notNull().default("awaiting_payment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== INFRAESTRUTURA ====================

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: integer("resource_id"),
  details: text("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ==================== SCHEMAS ZOD & TYPES ====================

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertBibleVerseSchema = createInsertSchema(bibleVerses).omit({ id: true, createdAt: true });
export type BibleVerse = typeof bibleVerses.$inferSelect;

export const insertStudyProfileSchema = createInsertSchema(studyProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export type StudyProfile = typeof studyProfiles.$inferSelect;

export const insertTreasuryEntrySchema = createInsertSchema(treasuryEntries).omit({ id: true, createdAt: true });
export type TreasuryEntry = typeof treasuryEntries.$inferSelect;

// [Adicione outros tipos conforme necessário para o seu frontend]
