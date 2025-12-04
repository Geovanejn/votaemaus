import { sql } from "drizzle-orm";
import { sqliteTable, integer, text, unique } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import crypto from "crypto";

// Utility function to generate Gravatar URL from email
export function getGravatarUrl(email: string): string {
  const hash = crypto
    .createHash("md5")
    .update(email.toLowerCase().trim())
    .digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?d=mp&s=200`;
}

// Utility function to generate verification hash for PDF
export function generatePdfVerificationHash(electionId: number, electionName: string, timestamp: string): string {
  const data = `${electionId}-${electionName}-${timestamp}-${Math.random()}`;
  return crypto.createHash("sha256").update(data).digest("hex");
}

// Users table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  hasPassword: integer("has_password", { mode: "boolean" }).notNull().default(false),
  photoUrl: text("photo_url"),
  birthdate: text("birthdate"),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  isMember: integer("is_member", { mode: "boolean" }).notNull().default(true),
  activeMember: integer("active_member", { mode: "boolean" }).notNull().default(true),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Positions table (fixed positions)
export const positions = sqliteTable("positions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
});

export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Position = typeof positions.$inferSelect;

// Elections table
export const elections = sqliteTable("elections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  closedAt: text("closed_at"),
});

// Election Winners table - tracks which candidate won each position (for tie resolution in 3rd scrutiny)
export const electionWinners = sqliteTable("election_winners", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  electionId: integer("election_id").notNull().references(() => elections.id),
  positionId: integer("position_id").notNull().references(() => positions.id),
  candidateId: integer("candidate_id").notNull().references(() => candidates.id),
  wonAtScrutiny: integer("won_at_scrutiny").notNull(), // Which scrutiny this winner was chosen (1, 2, or 3)
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const insertElectionSchema = createInsertSchema(elections).omit({
  id: true,
  isActive: true,
  createdAt: true,
});

export type InsertElection = z.infer<typeof insertElectionSchema>;
export type Election = typeof elections.$inferSelect;

export const insertElectionWinnerSchema = createInsertSchema(electionWinners).omit({
  id: true,
  createdAt: true,
});

export type InsertElectionWinner = z.infer<typeof insertElectionWinnerSchema>;
export type ElectionWinner = typeof electionWinners.$inferSelect;

// Election Positions table - tracks each position within an election sequentially
export const electionPositions = sqliteTable("election_positions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  electionId: integer("election_id").notNull().references(() => elections.id),
  positionId: integer("position_id").notNull().references(() => positions.id),
  orderIndex: integer("order_index").notNull(), // Order in which positions are voted (0 = first)
  status: text("status").notNull().default("pending"), // pending, active, completed
  currentScrutiny: integer("current_scrutiny").notNull().default(1), // 1, 2, or 3
  openedAt: text("opened_at"),
  closedAt: text("closed_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const insertElectionPositionSchema = createInsertSchema(electionPositions).omit({
  id: true,
  status: true,
  currentScrutiny: true,
  createdAt: true,
});

export type InsertElectionPosition = z.infer<typeof insertElectionPositionSchema>;
export type ElectionPosition = typeof electionPositions.$inferSelect;

// Election Attendance table - tracks which members are present for voting per position
export const electionAttendance = sqliteTable("election_attendance", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  electionId: integer("election_id").notNull().references(() => elections.id),
  electionPositionId: integer("election_position_id").references(() => electionPositions.id), // Link to specific position opening
  memberId: integer("member_id").notNull().references(() => users.id),
  isPresent: integer("is_present", { mode: "boolean" }).notNull().default(false),
  markedAt: text("marked_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const insertElectionAttendanceSchema = createInsertSchema(electionAttendance).omit({
  id: true,
  createdAt: true,
});

export type InsertElectionAttendance = z.infer<typeof insertElectionAttendanceSchema>;
export type ElectionAttendance = typeof electionAttendance.$inferSelect;

// Candidates table
export const candidates = sqliteTable("candidates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(), // Email to fetch Gravatar photo
  userId: integer("user_id").notNull().references(() => users.id), // Reference to user
  positionId: integer("position_id").notNull().references(() => positions.id),
  electionId: integer("election_id").notNull().references(() => elections.id),
}, (table) => ({
  // Prevent duplicate candidates for same user, position, and election
  uniqueCandidate: unique().on(table.userId, table.positionId, table.electionId),
}));

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
});

export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;

// Votes table
export const votes = sqliteTable("votes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  voterId: integer("voter_id").notNull().references(() => users.id),
  candidateId: integer("candidate_id").notNull().references(() => candidates.id),
  positionId: integer("position_id").notNull().references(() => positions.id),
  electionId: integer("election_id").notNull().references(() => elections.id),
  scrutinyRound: integer("scrutiny_round").notNull().default(1), // 1, 2, or 3
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  createdAt: true,
});

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;

// Verification Codes table
export const verificationCodes = sqliteTable("verification_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: text("expires_at").notNull(),
  isPasswordReset: integer("is_password_reset", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const insertVerificationCodeSchema = createInsertSchema(verificationCodes).omit({
  id: true,
  createdAt: true,
});

export type InsertVerificationCode = z.infer<typeof insertVerificationCodeSchema>;
export type VerificationCode = typeof verificationCodes.$inferSelect;

// PDF Verification table
export const pdfVerifications = sqliteTable("pdf_verifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  electionId: integer("election_id").notNull().references(() => elections.id),
  verificationHash: text("verification_hash").notNull().unique(),
  presidentName: text("president_name"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const insertPdfVerificationSchema = createInsertSchema(pdfVerifications).omit({
  id: true,
  createdAt: true,
});

export type InsertPdfVerification = z.infer<typeof insertPdfVerificationSchema>;
export type PdfVerification = typeof pdfVerifications.$inferSelect;

// Auth schemas
export const requestCodeSchema = z.object({
  email: z.string().email("Email inválido"),
  isPasswordReset: z.boolean().optional(),
});

export type RequestCodeData = z.infer<typeof requestCodeSchema>;

export const verifyCodeSchema = z.object({
  email: z.string().email("Email inválido"),
  code: z.string().length(6, "Código deve ter 6 dígitos"),
});

export type VerifyCodeData = z.infer<typeof verifyCodeSchema>;

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export type LoginData = z.infer<typeof loginSchema>;

export const registerSchema = loginSchema.extend({
  fullName: z.string().min(2, "Nome completo é obrigatório"),
});

export type RegisterData = z.infer<typeof registerSchema>;

export const addMemberSchema = z.object({
  fullName: z.string().min(2, "Nome completo é obrigatório"),
  email: z.string().email("Email inválido"),
  photoUrl: z.string().optional(),
  birthdate: z.string().optional(),
  activeMember: z.boolean().default(true),
});

export type AddMemberData = z.infer<typeof addMemberSchema>;

export const updateMemberSchema = z.object({
  fullName: z.string().min(2, "Nome completo é obrigatório").optional(),
  email: z.string().email("Email inválido").optional(),
  photoUrl: z.string().optional(),
  birthdate: z.string().optional(),
  activeMember: z.boolean().optional(),
});

export type UpdateMemberData = z.infer<typeof updateMemberSchema>;

export const setPasswordSchema = z.object({
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type SetPasswordData = z.infer<typeof setPasswordSchema>;

export const loginPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export type LoginPasswordData = z.infer<typeof loginPasswordSchema>;

// Response types
export type AuthResponse = {
  user: Omit<User, "password">;
  token: string;
};

export type CandidateWithDetails = Candidate & {
  positionName: string;
  electionName: string;
  voteCount?: number;
  photoUrl?: string;
};

export type PositionWithCandidates = Position & {
  candidates: Candidate[];
};

export type ElectionResults = {
  electionId: number;
  electionName: string;
  isActive: boolean;
  currentScrutiny: number;
  presentCount: number; // Number of members present
  createdAt: string; // Election opening date/time
  closedAt: string | null; // Election closing date/time
  positions: Array<{
    positionId: number;
    positionName: string;
    status: string; // pending, active, completed
    currentScrutiny: number; // Current scrutiny for this position
    orderIndex: number; // Order in which position is voted
    totalVoters: number; // Total number of voters in this scrutiny
    majorityThreshold: number; // Half + 1 (for scrutiny 1&2) or simple majority (scrutiny 3)
    needsNextScrutiny: boolean; // If no candidate reached majority
    winnerId?: number; // ID of elected candidate (if any)
    winnerScrutiny?: number; // Which scrutiny elected the winner
    candidates: Array<{
      candidateId: number;
      candidateName: string;
      candidateEmail: string;
      photoUrl: string;
      voteCount: number;
      isElected: boolean;
      electedInScrutiny?: number; // 1, 2, or 3
      wonAtScrutiny?: number; // Alias for electedInScrutiny
    }>;
  }>;
};

export type VoterActivity = {
  voterId: number;
  voterName: string;
  voterEmail: string;
  positionName: string;
  candidateName: string;
  scrutinyRound: number;
  votedAt: string;
};

export type VoterAttendance = {
  voterId: number;
  voterName: string;
  voterEmail: string;
  firstVoteAt: string;
  totalVotes: number;
};

export type ElectionAuditData = {
  results: ElectionResults;
  electionMetadata: {
    createdAt: string;
    closedAt?: string;
    totalPositions: number;
    completedPositions: number;
    totalMembers: number;
  };
  voterAttendance: VoterAttendance[];
  voteTimeline: VoterActivity[];
  scrutinyHistory?: Array<{
    positionId: number;
    positionName: string;
    scrutinies: Array<{
      round: number;
      candidates: Array<{
        candidateId: number;
        candidateName: string;
        candidateEmail: string;
        voteCount: number;
        advancedToNext: boolean;
        isElected: boolean;
      }>;
    }>;
  }>;
};

// ==================== SISTEMA DE ESTUDOS (DUOLINGO-STYLE) ====================

// Perfil de gamificação do usuário
export const studyProfiles = sqliteTable("study_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  totalXp: integer("total_xp").notNull().default(0),
  currentLevel: integer("current_level").notNull().default(1),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  hearts: integer("hearts").notNull().default(5),
  heartsMax: integer("hearts_max").notNull().default(5),
  heartsRefillAt: text("hearts_refill_at"),
  lastActivityDate: text("last_activity_date"),
  dailyGoalMinutes: integer("daily_goal_minutes").notNull().default(10),
  timezone: text("timezone").notNull().default("America/Sao_Paulo"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => ({
  uniqueUser: unique().on(table.userId),
}));

export const insertStudyProfileSchema = createInsertSchema(studyProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStudyProfile = z.infer<typeof insertStudyProfileSchema>;
export type StudyProfile = typeof studyProfiles.$inferSelect;

// Semanas de estudo
export const studyWeeks = sqliteTable("study_weeks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  weekNumber: integer("week_number").notNull(),
  year: integer("year").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  pdfUrl: text("pdf_url"),
  status: text("status").notNull().default("draft"), // processing, draft, published, archived
  publishedAt: text("published_at"),
  createdBy: integer("created_by").references(() => users.id),
  aiMetadata: text("ai_metadata"), // JSON string
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => ({
  uniqueWeek: unique().on(table.weekNumber, table.year),
}));

export const insertStudyWeekSchema = createInsertSchema(studyWeeks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStudyWeek = z.infer<typeof insertStudyWeekSchema>;
export type StudyWeek = typeof studyWeeks.$inferSelect;

// Lições dentro de cada semana
export const studyLessons = sqliteTable("study_lessons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studyWeekId: integer("study_week_id").notNull().references(() => studyWeeks.id),
  orderIndex: integer("order_index").notNull(),
  title: text("title").notNull(),
  type: text("type").notNull().default("study"), // intro, study, meditation, challenge, review
  description: text("description"),
  xpReward: integer("xp_reward").notNull().default(10),
  estimatedMinutes: integer("estimated_minutes").notNull().default(5),
  icon: text("icon"),
  isBonus: integer("is_bonus", { mode: "boolean" }).notNull().default(false),
  isLocked: integer("is_locked", { mode: "boolean" }).notNull().default(true), // Admin controls lesson availability
  unlockDate: text("unlock_date"), // Optional scheduled unlock date
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
});

export const insertStudyLessonSchema = createInsertSchema(studyLessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStudyLesson = z.infer<typeof insertStudyLessonSchema>;
export type StudyLesson = typeof studyLessons.$inferSelect;

// Unidades/Exercícios dentro de cada lição
export const studyUnits = sqliteTable("study_units", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  lessonId: integer("lesson_id").notNull().references(() => studyLessons.id),
  orderIndex: integer("order_index").notNull(),
  type: text("type").notNull(), // text, multiple_choice, true_false, fill_blank, meditation, reflection, verse
  content: text("content").notNull(), // JSON string with exercise content
  xpValue: integer("xp_value").notNull().default(2),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const insertStudyUnitSchema = createInsertSchema(studyUnits).omit({
  id: true,
  createdAt: true,
});

export type InsertStudyUnit = z.infer<typeof insertStudyUnitSchema>;
export type StudyUnit = typeof studyUnits.$inferSelect;

// Versículos para recuperar vidas
export const bibleVerses = sqliteTable("bible_verses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reference: text("reference").notNull(), // "João 3:16"
  text: text("text").notNull(),
  reflection: text("reflection"),
  category: text("category"), // fé, amor, esperança
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const insertBibleVerseSchema = createInsertSchema(bibleVerses).omit({
  id: true,
  createdAt: true,
});

export type InsertBibleVerse = z.infer<typeof insertBibleVerseSchema>;
export type BibleVerse = typeof bibleVerses.$inferSelect;

// Progresso do usuário em cada lição
export const userLessonProgress = sqliteTable("user_lesson_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  lessonId: integer("lesson_id").notNull().references(() => studyLessons.id),
  status: text("status").notNull().default("locked"), // locked, available, in_progress, completed
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  xpEarned: integer("xp_earned").notNull().default(0),
  mistakesCount: integer("mistakes_count").notNull().default(0),
  perfectScore: integer("perfect_score", { mode: "boolean" }).notNull().default(false),
  timeSpentSeconds: integer("time_spent_seconds").notNull().default(0),
}, (table) => ({
  uniqueUserLesson: unique().on(table.userId, table.lessonId),
}));

export const insertUserLessonProgressSchema = createInsertSchema(userLessonProgress).omit({
  id: true,
});

export type InsertUserLessonProgress = z.infer<typeof insertUserLessonProgressSchema>;
export type UserLessonProgress = typeof userLessonProgress.$inferSelect;

// Progresso do usuário em cada unidade
export const userUnitProgress = sqliteTable("user_unit_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  unitId: integer("unit_id").notNull().references(() => studyUnits.id),
  isCompleted: integer("is_completed", { mode: "boolean" }).notNull().default(false),
  answerGiven: text("answer_given"), // JSON string
  isCorrect: integer("is_correct", { mode: "boolean" }),
  attempts: integer("attempts").notNull().default(0),
  completedAt: text("completed_at"),
}, (table) => ({
  uniqueUserUnit: unique().on(table.userId, table.unitId),
}));

export const insertUserUnitProgressSchema = createInsertSchema(userUnitProgress).omit({
  id: true,
});

export type InsertUserUnitProgress = z.infer<typeof insertUserUnitProgressSchema>;
export type UserUnitProgress = typeof userUnitProgress.$inferSelect;

// Registro de leitura de versículos (para recuperar vidas)
export const verseReadings = sqliteTable("verse_readings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  verseId: integer("verse_id").notNull().references(() => bibleVerses.id),
  readAt: text("read_at").notNull().default(sql`(datetime('now'))`),
  heartsRecovered: integer("hearts_recovered").notNull().default(1),
});

export const insertVerseReadingSchema = createInsertSchema(verseReadings).omit({
  id: true,
  readAt: true,
});

export type InsertVerseReading = z.infer<typeof insertVerseReadingSchema>;
export type VerseReading = typeof verseReadings.$inferSelect;

// Transações de XP
export const xpTransactions = sqliteTable("xp_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  source: text("source").notNull(), // lesson, challenge, streak_bonus, achievement, perfect_lesson
  sourceId: integer("source_id"),
  description: text("description"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const insertXpTransactionSchema = createInsertSchema(xpTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertXpTransaction = z.infer<typeof insertXpTransactionSchema>;
export type XpTransaction = typeof xpTransactions.$inferSelect;

// Registro diário de atividade (para streak)
export const dailyActivity = sqliteTable("daily_activity", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  activityDate: text("activity_date").notNull(),
  minutesStudied: integer("minutes_studied").notNull().default(0),
  lessonsCompleted: integer("lessons_completed").notNull().default(0),
  xpEarned: integer("xp_earned").notNull().default(0),
  streakMaintained: integer("streak_maintained", { mode: "boolean" }).notNull().default(false),
}, (table) => ({
  uniqueUserDate: unique().on(table.userId, table.activityDate),
}));

export const insertDailyActivitySchema = createInsertSchema(dailyActivity).omit({
  id: true,
});

export type InsertDailyActivity = z.infer<typeof insertDailyActivitySchema>;
export type DailyActivity = typeof dailyActivity.$inferSelect;

// Conquistas disponíveis
export const achievements = sqliteTable("achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  xpReward: integer("xp_reward").notNull().default(0),
  category: text("category").notNull(), // streak, xp, lessons, special
  requirement: text("requirement"), // JSON string with requirement conditions
  isSecret: integer("is_secret", { mode: "boolean" }).notNull().default(false),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
});

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

// Conquistas do usuário
export const userAchievements = sqliteTable("user_achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  achievementId: integer("achievement_id").notNull().references(() => achievements.id),
  unlockedAt: text("unlocked_at").notNull().default(sql`(datetime('now'))`),
}, (table) => ({
  uniqueUserAchievement: unique().on(table.userId, table.achievementId),
}));

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  unlockedAt: true,
});

export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;

// Leaderboard entries
export const leaderboardEntries = sqliteTable("leaderboard_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  periodType: text("period_type").notNull(), // weekly, monthly, all_time
  periodKey: text("period_key").notNull(), // "2024-W48", "2024-12", "all"
  xpEarned: integer("xp_earned").notNull().default(0),
  rankPosition: integer("rank_position"),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
}, (table) => ({
  uniqueUserPeriod: unique().on(table.userId, table.periodType, table.periodKey),
}));

export const insertLeaderboardEntrySchema = createInsertSchema(leaderboardEntries).omit({
  id: true,
  updatedAt: true,
});

export type InsertLeaderboardEntry = z.infer<typeof insertLeaderboardEntrySchema>;
export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;

// ==================== SISTEMA DE MISSÕES DIÁRIAS ====================

// Tipos de missões disponíveis
export const missionTypes = [
  "complete_lesson",      // Conclua uma lição da trilha
  "read_daily_verse",     // Leia o versículo do dia
  "timed_challenge",      // Desafio cronometrado
  "quick_quiz",           // Quiz rápido (3 perguntas)
  "bible_character",      // Personagem bíblico do dia
  "perfect_answers",      // Respostas perfeitas seguidas
  "memorize_theme",       // Memorize o tema
  "simple_prayer",        // Oração simples
  "bible_fact",           // Fato bíblico do dia
  "maintain_streak",      // Mantenha a sequência
] as const;

export type MissionType = typeof missionTypes[number];

// Templates de missões disponíveis
export const dailyMissions = sqliteTable("daily_missions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(), // MissionType
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // lucide icon name
  xpReward: integer("xp_reward").notNull().default(10),
  requirement: text("requirement"), // JSON with specific requirements
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const insertDailyMissionSchema = createInsertSchema(dailyMissions).omit({
  id: true,
});

export type InsertDailyMission = z.infer<typeof insertDailyMissionSchema>;
export type DailyMission = typeof dailyMissions.$inferSelect;

// Missões atribuídas ao usuário para o dia
export const userDailyMissions = sqliteTable("user_daily_missions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  missionId: integer("mission_id").notNull().references(() => dailyMissions.id),
  assignedDate: text("assigned_date").notNull(), // YYYY-MM-DD format
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  completedAt: text("completed_at"),
  xpAwarded: integer("xp_awarded").notNull().default(0),
}, (table) => ({
  uniqueUserMissionDate: unique().on(table.userId, table.missionId, table.assignedDate),
}));

export const insertUserDailyMissionSchema = createInsertSchema(userDailyMissions).omit({
  id: true,
  completed: true,
  completedAt: true,
  xpAwarded: true,
});

export type InsertUserDailyMission = z.infer<typeof insertUserDailyMissionSchema>;
export type UserDailyMission = typeof userDailyMissions.$inferSelect;

// Conteúdo gerado por AI para missões (versículo, fato, personagem)
export const dailyMissionContent = sqliteTable("daily_mission_content", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  contentDate: text("content_date").notNull().unique(), // YYYY-MM-DD
  dailyVerse: text("daily_verse"), // JSON: { reference, text, reflection }
  bibleFact: text("bible_fact"), // JSON: { title, fact, source }
  bibleCharacter: text("bible_character"), // JSON: { name, summary, lesson }
  dailyTheme: text("daily_theme"), // JSON: { theme, explanation }
  timedQuizQuestions: text("timed_quiz_questions"), // JSON array of questions
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const insertDailyMissionContentSchema = createInsertSchema(dailyMissionContent).omit({
  id: true,
  createdAt: true,
});

export type InsertDailyMissionContent = z.infer<typeof insertDailyMissionContentSchema>;
export type DailyMissionContent = typeof dailyMissionContent.$inferSelect;

// ==================== TIPOS COMPOSTOS DO SISTEMA DE ESTUDOS ====================

export type StudyProfileWithUser = StudyProfile & {
  userName: string;
  userEmail: string;
  userPhotoUrl?: string;
};

export type StudyLessonWithProgress = StudyLesson & {
  status: "locked" | "available" | "in_progress" | "completed";
  xpEarned?: number;
  perfectScore?: boolean;
};

export type StudyWeekWithLessons = StudyWeek & {
  lessons: StudyLessonWithProgress[];
  totalXp: number;
  completedLessons: number;
};

export type LeaderboardRanking = {
  userId: number;
  userName: string;
  userPhotoUrl?: string;
  totalXp: number;
  level: number;
  streak: number;
  rank: number;
};

export type AchievementWithStatus = Achievement & {
  unlocked: boolean;
  unlockedAt?: string;
};

// Missão diária com status do usuário
export type UserDailyMissionWithDetails = UserDailyMission & {
  mission: DailyMission;
};

// Resumo das missões do dia
export type DailyMissionsStatus = {
  missions: UserDailyMissionWithDetails[];
  completedCount: number;
  totalCount: number;
  allCompleted: boolean;
  bonusXpAvailable: number;
  content?: DailyMissionContent;
};

// ==================== PUSH NOTIFICATIONS ====================

// Push Subscriptions table - stores push notification subscriptions
export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(), // Public key
  auth: text("auth").notNull(), // Auth secret
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  lastUsed: text("last_used"),
}, (table) => ({
  uniqueUserEndpoint: unique().on(table.userId, table.endpoint),
}));

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
  lastUsed: true,
});

export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;

// Notifications table - stores notification history
export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // streak_reminder, lesson_available, achievement, election, system
  title: text("title").notNull(),
  body: text("body").notNull(),
  data: text("data"), // JSON with additional data
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  readAt: text("read_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  read: true,
  readAt: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Notification types
export type NotificationType = 
  | "streak_reminder" 
  | "lesson_available" 
  | "achievement" 
  | "election" 
  | "birthday"
  | "system";
