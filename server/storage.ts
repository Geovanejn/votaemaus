import { db } from "./db";
import { eq, and, desc, asc, sql, isNull, gt, lt, gte, lte, ne, or, inArray } from "drizzle-orm";
import { sendCongratulationsEmail } from "./email";
import { getTodayBrazilDate } from "./utils/date";
import * as schema from "@shared/schema";
import type {
  User,
  InsertUser,
  Position,
  Election,
  InsertElection,
  Candidate,
  InsertCandidate,
  Vote,
  InsertVote,
  VerificationCode,
  InsertVerificationCode,
  CandidateWithDetails,
  ElectionResults,
  ElectionPosition,
  InsertElectionPosition,
  ElectionAttendance,
  InsertElectionAttendance,
  StudyProfile,
  StudyWeek,
  StudyLesson,
  StudyUnit,
  BibleVerse,
  UserLessonProgress,
  UserUnitProgress,
  Achievement,
  DailyMission,
  UserDailyMission,
  DailyMissionContent,
  Devotional,
  SiteEvent,
  InstagramPost,
  PushSubscription,
  AnonymousPushSubscription,
  Notification,
  PrayerRequest,
  InsertPrayerRequest,
  BoardMember,
  InsertBoardMember,
  Banner,
  InsertBanner,
  SiteContent,
  InsertSiteContent,
  AuditLog,
  InsertAuditLog,
  DevotionalComment,
  InsertDevotionalComment,
} from "@shared/schema";

export interface IStorage {
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<Omit<User, 'id'>>): Promise<User | undefined>;
  getAllMembers(excludeAdmins?: boolean): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  deleteMember(id: number): Promise<void>;
  
  getAllPositions(): Promise<Position[]>;
  
  getActiveElection(): Promise<Election | null>;
  getElectionById(id: number): Promise<Election | undefined>;
  createElection(name: string): Promise<Election>;
  closeElection(id: number): Promise<void>;
  finalizeElection(id: number): Promise<void>;
  getElectionHistory(): Promise<Election[]>;
  setWinner(electionId: number, candidateId: number, positionId: number, scrutiny: number): Promise<void>;
  
  getElectionPositions(electionId: number): Promise<ElectionPosition[]>;
  getActiveElectionPosition(electionId: number): Promise<ElectionPosition | null>;
  getElectionPositionById(id: number): Promise<ElectionPosition | null>;
  advancePositionScrutiny(electionPositionId: number): Promise<void>;
  openNextPosition(electionId: number): Promise<ElectionPosition | null>;
  openPosition(electionPositionId: number): Promise<ElectionPosition>;
  completePosition(electionPositionId: number): Promise<void>;
  forceCompletePosition(electionPositionId: number, reason: string, shouldReopen?: boolean): Promise<void>;
  
  getElectionAttendance(electionId: number): Promise<ElectionAttendance[]>;
  getPresentCount(electionId: number): Promise<number>;
  getPresentCountForPosition(electionPositionId: number): Promise<number>;
  isMemberPresent(electionId: number, memberId: number): Promise<boolean>;
  setMemberAttendance(electionId: number, memberId: number, isPresent: boolean): Promise<void>;
  initializeAttendance(electionId: number): Promise<void>;
  createAttendanceSnapshot(electionPositionId: number): Promise<void>;
  
  getAllCandidates(): Promise<Candidate[]>;
  getCandidatesByElection(electionId: number): Promise<CandidateWithDetails[]>;
  getCandidatesByPosition(positionId: number, electionId: number): Promise<Candidate[]>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  clearCandidatesForPosition(positionId: number, electionId: number): Promise<void>;
  
  createVote(vote: InsertVote): Promise<Vote>;
  hasUserVoted(voterId: number, positionId: number, electionId: number, scrutinyRound: number): Promise<boolean>;
  
  getElectionResults(electionId: number): Promise<ElectionResults | null>;
  getLatestElectionResults(): Promise<ElectionResults | null>;
  getElectionWinners(electionId: number): Promise<Array<{ userId: number; positionId: number; candidateId: number; wonAtScrutiny: number }>>;
  
  getVoterAttendance(electionId: number): Promise<Array<any>>;
  getVoteTimeline(electionId: number): Promise<Array<any>>;
  getElectionAuditData(electionId: number): Promise<any | null>;
  
  createVerificationCode(data: InsertVerificationCode): Promise<VerificationCode>;
  getValidVerificationCode(email: string, code: string): Promise<VerificationCode | null>;
  deleteVerificationCodesByEmail(email: string): Promise<void>;
  
  createPdfVerification(electionId: number, verificationHash: string, presidentName?: string): Promise<any>;
  getPdfVerification(verificationHash: string): Promise<any | null>;

  getStudyWeekById(weekId: number): Promise<any | null>;
  getStudyWeekByNumber(weekNumber: number, year: number): Promise<any | null>;
  getAllStudyWeeks(): Promise<any[]>;
  getLessonsForWeek(weekId: number): Promise<any[]>;
  getLessonById(lessonId: number): Promise<any | null>;
  getUnitsByLessonId(lessonId: number): Promise<any[]>;
  getStudyUnitById(unitId: number): Promise<any | null>;
  createStudyWeek(data: { title: string; description?: string; weekNumber: number; year: number; createdBy?: number; aiMetadata?: string }): Promise<any>;
  createStudyLesson(data: { studyWeekId: number; orderIndex: number; title: string; type?: string; description?: string; xpReward?: number; estimatedMinutes?: number; icon?: string; isBonus?: boolean }): Promise<any>;
  createStudyUnit(data: { lessonId: number; orderIndex: number; type: string; content: any; xpValue?: number; stage?: string }): Promise<any>;
  updateStudyLesson(lessonId: number, data: { title?: string; type?: string; description?: string; xpReward?: number; estimatedMinutes?: number; icon?: string; isBonus?: boolean; orderIndex?: number; isLocked?: boolean; unlockDate?: string | null }): Promise<any | null>;
  deleteStudyLesson(lessonId: number): Promise<boolean>;
  updateStudyUnit(unitId: number, data: { type?: string; content?: any; xpValue?: number; orderIndex?: number; stage?: string }): Promise<any | null>;
  deleteStudyUnit(unitId: number): Promise<boolean>;
  updateStudyWeek(weekId: number, data: { title?: string; description?: string; weekNumber?: number; year?: number; status?: string }): Promise<any | null>;
  deleteStudyWeek(weekId: number): Promise<boolean>;
  getUnitsForLesson(lessonId: number): Promise<any[]>;
  publishStudyWeek(weekId: number): Promise<any | null>;
  lockLesson(lessonId: number): Promise<any | null>;
  unlockLesson(lessonId: number): Promise<any | null>;
  setLessonUnlockDate(lessonId: number, unlockDate: string | null): Promise<any | null>;
  unlockAllLessonsForWeek(weekId: number): Promise<number>;
  lockAllLessonsForWeek(weekId: number): Promise<number>;
  setWeeklyUnlockSchedule(weekId: number, startDate: string): Promise<number>;
  
  getDailyMissions(): Promise<any[]>;
  getUserDailyMissions(userId: number, date: string): Promise<any[]>;
  assignDailyMissions(userId: number, date: string): Promise<any[]>;
  getUserMissionById(userId: number, missionId: number, date: string): Promise<any | null>;
  completeMission(userId: number, missionId: number, date: string): Promise<any | null>;
  getDailyMissionContent(date: string): Promise<any | null>;
  createDailyMissionContent(data: any): Promise<any>;
  initializeDailyMissions(): Promise<void>;
  
  getUnreadVersesForUser(userId: number): Promise<any[]>;
  resetUserVerseReadings(userId: number): Promise<void>;
  
  clearAllBibleVerses(): Promise<void>;
  clearAllDailyMissions(): Promise<void>;
  clearAllAchievements(): Promise<void>;
  clearAllStudyProgress(): Promise<void>;
  createDailyMission(data: { type: string; title: string; description: string; icon: string; xpReward: number }): Promise<any>;
  
  getLatestDevotional(): Promise<any | null>;
  getAllDevotionals(limit?: number): Promise<any[]>;
  getAllDevotionalsAdmin(): Promise<any[]>;
  getDevotionalById(id: number): Promise<any | null>;
  createDevotional(data: { title: string; verse: string; verseReference: string; content: string; contentHtml?: string; summary?: string; prayer?: string; imageUrl?: string; author?: string; isPublished?: boolean; isFeatured?: boolean; scheduledAt?: Date; createdBy?: number }): Promise<any>;
  updateDevotional(id: number, data: Partial<{ title: string; verse: string; verseReference: string; content: string; contentHtml?: string; summary?: string; prayer?: string; imageUrl?: string; author?: string; isPublished?: boolean; isFeatured?: boolean; scheduledAt?: Date | null }>): Promise<any | null>;
  deleteDevotional(id: number): Promise<boolean>;
  publishDevotional(id: number): Promise<any | null>;
  unpublishDevotional(id: number): Promise<any | null>;
  clearAllDevotionals(): Promise<void>;
  
  getUpcomingEvents(limit?: number): Promise<any[]>;
  getAllSiteEvents(): Promise<any[]>;
  createSiteEvent(data: { title: string; description?: string; imageUrl?: string; startDate: string; endDate?: string; time?: string; location?: string; isPublished?: boolean }): Promise<any>;
  clearAllSiteEvents(): Promise<void>;
  
  getLatestInstagramPosts(limit?: number): Promise<any[]>;
  createInstagramPost(data: { instagramId?: string; caption?: string; imageUrl: string; videoUrl?: string; mediaType?: string; permalink?: string; likesCount?: number; commentsCount?: number; postedAt?: string; isActive?: boolean }): Promise<any>;
  clearAllInstagramPosts(): Promise<void>;
  getFeaturedInstagramPost(): Promise<any | null>;
  setFeaturedInstagramPost(id: number): Promise<any | null>;
  removeFeaturedInstagramPost(id: number): Promise<void>;
  getInstagramPostById(id: number): Promise<any | null>;
  getInstagramPostsForAdmin(): Promise<any[]>;
  
  getSiteHighlights(): Promise<{ devotional: any | null; events: any[]; instagramPosts: any[]; featuredInstagramPost: any | null }>;
  
  // Study Profile Methods
  getStudyProfile(userId: number): Promise<any | null>;
  getOrCreateStudyProfile(userId: number): Promise<any>;
  getPublishedStudyWeeks(): Promise<any[]>;
  getLessonsWithProgress(userId: number, weekId: number): Promise<any[]>;
  getUserLessonProgress(userId: number, lessonId: number): Promise<any | null>;
  startLesson(userId: number, lessonId: number): Promise<any>;
  submitUnitAnswer(userId: number, unitId: number, answer: any): Promise<any>;
  markUnitAsCompleted(userId: number, unitId: number): Promise<any>;
  completeLesson(userId: number, lessonId: number, xpEarned: number, mistakes: number, timeSpent: number, perfectScore: boolean): Promise<any>;
  getStudyStats(): Promise<any>;
  getCompletedLessonsWithExercises(userId: number): Promise<any[]>;
  
  // Third Scrutiny Methods
  checkThirdScrutinyTie(electionPositionId: number): Promise<{ isTie: boolean; candidates?: any[] }>;
  resolveThirdScrutinyTie(electionPositionId: number, winnerId: number): Promise<void>;
  
  // Notification Methods
  savePushSubscription(userId: number, endpoint: string, p256dh: string, auth: string): Promise<void>;
  removePushSubscription(userId: number, endpoint: string): Promise<void>;
  getUserNotifications(userId: number, limit?: number, offset?: number): Promise<any[]>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  markNotificationRead(userId: number, notificationId: number): Promise<void>;
  markAllNotificationsRead(userId: number): Promise<void>;
  deleteNotification(userId: number, notificationId: number): Promise<void>;
  
  // Push Notification Methods (for notifications.ts)
  getPushSubscriptionsByUserId(userId: number): Promise<PushSubscription[]>;
  updatePushSubscriptionLastUsed(subscriptionId: number): Promise<void>;
  deletePushSubscription(userId: number, endpoint: string): Promise<void>;
  getUsersBySecretaria(secretaria: string): Promise<User[]>;
  getAdminUsers(): Promise<User[]>;
  getActiveMembers(): Promise<User[]>;
  createNotification(data: { userId: number; type: string; title: string; body: string; data?: string | null }): Promise<Notification>;
  
  // DeoGlory Scheduler Methods
  getUsersWithActiveStreakNotStudiedToday(): Promise<{ userId: number; currentStreak: number }[]>;
  getInactiveUsersByDays(days: number): Promise<{ userId: number; daysSinceLastActivity: number }[]>;
  
  // Anonymous Push Subscription Methods (for visitors)
  saveAnonymousPushSubscription(endpoint: string, p256dh: string, auth: string): Promise<void>;
  removeAnonymousPushSubscription(endpoint: string): Promise<void>;
  getAllAnonymousPushSubscriptions(): Promise<AnonymousPushSubscription[]>;
  updateAnonymousPushSubscriptionLastUsed(subscriptionId: number): Promise<void>;
  deleteAnonymousPushSubscriptionByEndpoint(endpoint: string): Promise<void>;
  
  // Bible Verse Methods
  getBibleVerseById(id: number): Promise<any | null>;
  getAllBibleVerses(): Promise<any[]>;
  createBibleVerse(reference: string, text: string, reflection: string, category: string): Promise<any>;
  readVerseAndRecoverHeart(userId: number, verseId: number): Promise<any>;
  getVerseRecoveryProgress(userId: number): Promise<any>;
  
  // Achievement Methods
  getAllAchievements(): Promise<any[]>;
  getUserAchievements(userId: number): Promise<any[]>;
  createAchievement(data: any): Promise<any>;
  
  // Leaderboard Methods
  getLeaderboard(periodType: string, periodKey: string, limit?: number): Promise<any[]>;
  
  // Prayer Requests Methods
  createPrayerRequest(data: InsertPrayerRequest, moderationData?: { hasProfanity?: boolean; hasHateSpeech?: boolean; hasSexualContent?: boolean; moderationDetails?: string }): Promise<PrayerRequest>;
  getAllPrayerRequests(status?: string): Promise<PrayerRequest[]>;
  getPrayerRequestById(id: number): Promise<PrayerRequest | null>;
  getApprovedPrayerRequests(): Promise<PrayerRequest[]>;
  getPendingPrayerRequests(): Promise<PrayerRequest[]>;
  updatePrayerRequestStatus(id: number, status: string, prayedBy?: number): Promise<PrayerRequest | null>;
  approvePrayerRequest(id: number, approvedBy: number): Promise<PrayerRequest | null>;
  autoApprovePrayerRequest(id: number): Promise<PrayerRequest | null>;
  rejectPrayerRequest(id: number, moderatedBy: number, reason?: string): Promise<PrayerRequest | null>;
  incrementPrayerCount(id: number): Promise<PrayerRequest | null>;
  moderatePrayerRequest(id: number, data: { isModerated: boolean; moderatedBy: number; hasProfanity?: boolean; hasHateSpeech?: boolean; hasSexualContent?: boolean; moderationDetails?: string }): Promise<PrayerRequest | null>;
  deletePrayerRequest(id: number): Promise<void>;
  
  // Board Members Methods
  getAllBoardMembers(currentOnly?: boolean): Promise<BoardMember[]>;
  createBoardMember(data: InsertBoardMember): Promise<BoardMember>;
  updateBoardMember(id: number, data: Partial<InsertBoardMember>): Promise<BoardMember | null>;
  deleteBoardMember(id: number): Promise<void>;
  
  // Banners Methods
  getActiveBanners(): Promise<Banner[]>;
  getAllBanners(): Promise<Banner[]>;
  createBanner(data: InsertBanner): Promise<Banner>;
  updateBanner(id: number, data: Partial<InsertBanner>): Promise<Banner | null>;
  deleteBanner(id: number): Promise<void>;
  
  // Site Content Methods
  getSiteContent(page: string, section: string): Promise<SiteContent | null>;
  getAllSiteContent(): Promise<SiteContent[]>;
  
  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: { userId?: number; resource?: string; limit?: number }): Promise<AuditLog[]>;
  upsertSiteContent(data: InsertSiteContent): Promise<SiteContent>;
  
  // Season Methods
  getAllSeasons(): Promise<schema.Season[]>;
  getPublishedSeasons(): Promise<schema.Season[]>;
  getSeasonById(id: number): Promise<schema.Season | null>;
  createSeason(data: schema.InsertSeason): Promise<schema.Season>;
  updateSeason(id: number, data: Partial<schema.InsertSeason>): Promise<schema.Season | null>;
  deleteSeason(id: number): Promise<boolean>;
  publishSeason(id: number): Promise<schema.Season | null>;
  getLessonsForSeason(seasonId: number): Promise<schema.StudyLesson[]>;
  createSeasonLesson(data: { seasonId: number; orderIndex: number; lessonNumber?: number; title: string; type?: string; description?: string; xpReward?: number; estimatedMinutes?: number; icon?: string; isBonus?: boolean }): Promise<schema.StudyLesson>;
  releaseLessonInSeason(lessonId: number): Promise<schema.StudyLesson | null>;
  
  // Final Challenge Methods
  getSeasonFinalChallenge(seasonId: number): Promise<schema.SeasonFinalChallenge | null>;
  createFinalChallenge(data: schema.InsertSeasonFinalChallenge): Promise<schema.SeasonFinalChallenge>;
  updateFinalChallenge(id: number, data: Partial<schema.InsertSeasonFinalChallenge>): Promise<schema.SeasonFinalChallenge | null>;
  startFinalChallenge(userId: number, challengeId: number): Promise<{ progress: schema.UserFinalChallengeProgress; token: string }>;
  submitFinalChallenge(userId: number, challengeId: number, token: string, answers: number[]): Promise<schema.FinalChallengeResult>;
  getUserFinalChallengeProgress(userId: number, challengeId: number): Promise<schema.UserFinalChallengeProgress | null>;
  
  // User Season Progress Methods
  getUserSeasonProgress(userId: number, seasonId: number): Promise<schema.UserSeasonProgress | null>;
  updateUserSeasonProgress(userId: number, seasonId: number, data: Partial<schema.InsertUserSeasonProgress>): Promise<schema.UserSeasonProgress>;
  
  // Season Ranking Methods
  getSeasonRankings(seasonId: number, limit?: number): Promise<schema.SeasonRankingEntry[]>;
  updateSeasonRanking(seasonId: number, userId: number): Promise<schema.SeasonRanking>;
  finalizeSeasonRankings(seasonId: number): Promise<void>;
  
  // Weekly Goal Methods
  getWeeklyGoalProgress(userId: number, weekKey: string): Promise<schema.WeeklyGoalProgress | null>;
  updateWeeklyGoalProgress(userId: number, weekKey: string, data: Partial<schema.InsertWeeklyGoalProgress>): Promise<schema.WeeklyGoalProgress>;
  getWeeklyGoalStatus(userId: number, weekKey: string): Promise<schema.WeeklyGoalStatus>;
  incrementWeeklyLesson(userId: number, weekKey: string): Promise<void>;
  incrementWeeklyVerse(userId: number, weekKey: string): Promise<void>;
  incrementWeeklyMission(userId: number, weekKey: string): Promise<void>;
  incrementWeeklyDevotional(userId: number, weekKey: string): Promise<void>;
  
  // Devotional Reading Methods
  confirmDevotionalRead(userId: number, devotionalId: number, weekKey?: string): Promise<schema.DevotionalReading>;
  hasReadDevotional(userId: number, devotionalId: number): Promise<boolean>;
  getDevotionalReadings(userId: number, limit?: number): Promise<schema.DevotionalReading[]>;
  
  // Devotional Comments Methods
  getApprovedDevotionalComments(devotionalId: number): Promise<DevotionalComment[]>;
  getAllDevotionalComments(): Promise<DevotionalComment[]>;
  createDevotionalComment(data: InsertDevotionalComment): Promise<DevotionalComment>;
  approveDevotionalComment(id: number, approvedBy: number): Promise<DevotionalComment | null>;
  highlightDevotionalComment(id: number, isHighlighted: boolean): Promise<DevotionalComment | null>;
  deleteDevotionalComment(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(schema.users).values(user).returning();
    return newUser;
  }

  async getAllMembers(excludeAdmins: boolean = false): Promise<User[]> {
    if (excludeAdmins) {
      return db.select().from(schema.users)
        .where(and(eq(schema.users.isMember, true), eq(schema.users.isAdmin, false)))
        .orderBy(asc(schema.users.fullName));
    }
    return db.select().from(schema.users)
      .where(eq(schema.users.isMember, true))
      .orderBy(asc(schema.users.fullName));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(schema.users).orderBy(asc(schema.users.fullName));
  }

  async updateUser(id: number, updates: Partial<Omit<User, 'id'>>): Promise<User | undefined> {
    const [updated] = await db.update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, id))
      .returning();
    return updated;
  }

  async deleteMember(id: number): Promise<void> {
    await db.delete(schema.users).where(eq(schema.users.id, id));
  }

  async getAllPositions(): Promise<Position[]> {
    return db.select().from(schema.positions).orderBy(asc(schema.positions.id));
  }

  async getActiveElection(): Promise<Election | null> {
    const [election] = await db.select().from(schema.elections)
      .where(eq(schema.elections.isActive, true))
      .limit(1);
    return election || null;
  }

  async getElectionById(id: number): Promise<Election | undefined> {
    const [election] = await db.select().from(schema.elections)
      .where(eq(schema.elections.id, id))
      .limit(1);
    return election;
  }

  async createElection(name: string): Promise<Election> {
    const [election] = await db.insert(schema.elections)
      .values({ name })
      .returning();
    
    const positions = await this.getAllPositions();
    for (let i = 0; i < positions.length; i++) {
      await db.insert(schema.electionPositions).values({
        electionId: election.id,
        positionId: positions[i].id,
        orderIndex: i,
        status: i === 0 ? 'active' : 'pending',
        currentScrutiny: 1,
      });
    }
    
    await this.initializeAttendance(election.id);
    return election;
  }

  async closeElection(id: number): Promise<void> {
    await db.update(schema.elections)
      .set({ isActive: false, closedAt: new Date() })
      .where(eq(schema.elections.id, id));
    
    await db.update(schema.electionPositions)
      .set({ status: 'completed', closedAt: new Date() })
      .where(eq(schema.electionPositions.electionId, id));
  }

  async finalizeElection(id: number): Promise<void> {
    await db.update(schema.elections)
      .set({ isActive: false, closedAt: new Date() })
      .where(eq(schema.elections.id, id));
  }

  async getElectionHistory(): Promise<Election[]> {
    return db.select().from(schema.elections)
      .where(eq(schema.elections.isActive, false))
      .orderBy(desc(schema.elections.createdAt));
  }

  async setWinner(electionId: number, candidateId: number, positionId: number, scrutiny: number): Promise<void> {
    await db.insert(schema.electionWinners).values({
      electionId,
      candidateId,
      positionId,
      wonAtScrutiny: scrutiny,
    });
  }

  async getElectionPositions(electionId: number): Promise<ElectionPosition[]> {
    return db.select().from(schema.electionPositions)
      .where(eq(schema.electionPositions.electionId, electionId))
      .orderBy(asc(schema.electionPositions.orderIndex));
  }

  async getActiveElectionPosition(electionId: number): Promise<ElectionPosition | null> {
    const [position] = await db.select().from(schema.electionPositions)
      .where(and(
        eq(schema.electionPositions.electionId, electionId),
        eq(schema.electionPositions.status, 'active')
      ))
      .limit(1);
    return position || null;
  }

  async getElectionPositionById(id: number): Promise<ElectionPosition | null> {
    const [position] = await db.select().from(schema.electionPositions)
      .where(eq(schema.electionPositions.id, id))
      .limit(1);
    return position || null;
  }

  async advancePositionScrutiny(electionPositionId: number): Promise<void> {
    const position = await this.getElectionPositionById(electionPositionId);
    if (position && position.currentScrutiny < 3) {
      await db.update(schema.electionPositions)
        .set({ currentScrutiny: position.currentScrutiny + 1 })
        .where(eq(schema.electionPositions.id, electionPositionId));
    }
  }

  async openNextPosition(electionId: number): Promise<ElectionPosition | null> {
    const [nextPosition] = await db.select().from(schema.electionPositions)
      .where(and(
        eq(schema.electionPositions.electionId, electionId),
        eq(schema.electionPositions.status, 'pending')
      ))
      .orderBy(asc(schema.electionPositions.orderIndex))
      .limit(1);
    
    if (nextPosition) {
      await db.update(schema.electionPositions)
        .set({ status: 'active', openedAt: new Date() })
        .where(eq(schema.electionPositions.id, nextPosition.id));
      
      return { ...nextPosition, status: 'active', openedAt: new Date() };
    }
    return null;
  }

  async openPosition(electionPositionId: number): Promise<ElectionPosition> {
    const [position] = await db.update(schema.electionPositions)
      .set({ status: 'active', openedAt: new Date(), currentScrutiny: 1 })
      .where(eq(schema.electionPositions.id, electionPositionId))
      .returning();
    return position;
  }

  async completePosition(electionPositionId: number): Promise<void> {
    await db.update(schema.electionPositions)
      .set({ status: 'completed', closedAt: new Date() })
      .where(eq(schema.electionPositions.id, electionPositionId));
  }

  async forceCompletePosition(electionPositionId: number, reason: string, shouldReopen?: boolean): Promise<void> {
    await this.completePosition(electionPositionId);
    console.log(`Position ${electionPositionId} force completed. Reason: ${reason}`);
  }

  async getElectionAttendance(electionId: number): Promise<ElectionAttendance[]> {
    return db.select().from(schema.electionAttendance)
      .where(eq(schema.electionAttendance.electionId, electionId));
  }

  async getPresentCount(electionId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(schema.electionAttendance)
      .where(and(
        eq(schema.electionAttendance.electionId, electionId),
        eq(schema.electionAttendance.isPresent, true),
        isNull(schema.electionAttendance.electionPositionId)
      ));
    return Number(result[0]?.count || 0);
  }

  async getPresentCountForPosition(electionPositionId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(schema.electionAttendance)
      .where(and(
        eq(schema.electionAttendance.electionPositionId, electionPositionId),
        eq(schema.electionAttendance.isPresent, true)
      ));
    return Number(result[0]?.count || 0);
  }

  async isMemberPresent(electionId: number, memberId: number): Promise<boolean> {
    const [attendance] = await db.select()
      .from(schema.electionAttendance)
      .where(and(
        eq(schema.electionAttendance.electionId, electionId),
        eq(schema.electionAttendance.memberId, memberId),
        eq(schema.electionAttendance.isPresent, true),
        isNull(schema.electionAttendance.electionPositionId)
      ))
      .limit(1);
    return !!attendance;
  }

  async setMemberAttendance(electionId: number, memberId: number, isPresent: boolean): Promise<void> {
    const [existing] = await db.select()
      .from(schema.electionAttendance)
      .where(and(
        eq(schema.electionAttendance.electionId, electionId),
        eq(schema.electionAttendance.memberId, memberId),
        isNull(schema.electionAttendance.electionPositionId)
      ))
      .limit(1);
    
    if (existing) {
      await db.update(schema.electionAttendance)
        .set({ isPresent, markedAt: new Date() })
        .where(eq(schema.electionAttendance.id, existing.id));
    } else {
      await db.insert(schema.electionAttendance).values({
        electionId,
        memberId,
        isPresent,
        markedAt: new Date(),
      });
    }
  }

  async initializeAttendance(electionId: number): Promise<void> {
    const members = await this.getAllMembers();
    for (const member of members) {
      await db.insert(schema.electionAttendance).values({
        electionId,
        memberId: member.id,
        isPresent: false,
      });
    }
  }

  async createAttendanceSnapshot(electionPositionId: number): Promise<void> {
    const position = await this.getElectionPositionById(electionPositionId);
    if (!position) return;
    
    const mainAttendance = await db.select()
      .from(schema.electionAttendance)
      .where(and(
        eq(schema.electionAttendance.electionId, position.electionId),
        isNull(schema.electionAttendance.electionPositionId)
      ));
    
    for (const att of mainAttendance) {
      await db.insert(schema.electionAttendance).values({
        electionId: position.electionId,
        electionPositionId,
        memberId: att.memberId,
        isPresent: att.isPresent,
        markedAt: att.markedAt,
      });
    }
  }

  async getAllCandidates(): Promise<Candidate[]> {
    return db.select().from(schema.candidates);
  }

  async getCandidatesByElection(electionId: number): Promise<CandidateWithDetails[]> {
    const candidates = await db.select({
      id: schema.candidates.id,
      name: schema.candidates.name,
      email: schema.candidates.email,
      userId: schema.candidates.userId,
      positionId: schema.candidates.positionId,
      electionId: schema.candidates.electionId,
      positionName: schema.positions.name,
      electionName: schema.elections.name,
    })
    .from(schema.candidates)
    .leftJoin(schema.positions, eq(schema.candidates.positionId, schema.positions.id))
    .leftJoin(schema.elections, eq(schema.candidates.electionId, schema.elections.id))
    .where(eq(schema.candidates.electionId, electionId));
    
    return candidates.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      userId: c.userId,
      positionId: c.positionId,
      electionId: c.electionId,
      positionName: c.positionName || '',
      electionName: c.electionName || '',
    }));
  }

  async getCandidatesByPosition(positionId: number, electionId: number): Promise<Candidate[]> {
    return db.select().from(schema.candidates)
      .where(and(
        eq(schema.candidates.positionId, positionId),
        eq(schema.candidates.electionId, electionId)
      ));
  }

  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    const [newCandidate] = await db.insert(schema.candidates)
      .values(candidate)
      .returning();
    return newCandidate;
  }

  async clearCandidatesForPosition(positionId: number, electionId: number): Promise<void> {
    await db.delete(schema.candidates)
      .where(and(
        eq(schema.candidates.positionId, positionId),
        eq(schema.candidates.electionId, electionId)
      ));
  }

  async createVote(vote: InsertVote): Promise<Vote> {
    const [newVote] = await db.insert(schema.votes)
      .values(vote)
      .returning();
    return newVote;
  }

  async hasUserVoted(voterId: number, positionId: number, electionId: number, scrutinyRound: number): Promise<boolean> {
    const [vote] = await db.select()
      .from(schema.votes)
      .where(and(
        eq(schema.votes.voterId, voterId),
        eq(schema.votes.positionId, positionId),
        eq(schema.votes.electionId, electionId),
        eq(schema.votes.scrutinyRound, scrutinyRound)
      ))
      .limit(1);
    return !!vote;
  }

  async getElectionResults(electionId: number): Promise<ElectionResults | null> {
    const election = await this.getElectionById(electionId);
    if (!election) return null;

    const positions = await this.getElectionPositions(electionId);
    const presentCount = await this.getPresentCount(electionId);
    const winners = await this.getElectionWinners(electionId);

    // Optimized: Batch fetch all position info in one query
    const positionIds = positions.map(p => p.positionId);
    const allPositionInfo = positionIds.length > 0
      ? await db.select().from(schema.positions).where(inArray(schema.positions.id, positionIds))
      : [];
    const positionInfoMap = new Map(allPositionInfo.map(p => [p.id, p]));

    // Optimized: Batch fetch all candidates for all positions in this election
    // Ordered by id for deterministic results (matching original getCandidatesByPosition behavior)
    const allCandidates = await db.select().from(schema.candidates)
      .where(eq(schema.candidates.electionId, electionId))
      .orderBy(asc(schema.candidates.id));

    // Optimized: Batch fetch all vote counts grouped by candidate and scrutiny
    const allVoteCounts = await db.select({
      candidateId: schema.votes.candidateId,
      scrutinyRound: schema.votes.scrutinyRound,
      count: sql<number>`count(*)`,
    })
      .from(schema.votes)
      .where(eq(schema.votes.electionId, electionId))
      .groupBy(schema.votes.candidateId, schema.votes.scrutinyRound);
    
    // Create a map for quick lookup: "candidateId-scrutiny" -> count
    const voteCountMap = new Map(
      allVoteCounts.map(v => [`${v.candidateId}-${v.scrutinyRound}`, Number(v.count)])
    );

    // Optimized: Batch fetch voter counts per position and scrutiny
    const allVoterCounts = await db.select({
      positionId: schema.votes.positionId,
      scrutinyRound: schema.votes.scrutinyRound,
      count: sql<number>`count(distinct voter_id)`,
    })
      .from(schema.votes)
      .where(eq(schema.votes.electionId, electionId))
      .groupBy(schema.votes.positionId, schema.votes.scrutinyRound);
    
    const voterCountMap = new Map(
      allVoterCounts.map(v => [`${v.positionId}-${v.scrutinyRound}`, Number(v.count)])
    );

    // Now process positions without additional queries
    const positionResults = positions.map(ep => {
      const positionInfo = positionInfoMap.get(ep.positionId);
      
      const candidates = allCandidates.filter(c => c.positionId === ep.positionId);
      
      const candidateResults = candidates.map(c => {
        const voteCount = voteCountMap.get(`${c.id}-${ep.currentScrutiny}`) || 0;
        const winner = winners.find(w => w.candidateId === c.id);
        
        return {
          candidateId: c.id,
          candidateName: c.name,
          candidateEmail: c.email,
          photoUrl: schema.getGravatarUrl(c.email),
          voteCount,
          isElected: !!winner,
          electedInScrutiny: winner?.wonAtScrutiny,
          wonAtScrutiny: winner?.wonAtScrutiny,
        };
      });

      const totalVoters = voterCountMap.get(`${ep.positionId}-${ep.currentScrutiny}`) || 0;
      const majorityThreshold = ep.currentScrutiny < 3 
        ? Math.floor(totalVoters / 2) + 1 
        : Math.ceil(totalVoters / 2);
      
      const maxVotes = Math.max(...candidateResults.map(c => c.voteCount), 0);
      const hasWinner = winners.some(w => w.positionId === ep.positionId);
      const needsNextScrutiny = !hasWinner && maxVotes < majorityThreshold && ep.status === 'active';
      
      const winnerCandidate = winners.find(w => w.positionId === ep.positionId);

      return {
        positionId: ep.positionId,
        positionName: positionInfo?.name || '',
        status: ep.status,
        currentScrutiny: ep.currentScrutiny,
        orderIndex: ep.orderIndex,
        totalVoters,
        majorityThreshold,
        needsNextScrutiny,
        winnerId: winnerCandidate?.candidateId,
        winnerScrutiny: winnerCandidate?.wonAtScrutiny,
        candidates: candidateResults,
      };
    });

    return {
      electionId: election.id,
      electionName: election.name,
      isActive: election.isActive,
      currentScrutiny: positions.find(p => p.status === 'active')?.currentScrutiny || 1,
      presentCount,
      createdAt: election.createdAt?.toISOString() || new Date().toISOString(),
      closedAt: election.closedAt?.toISOString() || null,
      positions: positionResults,
    };
  }

  async getLatestElectionResults(): Promise<ElectionResults | null> {
    const [election] = await db.select()
      .from(schema.elections)
      .orderBy(desc(schema.elections.createdAt))
      .limit(1);
    
    if (!election) return null;
    return this.getElectionResults(election.id);
  }

  async getElectionWinners(electionId: number): Promise<Array<{ userId: number; positionId: number; candidateId: number; wonAtScrutiny: number }>> {
    const winners = await db.select({
      positionId: schema.electionWinners.positionId,
      candidateId: schema.electionWinners.candidateId,
      wonAtScrutiny: schema.electionWinners.wonAtScrutiny,
      userId: schema.candidates.userId,
    })
    .from(schema.electionWinners)
    .leftJoin(schema.candidates, eq(schema.electionWinners.candidateId, schema.candidates.id))
    .where(eq(schema.electionWinners.electionId, electionId));
    
    return winners.map(w => ({
      userId: w.userId || 0,
      positionId: w.positionId,
      candidateId: w.candidateId,
      wonAtScrutiny: w.wonAtScrutiny,
    }));
  }

  async getVoterAttendance(electionId: number): Promise<Array<any>> {
    const result = await db.select({
      voterId: schema.votes.voterId,
      voterName: schema.users.fullName,
      voterEmail: schema.users.email,
      firstVoteAt: sql<string>`min(${schema.votes.createdAt})`,
      totalVotes: sql<number>`count(*)`,
    })
    .from(schema.votes)
    .leftJoin(schema.users, eq(schema.votes.voterId, schema.users.id))
    .where(eq(schema.votes.electionId, electionId))
    .groupBy(schema.votes.voterId, schema.users.fullName, schema.users.email);
    
    return result;
  }

  async getVoteTimeline(electionId: number): Promise<Array<any>> {
    const result = await db.select({
      voterId: schema.votes.voterId,
      voterName: schema.users.fullName,
      voterEmail: schema.users.email,
      positionName: schema.positions.name,
      candidateName: schema.candidates.name,
      scrutinyRound: schema.votes.scrutinyRound,
      votedAt: schema.votes.createdAt,
    })
    .from(schema.votes)
    .leftJoin(schema.users, eq(schema.votes.voterId, schema.users.id))
    .leftJoin(schema.positions, eq(schema.votes.positionId, schema.positions.id))
    .leftJoin(schema.candidates, eq(schema.votes.candidateId, schema.candidates.id))
    .where(eq(schema.votes.electionId, electionId))
    .orderBy(asc(schema.votes.createdAt));
    
    return result;
  }

  async getElectionAuditData(electionId: number): Promise<any | null> {
    const results = await this.getElectionResults(electionId);
    if (!results) return null;

    const election = await this.getElectionById(electionId);
    const voterAttendance = await this.getVoterAttendance(electionId);
    const voteTimeline = await this.getVoteTimeline(electionId);
    const members = await this.getAllMembers();

    return {
      results,
      electionMetadata: {
        createdAt: election?.createdAt?.toISOString() || '',
        closedAt: election?.closedAt?.toISOString(),
        totalPositions: results.positions.length,
        completedPositions: results.positions.filter(p => p.status === 'completed').length,
        totalMembers: members.length,
      },
      voterAttendance,
      voteTimeline,
    };
  }

  async createVerificationCode(data: InsertVerificationCode): Promise<VerificationCode> {
    const [code] = await db.insert(schema.verificationCodes)
      .values(data)
      .returning();
    return code;
  }

  async getValidVerificationCode(email: string, code: string): Promise<VerificationCode | null> {
    const [result] = await db.select()
      .from(schema.verificationCodes)
      .where(and(
        eq(schema.verificationCodes.email, email),
        eq(schema.verificationCodes.code, code),
        gt(schema.verificationCodes.expiresAt, new Date())
      ))
      .orderBy(desc(schema.verificationCodes.createdAt))
      .limit(1);
    return result || null;
  }

  async deleteVerificationCodesByEmail(email: string): Promise<void> {
    await db.delete(schema.verificationCodes)
      .where(eq(schema.verificationCodes.email, email));
  }

  async createPdfVerification(electionId: number, verificationHash: string, presidentName?: string): Promise<any> {
    const [result] = await db.insert(schema.pdfVerifications)
      .values({ electionId, verificationHash, presidentName })
      .returning();
    return result;
  }

  async getPdfVerification(verificationHash: string): Promise<any | null> {
    const [result] = await db.select()
      .from(schema.pdfVerifications)
      .where(eq(schema.pdfVerifications.verificationHash, verificationHash))
      .limit(1);
    return result || null;
  }

  // Study System Methods
  async getStudyWeekById(weekId: number): Promise<any | null> {
    const [week] = await db.select().from(schema.studyWeeks)
      .where(eq(schema.studyWeeks.id, weekId))
      .limit(1);
    return week || null;
  }

  async getStudyWeekByNumber(weekNumber: number, year: number): Promise<any | null> {
    const [week] = await db.select().from(schema.studyWeeks)
      .where(and(
        eq(schema.studyWeeks.weekNumber, weekNumber),
        eq(schema.studyWeeks.year, year)
      ))
      .limit(1);
    return week || null;
  }

  async getAllStudyWeeks(): Promise<any[]> {
    return db.select().from(schema.studyWeeks)
      .orderBy(desc(schema.studyWeeks.year), desc(schema.studyWeeks.weekNumber));
  }

  async getLessonsForWeek(weekId: number): Promise<any[]> {
    return db.select().from(schema.studyLessons)
      .where(eq(schema.studyLessons.studyWeekId, weekId))
      .orderBy(asc(schema.studyLessons.orderIndex));
  }

  async getLessonById(lessonId: number): Promise<any | null> {
    const [lesson] = await db.select().from(schema.studyLessons)
      .where(eq(schema.studyLessons.id, lessonId))
      .limit(1);
    return lesson || null;
  }

  async getUnitsByLessonId(lessonId: number): Promise<any[]> {
    return db.select().from(schema.studyUnits)
      .where(eq(schema.studyUnits.lessonId, lessonId))
      .orderBy(asc(schema.studyUnits.orderIndex));
  }

  async getStudyUnitById(unitId: number): Promise<any | null> {
    const [unit] = await db.select().from(schema.studyUnits)
      .where(eq(schema.studyUnits.id, unitId))
      .limit(1);
    return unit || null;
  }

  async createStudyWeek(data: { title: string; description?: string; weekNumber: number; year: number; createdBy?: number; aiMetadata?: string }): Promise<any> {
    const [week] = await db.insert(schema.studyWeeks)
      .values(data)
      .returning();
    return week;
  }

  async createStudyLesson(data: { studyWeekId: number; orderIndex: number; title: string; type?: string; description?: string; xpReward?: number; estimatedMinutes?: number; icon?: string; isBonus?: boolean }): Promise<any> {
    const [lesson] = await db.insert(schema.studyLessons)
      .values({
        ...data,
        type: data.type || 'study',
        xpReward: data.xpReward || 10,
        estimatedMinutes: data.estimatedMinutes || 5,
        isBonus: data.isBonus || false,
      })
      .returning();
    return lesson;
  }

  async createStudyUnit(data: { lessonId: number; orderIndex: number; type: string; content: any; xpValue?: number; stage?: string }): Promise<any> {
    const [unit] = await db.insert(schema.studyUnits)
      .values({
        lessonId: data.lessonId,
        orderIndex: data.orderIndex,
        type: data.type,
        content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content),
        xpValue: data.xpValue || 2,
        stage: data.stage || 'estude',
      })
      .returning();
    return unit;
  }

  async updateStudyLesson(lessonId: number, data: { title?: string; type?: string; description?: string; xpReward?: number; estimatedMinutes?: number; icon?: string; isBonus?: boolean; orderIndex?: number; isLocked?: boolean; unlockDate?: string | null }): Promise<any | null> {
    const updates: any = { ...data, updatedAt: new Date() };
    if (data.unlockDate) {
      updates.unlockDate = new Date(data.unlockDate);
    } else if (data.unlockDate === null) {
      updates.unlockDate = null;
    }
    const [lesson] = await db.update(schema.studyLessons)
      .set(updates)
      .where(eq(schema.studyLessons.id, lessonId))
      .returning();
    return lesson || null;
  }

  async deleteStudyLesson(lessonId: number): Promise<boolean> {
    // First, get all unit IDs for this lesson
    const units = await db.select({ id: schema.studyUnits.id })
      .from(schema.studyUnits)
      .where(eq(schema.studyUnits.lessonId, lessonId));
    const unitIds = units.map(u => u.id);
    
    // Delete user unit progress first (foreign key constraint to studyUnits)
    if (unitIds.length > 0) {
      await db.delete(schema.userUnitProgress).where(inArray(schema.userUnitProgress.unitId, unitIds));
    }
    
    // Delete user lesson progress (foreign key constraint to studyLessons)
    await db.delete(schema.userLessonProgress).where(eq(schema.userLessonProgress.lessonId, lessonId));
    
    // Delete units
    await db.delete(schema.studyUnits).where(eq(schema.studyUnits.lessonId, lessonId));
    
    // Delete lesson
    await db.delete(schema.studyLessons).where(eq(schema.studyLessons.id, lessonId));
    return true;
  }

  async updateStudyUnit(unitId: number, data: { type?: string; content?: any; xpValue?: number; orderIndex?: number; stage?: string }): Promise<any | null> {
    const updates: any = { ...data };
    if (data.content) {
      updates.content = typeof data.content === 'string' ? data.content : JSON.stringify(data.content);
    }
    const [unit] = await db.update(schema.studyUnits)
      .set(updates)
      .where(eq(schema.studyUnits.id, unitId))
      .returning();
    return unit || null;
  }

  async deleteStudyUnit(unitId: number): Promise<boolean> {
    // Delete user unit progress first (foreign key constraint)
    await db.delete(schema.userUnitProgress).where(eq(schema.userUnitProgress.unitId, unitId));
    // Delete the unit
    await db.delete(schema.studyUnits).where(eq(schema.studyUnits.id, unitId));
    return true;
  }

  async updateStudyWeek(weekId: number, data: { title?: string; description?: string; weekNumber?: number; year?: number; status?: string }): Promise<any | null> {
    const [week] = await db.update(schema.studyWeeks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.studyWeeks.id, weekId))
      .returning();
    return week || null;
  }

  async deleteStudyWeek(weekId: number): Promise<boolean> {
    const lessons = await this.getLessonsForWeek(weekId);
    for (const lesson of lessons) {
      await this.deleteStudyLesson(lesson.id);
    }
    await db.delete(schema.studyWeeks).where(eq(schema.studyWeeks.id, weekId));
    return true;
  }

  async getUnitsForLesson(lessonId: number): Promise<any[]> {
    return this.getUnitsByLessonId(lessonId);
  }

  async publishStudyWeek(weekId: number): Promise<any | null> {
    const [week] = await db.update(schema.studyWeeks)
      .set({ status: 'published', publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.studyWeeks.id, weekId))
      .returning();
    return week || null;
  }

  async lockLesson(lessonId: number): Promise<any | null> {
    const [lesson] = await db.update(schema.studyLessons)
      .set({ isLocked: true, unlockDate: null, updatedAt: new Date() })
      .where(eq(schema.studyLessons.id, lessonId))
      .returning();
    return lesson || null;
  }

  async unlockLesson(lessonId: number): Promise<any | null> {
    const [lesson] = await db.update(schema.studyLessons)
      .set({ isLocked: false, updatedAt: new Date() })
      .where(eq(schema.studyLessons.id, lessonId))
      .returning();
    return lesson || null;
  }

  async setLessonUnlockDate(lessonId: number, unlockDate: string | null): Promise<any | null> {
    const [lesson] = await db.update(schema.studyLessons)
      .set({ 
        unlockDate: unlockDate ? new Date(unlockDate) : null, 
        updatedAt: new Date() 
      })
      .where(eq(schema.studyLessons.id, lessonId))
      .returning();
    return lesson || null;
  }

  async unlockAllLessonsForWeek(weekId: number): Promise<number> {
    const result = await db.update(schema.studyLessons)
      .set({ isLocked: false, updatedAt: new Date() })
      .where(eq(schema.studyLessons.studyWeekId, weekId));
    return 1;
  }

  async lockAllLessonsForWeek(weekId: number): Promise<number> {
    const result = await db.update(schema.studyLessons)
      .set({ isLocked: true, updatedAt: new Date() })
      .where(eq(schema.studyLessons.studyWeekId, weekId));
    return 1;
  }

  async setWeeklyUnlockSchedule(weekId: number, startDate: string): Promise<number> {
    const lessons = await this.getLessonsForWeek(weekId);
    let count = 0;
    const start = new Date(startDate);
    
    for (const lesson of lessons) {
      const unlockDate = new Date(start);
      unlockDate.setDate(unlockDate.getDate() + lesson.orderIndex);
      await db.update(schema.studyLessons)
        .set({ isLocked: true, unlockDate, updatedAt: new Date() })
        .where(eq(schema.studyLessons.id, lesson.id));
      count++;
    }
    return count;
  }

  // Daily Missions
  async getDailyMissions(): Promise<any[]> {
    return db.select().from(schema.dailyMissions)
      .where(eq(schema.dailyMissions.isActive, true));
  }

  async getUserDailyMissions(userId: number, date: string): Promise<any[]> {
    return db.select({
      id: schema.userDailyMissions.id,
      userId: schema.userDailyMissions.userId,
      missionId: schema.userDailyMissions.missionId,
      assignedDate: schema.userDailyMissions.assignedDate,
      completed: schema.userDailyMissions.completed,
      completedAt: schema.userDailyMissions.completedAt,
      xpAwarded: schema.userDailyMissions.xpAwarded,
      mission: schema.dailyMissions,
    })
    .from(schema.userDailyMissions)
    .leftJoin(schema.dailyMissions, eq(schema.userDailyMissions.missionId, schema.dailyMissions.id))
    .where(and(
      eq(schema.userDailyMissions.userId, userId),
      eq(schema.userDailyMissions.assignedDate, date)
    ));
  }

  async assignDailyMissions(userId: number, date: string): Promise<any[]> {
    const existing = await this.getUserDailyMissions(userId, date);
    if (existing.length > 0) return existing;
    
    const missions = await this.getDailyMissions();
    const selected = missions.slice(0, 5);
    
    for (const mission of selected) {
      await db.insert(schema.userDailyMissions).values({
        userId,
        missionId: mission.id,
        assignedDate: date,
      });
    }
    
    return this.getUserDailyMissions(userId, date);
  }

  async getUserMissionById(userId: number, missionId: number, date: string): Promise<any | null> {
    const [result] = await db.select()
      .from(schema.userDailyMissions)
      .where(and(
        eq(schema.userDailyMissions.userId, userId),
        eq(schema.userDailyMissions.missionId, missionId),
        eq(schema.userDailyMissions.assignedDate, date)
      ))
      .limit(1);
    return result || null;
  }

  async completeMission(userId: number, missionId: number, date: string): Promise<any | null> {
    const mission = await db.select().from(schema.dailyMissions)
      .where(eq(schema.dailyMissions.id, missionId))
      .limit(1);
    
    const xp = mission[0]?.xpReward || 10;
    
    const [result] = await db.update(schema.userDailyMissions)
      .set({ completed: true, completedAt: new Date(), xpAwarded: xp })
      .where(and(
        eq(schema.userDailyMissions.userId, userId),
        eq(schema.userDailyMissions.missionId, missionId),
        eq(schema.userDailyMissions.assignedDate, date)
      ))
      .returning();
    return result || null;
  }

  async getDailyMissionContent(date: string): Promise<any | null> {
    const [content] = await db.select().from(schema.dailyMissionContent)
      .where(eq(schema.dailyMissionContent.contentDate, date))
      .limit(1);
    return content || null;
  }

  async createDailyMissionContent(data: any): Promise<any> {
    const [content] = await db.insert(schema.dailyMissionContent)
      .values(data)
      .returning();
    return content;
  }

  async initializeDailyMissions(): Promise<void> {
    const existingMissions = await this.getDailyMissions();
    if (existingMissions.length > 0) return;

    const defaultMissions = [
      { type: 'complete_lesson', title: 'Estudante Dedicado', description: 'Complete uma lição hoje', icon: 'BookOpen', xpReward: 15 },
      { type: 'read_daily_verse', title: 'Palavra do Dia', description: 'Leia o versículo do dia', icon: 'Book', xpReward: 10 },
      { type: 'quick_quiz', title: 'Quiz Rápido', description: 'Responda 3 perguntas corretamente', icon: 'HelpCircle', xpReward: 20 },
      { type: 'maintain_streak', title: 'Mantenha o Foco', description: 'Mantenha sua sequência de estudos', icon: 'Flame', xpReward: 10 },
      { type: 'perfect_answers', title: 'Perfeição', description: 'Acerte 5 respostas seguidas', icon: 'Star', xpReward: 25 },
    ];

    for (const mission of defaultMissions) {
      await db.insert(schema.dailyMissions).values(mission);
    }
  }

  // Bible Verses
  async getUnreadVersesForUser(userId: number): Promise<any[]> {
    const readVerseIds = await db.select({ verseId: schema.verseReadings.verseId })
      .from(schema.verseReadings)
      .where(eq(schema.verseReadings.userId, userId));
    
    const readIds = readVerseIds.map(r => r.verseId);
    
    if (readIds.length === 0) {
      return db.select().from(schema.bibleVerses);
    }
    
    return db.select().from(schema.bibleVerses)
      .where(sql`${schema.bibleVerses.id} NOT IN (${sql.join(readIds, sql`, `)})`);
  }

  async resetUserVerseReadings(userId: number): Promise<void> {
    await db.delete(schema.verseReadings)
      .where(eq(schema.verseReadings.userId, userId));
  }

  async clearAllBibleVerses(): Promise<void> {
    await db.delete(schema.verseReadings);
    await db.delete(schema.bibleVerses);
  }

  async clearAllDailyMissions(): Promise<void> {
    await db.delete(schema.userDailyMissions);
    await db.delete(schema.dailyMissions);
  }

  async clearAllAchievements(): Promise<void> {
    await db.delete(schema.userAchievements);
    await db.delete(schema.achievements);
  }

  async clearAllStudyProgress(): Promise<void> {
    await db.delete(schema.userUnitProgress);
    await db.delete(schema.userLessonProgress);
    await db.delete(schema.verseReadings);
    await db.delete(schema.xpTransactions);
    await db.delete(schema.dailyActivity);
    await db.delete(schema.leaderboardEntries);
    await db.delete(schema.studyProfiles);
  }

  async createDailyMission(data: { type: string; title: string; description: string; icon: string; xpReward: number }): Promise<any> {
    const [mission] = await db.insert(schema.dailyMissions)
      .values(data)
      .returning();
    return mission;
  }

  // Devotionals
  async getLatestDevotional(): Promise<any | null> {
    const [devotional] = await db.select().from(schema.devotionals)
      .where(eq(schema.devotionals.isPublished, true))
      .orderBy(desc(schema.devotionals.publishedAt))
      .limit(1);
    return devotional || null;
  }

  async getAllDevotionals(limit?: number): Promise<any[]> {
    let query = db.select().from(schema.devotionals)
      .where(eq(schema.devotionals.isPublished, true))
      .orderBy(desc(schema.devotionals.publishedAt));
    
    if (limit) {
      return query.limit(limit);
    }
    return query;
  }

  async getDevotionalById(id: number): Promise<any | null> {
    const [devotional] = await db.select().from(schema.devotionals)
      .where(eq(schema.devotionals.id, id))
      .limit(1);
    return devotional || null;
  }

  async createDevotional(data: { title: string; verse: string; verseReference: string; content: string; contentHtml?: string; summary?: string; prayer?: string; imageUrl?: string; author?: string; isPublished?: boolean; isFeatured?: boolean; scheduledAt?: Date; createdBy?: number }): Promise<any> {
    const [devotional] = await db.insert(schema.devotionals)
      .values({
        ...data,
        isPublished: data.isPublished ?? false,
        isFeatured: data.isFeatured ?? false,
      })
      .returning();
    return devotional;
  }

  async getAllDevotionalsAdmin(): Promise<any[]> {
    return db.select().from(schema.devotionals)
      .orderBy(desc(schema.devotionals.createdAt));
  }

  async updateDevotional(id: number, data: Partial<{ title: string; verse: string; verseReference: string; content: string; contentHtml?: string; summary?: string; prayer?: string; imageUrl?: string; author?: string; isPublished?: boolean; isFeatured?: boolean; scheduledAt?: Date | null }>): Promise<any | null> {
    const [devotional] = await db.update(schema.devotionals)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.devotionals.id, id))
      .returning();
    return devotional || null;
  }

  async deleteDevotional(id: number): Promise<boolean> {
    const result = await db.delete(schema.devotionals)
      .where(eq(schema.devotionals.id, id))
      .returning();
    return result.length > 0;
  }

  async publishDevotional(id: number): Promise<any | null> {
    const [devotional] = await db.update(schema.devotionals)
      .set({
        isPublished: true,
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.devotionals.id, id))
      .returning();
    return devotional || null;
  }

  async unpublishDevotional(id: number): Promise<any | null> {
    const [devotional] = await db.update(schema.devotionals)
      .set({
        isPublished: false,
        updatedAt: new Date(),
      })
      .where(eq(schema.devotionals.id, id))
      .returning();
    return devotional || null;
  }

  async clearAllDevotionals(): Promise<void> {
    await db.delete(schema.devotionals);
  }

  // Site Events
  async getUpcomingEvents(limit?: number): Promise<any[]> {
    const today = getTodayBrazilDate();
    let query = db.select().from(schema.siteEvents)
      .where(and(
        eq(schema.siteEvents.isPublished, true),
        gte(schema.siteEvents.startDate, today)
      ))
      .orderBy(asc(schema.siteEvents.startDate));
    
    if (limit) {
      return query.limit(limit);
    }
    return query;
  }

  async getAllSiteEvents(): Promise<any[]> {
    return db.select().from(schema.siteEvents)
      .orderBy(desc(schema.siteEvents.startDate));
  }

  async createSiteEvent(data: { title: string; description?: string; imageUrl?: string; startDate: string; endDate?: string; time?: string; location?: string; isPublished?: boolean }): Promise<any> {
    const [event] = await db.insert(schema.siteEvents)
      .values({
        ...data,
        isPublished: data.isPublished ?? true,
      })
      .returning();
    return event;
  }

  async clearAllSiteEvents(): Promise<void> {
    await db.delete(schema.siteEvents);
  }

  async getSiteEventById(id: number): Promise<any | null> {
    const [event] = await db.select().from(schema.siteEvents)
      .where(eq(schema.siteEvents.id, id))
      .limit(1);
    return event || null;
  }

  async updateSiteEvent(id: number, data: Partial<{
    title: string;
    description: string | null;
    shortDescription: string | null;
    imageUrl: string | null;
    startDate: string;
    endDate: string | null;
    time: string | null;
    location: string | null;
    locationUrl: string | null;
    price: string | null;
    registrationUrl: string | null;
    category: string;
    isPublished: boolean;
    isFeatured: boolean;
    isAllDay: boolean;
  }>): Promise<any | null> {
    const [event] = await db.update(schema.siteEvents)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.siteEvents.id, id))
      .returning();
    return event || null;
  }

  async deleteSiteEvent(id: number): Promise<boolean> {
    const result = await db.delete(schema.siteEvents)
      .where(eq(schema.siteEvents.id, id));
    return true;
  }

  async getMarketingStats(): Promise<{
    events: { total: number; upcoming: number; past: number };
    boardMembers: { total: number; active: number };
  }> {
    const today = getTodayBrazilDate();
    
    const [allEvents, upcomingEvents, allMembers, activeMembers] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(schema.siteEvents),
      db.select({ count: sql<number>`count(*)` }).from(schema.siteEvents)
        .where(gte(schema.siteEvents.startDate, today)),
      db.select({ count: sql<number>`count(*)` }).from(schema.boardMembers),
      db.select({ count: sql<number>`count(*)` }).from(schema.boardMembers)
        .where(eq(schema.boardMembers.isCurrent, true)),
    ]);

    const totalEvents = Number(allEvents[0]?.count || 0);
    const upcoming = Number(upcomingEvents[0]?.count || 0);
    
    return {
      events: {
        total: totalEvents,
        upcoming,
        past: totalEvents - upcoming,
      },
      boardMembers: {
        total: Number(allMembers[0]?.count || 0),
        active: Number(activeMembers[0]?.count || 0),
      },
    };
  }

  // Instagram Posts
  async getLatestInstagramPosts(limit?: number): Promise<any[]> {
    let query = db.select().from(schema.instagramPosts)
      .where(eq(schema.instagramPosts.isActive, true))
      .orderBy(desc(schema.instagramPosts.postedAt));
    
    if (limit) {
      return query.limit(limit);
    }
    return query;
  }

  async createInstagramPost(data: { instagramId?: string; caption?: string; imageUrl: string; videoUrl?: string; mediaType?: string; permalink?: string; likesCount?: number; commentsCount?: number; postedAt?: string; isActive?: boolean }): Promise<any> {
    const [post] = await db.insert(schema.instagramPosts)
      .values({
        instagramId: data.instagramId,
        caption: data.caption,
        imageUrl: data.imageUrl,
        videoUrl: data.videoUrl,
        mediaType: data.mediaType || "IMAGE",
        permalink: data.permalink,
        likesCount: data.likesCount ?? 0,
        commentsCount: data.commentsCount ?? 0,
        postedAt: data.postedAt ? new Date(data.postedAt) : new Date(),
        isActive: data.isActive ?? true,
      })
      .returning();
    return post;
  }

  async clearAllInstagramPosts(): Promise<void> {
    await db.delete(schema.instagramPosts);
  }

  async getFeaturedInstagramPost(): Promise<any | null> {
    const [post] = await db.select().from(schema.instagramPosts)
      .where(eq(schema.instagramPosts.isFeaturedBanner, true))
      .limit(1);
    return post || null;
  }

  async setFeaturedInstagramPost(id: number): Promise<any | null> {
    await db.update(schema.instagramPosts)
      .set({ isFeaturedBanner: false });
    
    const [updated] = await db.update(schema.instagramPosts)
      .set({ isFeaturedBanner: true })
      .where(eq(schema.instagramPosts.id, id))
      .returning();
    return updated || null;
  }

  async getInstagramPostById(id: number): Promise<any | null> {
    const [post] = await db.select().from(schema.instagramPosts)
      .where(eq(schema.instagramPosts.id, id))
      .limit(1);
    return post || null;
  }

  async removeFeaturedInstagramPost(id: number): Promise<void> {
    await db.update(schema.instagramPosts)
      .set({ isFeaturedBanner: false })
      .where(eq(schema.instagramPosts.id, id));
  }

  async getInstagramPostsForAdmin(): Promise<any[]> {
    return db.select().from(schema.instagramPosts)
      .orderBy(desc(schema.instagramPosts.postedAt));
  }

  async getSiteHighlights(): Promise<{ devotional: any | null; events: any[]; instagramPosts: any[]; featuredInstagramPost: any | null }> {
    const [devotional, events, instagramPosts, featuredInstagramPost] = await Promise.all([
      this.getLatestDevotional(),
      this.getUpcomingEvents(5),
      this.getLatestInstagramPosts(6),
      this.getFeaturedInstagramPost(),
    ]);
    
    return { devotional, events, instagramPosts, featuredInstagramPost };
  }

  // Study Profile Methods
  async getStudyProfile(userId: number): Promise<any | null> {
    const [profile] = await db.select().from(schema.studyProfiles)
      .where(eq(schema.studyProfiles.userId, userId))
      .limit(1);
    return profile || null;
  }

  async getOrCreateStudyProfile(userId: number): Promise<any> {
    let profile = await this.getStudyProfile(userId);
    if (!profile) {
      const [newProfile] = await db.insert(schema.studyProfiles)
        .values({ userId })
        .returning();
      return newProfile;
    }
    return profile;
  }

  async getPublishedStudyWeeks(): Promise<any[]> {
    return db.select().from(schema.studyWeeks)
      .where(eq(schema.studyWeeks.status, 'published'))
      .orderBy(desc(schema.studyWeeks.year), desc(schema.studyWeeks.weekNumber));
  }

  async getLessonsWithProgress(userId: number, weekId: number): Promise<any[]> {
    // Optimized: Single query with LEFT JOIN instead of N+1 queries
    const lessonsWithProgress = await db.select({
      id: schema.studyLessons.id,
      studyWeekId: schema.studyLessons.studyWeekId,
      orderIndex: schema.studyLessons.orderIndex,
      title: schema.studyLessons.title,
      type: schema.studyLessons.type,
      description: schema.studyLessons.description,
      xpReward: schema.studyLessons.xpReward,
      estimatedMinutes: schema.studyLessons.estimatedMinutes,
      icon: schema.studyLessons.icon,
      isBonus: schema.studyLessons.isBonus,
      isLocked: schema.studyLessons.isLocked,
      unlockDate: schema.studyLessons.unlockDate,
      seasonId: schema.studyLessons.seasonId,
      lessonNumber: schema.studyLessons.lessonNumber,
      isReleased: schema.studyLessons.isReleased,
      progressStatus: schema.userLessonProgress.status,
      progressXpEarned: schema.userLessonProgress.xpEarned,
      progressPerfectScore: schema.userLessonProgress.perfectScore,
    })
      .from(schema.studyLessons)
      .leftJoin(
        schema.userLessonProgress,
        and(
          eq(schema.userLessonProgress.lessonId, schema.studyLessons.id),
          eq(schema.userLessonProgress.userId, userId)
        )
      )
      .where(eq(schema.studyLessons.studyWeekId, weekId))
      .orderBy(asc(schema.studyLessons.orderIndex));

    // Get stage progress for each lesson
    const lessonsWithStageProgress = await Promise.all(lessonsWithProgress.map(async (row) => {
      // Get all units for this lesson with type information
      const units = await db.select({
        id: schema.studyUnits.id,
        stage: schema.studyUnits.stage,
        type: schema.studyUnits.type,
      }).from(schema.studyUnits)
        .where(eq(schema.studyUnits.lessonId, row.id));
      
      // Get completed units for this user
      const unitIds = units.map(u => u.id);
      let completedUnits: { unitId: number }[] = [];
      if (unitIds.length > 0) {
        completedUnits = await db.select({
          unitId: schema.userUnitProgress.unitId,
        }).from(schema.userUnitProgress)
          .where(and(
            eq(schema.userUnitProgress.userId, userId),
            eq(schema.userUnitProgress.isCompleted, true),
            inArray(schema.userUnitProgress.unitId, unitIds)
          ));
      }
      
      const completedUnitIds = new Set(completedUnits.map(u => u.unitId));
      
      // Calculate stage progress - only count types that are actually shown in each stage
      // Estude: only text and verse types
      // Medite: only meditation and reflection types
      // Responda: only exercise types (multiple_choice, true_false, fill_blank)
      const stageProgress = {
        estude: { completed: 0, total: 0 },
        medite: { completed: 0, total: 0 },
        responda: { completed: 0, total: 0 },
      };
      
      const estudeTypes = ['text', 'verse'];
      const mediteTypes = ['meditation', 'reflection'];
      const respondaTypes = ['multiple_choice', 'true_false', 'fill_blank'];
      
      for (const unit of units) {
        const stage = (unit.stage || 'estude') as 'estude' | 'medite' | 'responda';
        const unitType = unit.type || 'text';
        
        // Only count units whose type matches their stage
        let shouldCount = false;
        if (stage === 'estude' && estudeTypes.includes(unitType)) {
          shouldCount = true;
        } else if (stage === 'medite' && mediteTypes.includes(unitType)) {
          shouldCount = true;
        } else if (stage === 'responda' && respondaTypes.includes(unitType)) {
          shouldCount = true;
        }
        
        if (shouldCount && stageProgress[stage]) {
          stageProgress[stage].total++;
          if (completedUnitIds.has(unit.id)) {
            stageProgress[stage].completed++;
          }
        }
      }
      
      return {
        id: row.id,
        studyWeekId: row.studyWeekId,
        orderIndex: row.orderIndex,
        title: row.title,
        type: row.type,
        description: row.description,
        xpReward: row.xpReward,
        estimatedMinutes: row.estimatedMinutes,
        icon: row.icon,
        isBonus: row.isBonus,
        isLocked: row.isLocked,
        unlockDate: row.unlockDate,
        seasonId: row.seasonId,
        lessonNumber: row.lessonNumber,
        isReleased: row.isReleased,
        status: row.progressStatus || 'locked',
        xpEarned: row.progressXpEarned || 0,
        perfectScore: row.progressPerfectScore || false,
        progress: {
          stageProgress
        }
      };
    }));
    
    return lessonsWithStageProgress;
  }

  async getUserLessonProgress(userId: number, lessonId: number): Promise<any | null> {
    const [progress] = await db.select().from(schema.userLessonProgress)
      .where(and(
        eq(schema.userLessonProgress.userId, userId),
        eq(schema.userLessonProgress.lessonId, lessonId)
      ))
      .limit(1);
    return progress || null;
  }

  async startLesson(userId: number, lessonId: number): Promise<any> {
    const existing = await this.getUserLessonProgress(userId, lessonId);
    if (existing) {
      if (existing.status === 'completed') {
        return { alreadyCompleted: true, progress: existing };
      }
      const [updated] = await db.update(schema.userLessonProgress)
        .set({ status: 'in_progress', startedAt: new Date() })
        .where(eq(schema.userLessonProgress.id, existing.id))
        .returning();
      return updated;
    }
    
    const [progress] = await db.insert(schema.userLessonProgress)
      .values({
        userId,
        lessonId,
        status: 'in_progress',
        startedAt: new Date(),
      })
      .returning();
    return progress;
  }

  async submitUnitAnswer(userId: number, unitId: number, answer: any): Promise<any> {
    const unit = await this.getStudyUnitById(unitId);
    if (!unit) return null;
    
    const [existing] = await db.select().from(schema.userUnitProgress)
      .where(and(
        eq(schema.userUnitProgress.userId, userId),
        eq(schema.userUnitProgress.unitId, unitId)
      ))
      .limit(1);
    
    const content = typeof unit.content === 'string' ? JSON.parse(unit.content) : unit.content;
    const isCorrect = this.checkAnswer(unit.type, content, answer);
    
    // Deduzir vida quando resposta está errada (apenas na primeira tentativa errada)
    let heartLost = false;
    if (!isCorrect && (!existing || existing.isCorrect !== false)) {
      const profile = await this.getStudyProfile(userId);
      if (profile && profile.hearts > 0) {
        await db.update(schema.studyProfiles)
          .set({ hearts: profile.hearts - 1 })
          .where(eq(schema.studyProfiles.userId, userId));
        heartLost = true;
      }
    }
    
    if (existing) {
      const [updated] = await db.update(schema.userUnitProgress)
        .set({
          answerGiven: JSON.stringify(answer),
          isCorrect,
          attempts: existing.attempts + 1,
          isCompleted: isCorrect,
          completedAt: isCorrect ? new Date() : null,
        })
        .where(eq(schema.userUnitProgress.id, existing.id))
        .returning();
      
      // Award XP only on first correct answer (not on retries)
      if (isCorrect && !existing.isCorrect) {
        await this.addXp(userId, unit.xpValue, 'unit', unitId);
      }
      return { unitProgress: updated, isCorrect, xpEarned: (isCorrect && !existing.isCorrect) ? unit.xpValue : 0, heartLost };
    }
    
    const [progress] = await db.insert(schema.userUnitProgress)
      .values({
        userId,
        unitId,
        answerGiven: JSON.stringify(answer),
        isCorrect,
        attempts: 1,
        isCompleted: isCorrect,
        completedAt: isCorrect ? new Date() : null,
      })
      .returning();
    
    // Award XP for correct answer on first attempt
    if (isCorrect) {
      await this.addXp(userId, unit.xpValue, 'unit', unitId);
    }
    return { unitProgress: progress, isCorrect, xpEarned: isCorrect ? unit.xpValue : 0, heartLost };
  }

  private checkAnswer(unitType: string, content: any, answer: any): boolean {
    if (unitType === 'multiple_choice') {
      const correctIndex = content.correctIndex;
      if (correctIndex !== undefined) {
        return correctIndex === answer;
      }
      return content.correctAnswer === answer;
    }
    if (unitType === 'true_false') {
      const isTrue = content.isTrue;
      if (isTrue !== undefined) {
        return isTrue === answer;
      }
      return content.correctAnswer === answer;
    }
    if (unitType === 'fill_blank') {
      const correctAnswer = content.correctAnswer;
      if (correctAnswer) {
        return correctAnswer.toLowerCase().trim() === String(answer).toLowerCase().trim();
      }
      const correctAnswers = content.correctAnswers || [];
      return correctAnswers.some((a: string) => 
        a.toLowerCase().trim() === String(answer).toLowerCase().trim()
      );
    }
    return false;
  }

  async markUnitAsCompleted(userId: number, unitId: number): Promise<any> {
    const unit = await this.getStudyUnitById(unitId);
    if (!unit) return null;
    
    const [existing] = await db.select().from(schema.userUnitProgress)
      .where(and(
        eq(schema.userUnitProgress.userId, userId),
        eq(schema.userUnitProgress.unitId, unitId)
      ))
      .limit(1);
    
    if (existing) {
      // Don't award XP again if already completed
      if (!existing.isCompleted) {
        await this.addXp(userId, unit.xpValue, 'unit', unitId);
      }
      const [updated] = await db.update(schema.userUnitProgress)
        .set({ isCompleted: true, completedAt: new Date() })
        .where(eq(schema.userUnitProgress.id, existing.id))
        .returning();
      return { unitProgress: updated, xpAwarded: existing.isCompleted ? 0 : unit.xpValue };
    }
    
    // Award XP for first completion
    await this.addXp(userId, unit.xpValue, 'unit', unitId);
    
    const [progress] = await db.insert(schema.userUnitProgress)
      .values({
        userId,
        unitId,
        isCompleted: true,
        completedAt: new Date(),
      })
      .returning();
    return { unitProgress: progress, xpAwarded: unit.xpValue };
  }

  async completeLesson(userId: number, lessonId: number, xpEarned: number, mistakes: number, timeSpent: number, perfectScore: boolean): Promise<any> {
    const existing = await this.getUserLessonProgress(userId, lessonId);
    
    if (existing) {
      const [updated] = await db.update(schema.userLessonProgress)
        .set({
          status: 'completed',
          completedAt: new Date(),
          xpEarned,
          mistakesCount: mistakes,
          timeSpentSeconds: timeSpent,
          perfectScore,
        })
        .where(eq(schema.userLessonProgress.id, existing.id))
        .returning();
      
      await this.addXp(userId, xpEarned, 'lesson', lessonId);
      return updated;
    }
    
    const [progress] = await db.insert(schema.userLessonProgress)
      .values({
        userId,
        lessonId,
        status: 'completed',
        completedAt: new Date(),
        xpEarned,
        mistakesCount: mistakes,
        timeSpentSeconds: timeSpent,
        perfectScore,
      })
      .returning();
    
    await this.addXp(userId, xpEarned, 'lesson', lessonId);
    return progress;
  }

  private async addXp(userId: number, amount: number, source: string, sourceId?: number): Promise<void> {
    // Ensure the study profile exists before adding XP
    await this.getOrCreateStudyProfile(userId);
    
    await db.insert(schema.xpTransactions).values({
      userId,
      amount,
      source,
      sourceId,
    });
    
    await db.update(schema.studyProfiles)
      .set({ totalXp: sql`total_xp + ${amount}`, updatedAt: new Date() })
      .where(eq(schema.studyProfiles.userId, userId));
  }

  async getStudyStats(): Promise<any> {
    const [weekCount] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.studyWeeks);
    const [lessonCount] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.studyLessons);
    const [unitCount] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.studyUnits);
    const [profileCount] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.studyProfiles);
    
    return {
      totalWeeks: Number(weekCount?.count || 0),
      totalLessons: Number(lessonCount?.count || 0),
      totalUnits: Number(unitCount?.count || 0),
      totalStudents: Number(profileCount?.count || 0),
    };
  }

  async getCompletedLessonsWithExercises(userId: number): Promise<any[]> {
    // Get all completed lessons for this user
    const completedProgress = await db.select({
      lessonId: schema.userLessonProgress.lessonId,
    })
      .from(schema.userLessonProgress)
      .where(and(
        eq(schema.userLessonProgress.userId, userId),
        eq(schema.userLessonProgress.status, 'completed')
      ));
    
    if (completedProgress.length === 0) {
      return [];
    }
    
    const lessonIds = completedProgress.map(p => p.lessonId);
    
    // Get lesson details for completed lessons
    const lessons = await db.select()
      .from(schema.studyLessons)
      .where(inArray(schema.studyLessons.id, lessonIds));
    
    return lessons;
  }

  // Third Scrutiny Methods
  async checkThirdScrutinyTie(electionPositionId: number): Promise<{ isTie: boolean; candidates?: any[] }> {
    const position = await this.getElectionPositionById(electionPositionId);
    if (!position || position.currentScrutiny !== 3) {
      return { isTie: false };
    }
    
    // Optimized: Single query with JOIN and GROUP BY instead of N+1 queries
    const candidatesWithVotes = await db.select({
      id: schema.candidates.id,
      userId: schema.candidates.userId,
      name: schema.candidates.name,
      email: schema.candidates.email,
      positionId: schema.candidates.positionId,
      electionId: schema.candidates.electionId,
      voteCount: sql<number>`count(${schema.votes.id})`,
    })
      .from(schema.candidates)
      .leftJoin(
        schema.votes,
        and(
          eq(schema.votes.candidateId, schema.candidates.id),
          eq(schema.votes.scrutinyRound, 3)
        )
      )
      .where(and(
        eq(schema.candidates.positionId, position.positionId),
        eq(schema.candidates.electionId, position.electionId)
      ))
      .groupBy(schema.candidates.id);

    const voteResults = candidatesWithVotes.map(c => ({
      ...c,
      voteCount: Number(c.voteCount || 0),
    }));
    
    const maxVotes = Math.max(...voteResults.map(c => c.voteCount), 0);
    const tiedCandidates = voteResults.filter(c => c.voteCount === maxVotes);
    
    return {
      isTie: tiedCandidates.length > 1,
      candidates: tiedCandidates.length > 1 ? tiedCandidates : undefined,
    };
  }

  async resolveThirdScrutinyTie(electionPositionId: number, winnerId: number): Promise<void> {
    const position = await this.getElectionPositionById(electionPositionId);
    if (!position) return;
    
    await this.setWinner(position.electionId, winnerId, position.positionId, 3);
    await this.completePosition(electionPositionId);
  }

  // Notification Methods
  async savePushSubscription(userId: number, endpoint: string, p256dh: string, auth: string): Promise<void> {
    const [existing] = await db.select().from(schema.pushSubscriptions)
      .where(and(
        eq(schema.pushSubscriptions.userId, userId),
        eq(schema.pushSubscriptions.endpoint, endpoint)
      ))
      .limit(1);
    
    if (existing) {
      await db.update(schema.pushSubscriptions)
        .set({ p256dh, auth, lastUsed: new Date() })
        .where(eq(schema.pushSubscriptions.id, existing.id));
    } else {
      await db.insert(schema.pushSubscriptions).values({
        userId,
        endpoint,
        p256dh,
        auth,
      });
    }
  }

  async removePushSubscription(userId: number, endpoint: string): Promise<void> {
    await db.delete(schema.pushSubscriptions)
      .where(and(
        eq(schema.pushSubscriptions.userId, userId),
        eq(schema.pushSubscriptions.endpoint, endpoint)
      ));
  }

  async getUserNotifications(userId: number, limit: number = 50, offset: number = 0): Promise<any[]> {
    return db.select().from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(schema.notifications)
      .where(and(
        eq(schema.notifications.userId, userId),
        eq(schema.notifications.read, false)
      ));
    return Number(result?.count || 0);
  }

  async markNotificationRead(userId: number, notificationId: number): Promise<void> {
    await db.update(schema.notifications)
      .set({ read: true, readAt: new Date() })
      .where(and(
        eq(schema.notifications.id, notificationId),
        eq(schema.notifications.userId, userId)
      ));
  }

  async markAllNotificationsRead(userId: number): Promise<void> {
    await db.update(schema.notifications)
      .set({ read: true, readAt: new Date() })
      .where(eq(schema.notifications.userId, userId));
  }

  async deleteNotification(userId: number, notificationId: number): Promise<void> {
    await db.delete(schema.notifications)
      .where(and(
        eq(schema.notifications.id, notificationId),
        eq(schema.notifications.userId, userId)
      ));
  }

  // Bible Verse Methods
  async getBibleVerseById(id: number): Promise<any | null> {
    const [verse] = await db.select().from(schema.bibleVerses)
      .where(eq(schema.bibleVerses.id, id))
      .limit(1);
    return verse || null;
  }

  async getAllBibleVerses(): Promise<any[]> {
    return db.select().from(schema.bibleVerses)
      .orderBy(asc(schema.bibleVerses.id));
  }

  async createBibleVerse(reference: string, text: string, reflection: string, category: string): Promise<any> {
    const [verse] = await db.insert(schema.bibleVerses)
      .values({ reference, text, reflection, category })
      .returning();
    return verse;
  }

  async readVerseAndRecoverHeart(userId: number, verseId: number): Promise<any> {
    const [existing] = await db.select().from(schema.verseReadings)
      .where(and(
        eq(schema.verseReadings.userId, userId),
        eq(schema.verseReadings.verseId, verseId)
      ))
      .limit(1);
    
    if (existing) {
      const profile = await this.getStudyProfile(userId);
      return { 
        alreadyRead: true, 
        heartRecovered: false,
        heartsRecovered: 0,
        versesRead: profile?.versesReadForRecovery || 0,
        versesNeeded: 3,
        profile
      };
    }
    
    await db.insert(schema.verseReadings)
      .values({ userId, verseId, readAt: new Date() });
    
    const profile = await this.getStudyProfile(userId);
    if (!profile) {
      return { alreadyRead: false, heartRecovered: false, heartsRecovered: 0, versesRead: 0, versesNeeded: 3 };
    }
    
    const newVersesCount = (profile.versesReadForRecovery || 0) + 1;
    
    if (newVersesCount >= 3) {
      if (profile.hearts < profile.heartsMax) {
        await db.update(schema.studyProfiles)
          .set({ 
            hearts: Math.min(profile.heartsMax, profile.hearts + 1), 
            versesReadForRecovery: 0,
            updatedAt: new Date() 
          })
          .where(eq(schema.studyProfiles.userId, userId));
        
        const updatedProfile = await this.getStudyProfile(userId);
        return { 
          alreadyRead: false, 
          heartRecovered: true,
          heartsRecovered: 1,
          versesRead: 0,
          versesNeeded: 3,
          profile: updatedProfile
        };
      } else {
        await db.update(schema.studyProfiles)
          .set({ 
            versesReadForRecovery: 0,
            updatedAt: new Date() 
          })
          .where(eq(schema.studyProfiles.userId, userId));
        
        const updatedProfile = await this.getStudyProfile(userId);
        return { 
          alreadyRead: false, 
          heartRecovered: false,
          heartsRecovered: 0,
          heartsFull: true,
          versesRead: 0,
          versesNeeded: 3,
          profile: updatedProfile
        };
      }
    } else {
      await db.update(schema.studyProfiles)
        .set({ 
          versesReadForRecovery: newVersesCount,
          updatedAt: new Date() 
        })
        .where(eq(schema.studyProfiles.userId, userId));
      
      const updatedProfile = await this.getStudyProfile(userId);
      return { 
        alreadyRead: false, 
        heartRecovered: false,
        heartsRecovered: 0,
        versesRead: newVersesCount,
        versesNeeded: 3,
        profile: updatedProfile
      };
    }
  }

  async getVerseRecoveryProgress(userId: number): Promise<any> {
    const profile = await this.getStudyProfile(userId);
    
    return {
      versesRead: profile?.versesReadForRecovery || 0,
      versesNeeded: 3,
      hearts: profile?.hearts || 5,
      maxHearts: profile?.heartsMax || 5,
    };
  }

  // Achievement Methods
  async getAllAchievements(): Promise<any[]> {
    return db.select().from(schema.achievements)
      .orderBy(asc(schema.achievements.id));
  }

  async getUserAchievements(userId: number): Promise<any[]> {
    return db.select().from(schema.userAchievements)
      .where(eq(schema.userAchievements.userId, userId));
  }

  async createAchievement(data: any): Promise<any> {
    const [achievement] = await db.insert(schema.achievements)
      .values(data)
      .returning();
    return achievement;
  }

  // Leaderboard Methods
  async getLeaderboard(periodType: string, periodKey: string, limit: number = 20): Promise<any[]> {
    // Optimized: Single query with JOIN instead of N+1 queries
    const profilesWithUsers = await db.select({
      userId: schema.studyProfiles.userId,
      totalXp: schema.studyProfiles.totalXp,
      currentStreak: schema.studyProfiles.currentStreak,
      currentLevel: schema.studyProfiles.currentLevel,
      fullName: schema.users.fullName,
      photoUrl: schema.users.photoUrl,
    })
      .from(schema.studyProfiles)
      .innerJoin(schema.users, eq(schema.studyProfiles.userId, schema.users.id))
      .orderBy(desc(schema.studyProfiles.totalXp))
      .limit(limit);
    
    return profilesWithUsers.map((p, index) => ({
      rank: index + 1,
      userId: p.userId,
      username: p.fullName || 'Unknown',
      photoUrl: p.photoUrl,
      totalXp: p.totalXp,
      level: p.currentLevel,
      currentStreak: p.currentStreak,
    }));
  }

  // Prayer Requests Methods
  async createPrayerRequest(data: InsertPrayerRequest, moderationData?: { hasProfanity?: boolean; hasHateSpeech?: boolean; hasSexualContent?: boolean; moderationDetails?: string }): Promise<PrayerRequest> {
    const insertData = {
      ...data,
      ...(moderationData && {
        hasProfanity: moderationData.hasProfanity,
        hasHateSpeech: moderationData.hasHateSpeech,
        hasSexualContent: moderationData.hasSexualContent,
        moderationDetails: moderationData.moderationDetails,
        // isModerated sera definido como true apenas quando um moderador revisar manualmente
      }),
    };
    const [request] = await db.insert(schema.prayerRequests)
      .values(insertData)
      .returning();
    return request;
  }

  async getAllPrayerRequests(status?: string): Promise<PrayerRequest[]> {
    if (status) {
      return db.select().from(schema.prayerRequests)
        .where(eq(schema.prayerRequests.status, status))
        .orderBy(desc(schema.prayerRequests.createdAt));
    }
    return db.select().from(schema.prayerRequests)
      .orderBy(desc(schema.prayerRequests.createdAt));
  }

  async updatePrayerRequestStatus(id: number, status: string, prayedBy?: number): Promise<PrayerRequest | null> {
    const updateData: any = { 
      status, 
      updatedAt: new Date() 
    };
    if (prayedBy) {
      updateData.prayedBy = prayedBy;
      updateData.prayedAt = new Date();
    }
    const [updated] = await db.update(schema.prayerRequests)
      .set(updateData)
      .where(eq(schema.prayerRequests.id, id))
      .returning();
    return updated || null;
  }

  async getPrayerRequestById(id: number): Promise<PrayerRequest | null> {
    const [request] = await db.select().from(schema.prayerRequests)
      .where(eq(schema.prayerRequests.id, id))
      .limit(1);
    return request || null;
  }

  async getApprovedPrayerRequests(): Promise<PrayerRequest[]> {
    return db.select().from(schema.prayerRequests)
      .where(eq(schema.prayerRequests.isApproved, true))
      .orderBy(desc(schema.prayerRequests.approvedAt));
  }

  async getPendingPrayerRequests(): Promise<PrayerRequest[]> {
    return db.select().from(schema.prayerRequests)
      .where(and(
        eq(schema.prayerRequests.status, 'pending'),
        eq(schema.prayerRequests.isApproved, false)
      ))
      .orderBy(desc(schema.prayerRequests.createdAt));
  }

  async approvePrayerRequest(id: number, approvedBy: number): Promise<PrayerRequest | null> {
    const [request] = await db.update(schema.prayerRequests)
      .set({
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: approvedBy,
        isModerated: true,
        moderatedBy: approvedBy,
        moderatedAt: new Date(),
        status: 'approved',
        updatedAt: new Date(),
      })
      .where(eq(schema.prayerRequests.id, id))
      .returning();
    return request || null;
  }

  async autoApprovePrayerRequest(id: number): Promise<PrayerRequest | null> {
    const now = new Date();
    const [request] = await db.update(schema.prayerRequests)
      .set({
        isApproved: true,
        approvedAt: now,
        // approvedBy permanece null para indicar aprovacao automatica pelo sistema
        isModerated: true,
        moderatedAt: now,
        // moderatedBy permanece null para indicar moderacao automatica pelo sistema
        moderationDetails: 'Aprovado automaticamente - conteudo limpo',
        status: 'approved',
        updatedAt: now,
      })
      .where(eq(schema.prayerRequests.id, id))
      .returning();
    return request || null;
  }

  async rejectPrayerRequest(id: number, moderatedBy: number, reason?: string): Promise<PrayerRequest | null> {
    const [request] = await db.update(schema.prayerRequests)
      .set({
        isApproved: false,
        isModerated: true,
        moderatedBy: moderatedBy,
        moderatedAt: new Date(),
        status: 'rejected',
        notes: reason,
        updatedAt: new Date(),
      })
      .where(eq(schema.prayerRequests.id, id))
      .returning();
    return request || null;
  }

  async incrementPrayerCount(id: number): Promise<PrayerRequest | null> {
    const [request] = await db.update(schema.prayerRequests)
      .set({
        inPrayerCount: sql`${schema.prayerRequests.inPrayerCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(schema.prayerRequests.id, id))
      .returning();
    return request || null;
  }

  async checkIfPraying(prayerRequestId: number, sessionId: string): Promise<boolean> {
    const [reaction] = await db.select()
      .from(schema.prayerReactions)
      .where(and(
        eq(schema.prayerReactions.prayerRequestId, prayerRequestId),
        eq(schema.prayerReactions.sessionId, sessionId)
      ))
      .limit(1);
    return !!reaction;
  }

  async togglePraying(prayerRequestId: number, sessionId: string): Promise<{ isPraying: boolean; inPrayerCount: number } | null> {
    // First, verify that the prayer request exists and is approved
    const [existingRequest] = await db.select()
      .from(schema.prayerRequests)
      .where(and(
        eq(schema.prayerRequests.id, prayerRequestId),
        eq(schema.prayerRequests.isApproved, true)
      ))
      .limit(1);
    
    if (!existingRequest) {
      return null; // Request not found or not approved
    }
    
    const isPraying = await this.checkIfPraying(prayerRequestId, sessionId);
    
    if (isPraying) {
      // Remove reaction and decrement count
      await db.delete(schema.prayerReactions)
        .where(and(
          eq(schema.prayerReactions.prayerRequestId, prayerRequestId),
          eq(schema.prayerReactions.sessionId, sessionId)
        ));
      
      const [request] = await db.update(schema.prayerRequests)
        .set({
          inPrayerCount: sql`GREATEST(${schema.prayerRequests.inPrayerCount} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(schema.prayerRequests.id, prayerRequestId))
        .returning();
      
      return { isPraying: false, inPrayerCount: request?.inPrayerCount || 0 };
    } else {
      // Add reaction and increment count
      await db.insert(schema.prayerReactions)
        .values({ prayerRequestId, sessionId })
        .onConflictDoNothing();
      
      const [request] = await db.update(schema.prayerRequests)
        .set({
          inPrayerCount: sql`${schema.prayerRequests.inPrayerCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(schema.prayerRequests.id, prayerRequestId))
        .returning();
      
      return { isPraying: true, inPrayerCount: request?.inPrayerCount || 0 };
    }
  }

  async getPrayingSessionsForRequests(prayerRequestIds: number[], sessionId: string): Promise<Set<number>> {
    const reactions = await db.select({ prayerRequestId: schema.prayerReactions.prayerRequestId })
      .from(schema.prayerReactions)
      .where(and(
        inArray(schema.prayerReactions.prayerRequestId, prayerRequestIds),
        eq(schema.prayerReactions.sessionId, sessionId)
      ));
    return new Set(reactions.map(r => r.prayerRequestId));
  }

  async moderatePrayerRequest(id: number, data: { isModerated: boolean; moderatedBy: number; hasProfanity?: boolean; hasHateSpeech?: boolean; hasSexualContent?: boolean; moderationDetails?: string }): Promise<PrayerRequest | null> {
    const [request] = await db.update(schema.prayerRequests)
      .set({
        ...data,
        moderatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.prayerRequests.id, id))
      .returning();
    return request || null;
  }

  async deletePrayerRequest(id: number): Promise<void> {
    await db.delete(schema.prayerReactions)
      .where(eq(schema.prayerReactions.prayerRequestId, id));
    await db.delete(schema.prayerRequests)
      .where(eq(schema.prayerRequests.id, id));
  }

  // Board Members Methods
  async getAllBoardMembers(currentOnly: boolean = true): Promise<BoardMember[]> {
    if (currentOnly) {
      return db.select().from(schema.boardMembers)
        .where(eq(schema.boardMembers.isCurrent, true))
        .orderBy(asc(schema.boardMembers.orderIndex));
    }
    return db.select().from(schema.boardMembers)
      .orderBy(asc(schema.boardMembers.orderIndex));
  }

  async createBoardMember(data: InsertBoardMember): Promise<BoardMember> {
    const [member] = await db.insert(schema.boardMembers)
      .values(data)
      .returning();
    return member;
  }

  async updateBoardMember(id: number, data: Partial<InsertBoardMember>): Promise<BoardMember | null> {
    const [updated] = await db.update(schema.boardMembers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.boardMembers.id, id))
      .returning();
    return updated || null;
  }

  async deleteBoardMember(id: number): Promise<void> {
    await db.delete(schema.boardMembers).where(eq(schema.boardMembers.id, id));
  }

  // Banners Methods
  async getActiveBanners(): Promise<Banner[]> {
    const now = new Date();
    return db.select().from(schema.banners)
      .where(and(
        eq(schema.banners.isActive, true),
        or(
          isNull(schema.banners.startsAt),
          lte(schema.banners.startsAt, now)
        ),
        or(
          isNull(schema.banners.endsAt),
          gte(schema.banners.endsAt, now)
        )
      ))
      .orderBy(asc(schema.banners.orderIndex));
  }

  async getAllBanners(): Promise<Banner[]> {
    return db.select().from(schema.banners)
      .orderBy(asc(schema.banners.orderIndex));
  }

  async createBanner(data: InsertBanner): Promise<Banner> {
    const [banner] = await db.insert(schema.banners)
      .values(data)
      .returning();
    return banner;
  }

  async updateBanner(id: number, data: Partial<InsertBanner>): Promise<Banner | null> {
    const [updated] = await db.update(schema.banners)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.banners.id, id))
      .returning();
    return updated || null;
  }

  async deleteBanner(id: number): Promise<void> {
    await db.delete(schema.banners).where(eq(schema.banners.id, id));
  }

  // Site Content Methods
  async getSiteContent(page: string, section: string): Promise<SiteContent | null> {
    const [content] = await db.select().from(schema.siteContent)
      .where(and(
        eq(schema.siteContent.page, page),
        eq(schema.siteContent.section, section)
      ))
      .limit(1);
    return content || null;
  }

  async getAllSiteContent(): Promise<SiteContent[]> {
    return db.select().from(schema.siteContent)
      .orderBy(asc(schema.siteContent.page), asc(schema.siteContent.section));
  }

  async upsertSiteContent(data: InsertSiteContent): Promise<SiteContent> {
    const existing = await this.getSiteContent(data.page, data.section);
    if (existing) {
      const [updated] = await db.update(schema.siteContent)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.siteContent.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(schema.siteContent)
      .values(data)
      .returning();
    return created;
  }

  // ==================== AUDIT LOG METHODS ====================

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db.insert(schema.auditLogs)
      .values(log)
      .returning();
    return auditLog;
  }

  async getAuditLogs(filters?: { userId?: number; resource?: string; limit?: number }): Promise<AuditLog[]> {
    let query = db.select().from(schema.auditLogs);
    
    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq(schema.auditLogs.userId, filters.userId));
    }
    if (filters?.resource) {
      conditions.push(eq(schema.auditLogs.resource, filters.resource));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    
    return query
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(filters?.limit || 100);
  }

  // ==================== SEASON METHODS ====================

  async getAllSeasons(): Promise<schema.Season[]> {
    return db.select().from(schema.seasons)
      .orderBy(desc(schema.seasons.createdAt));
  }

  async getPublishedSeasons(): Promise<schema.Season[]> {
    return db.select().from(schema.seasons)
      .where(eq(schema.seasons.status, "published"))
      .orderBy(desc(schema.seasons.publishedAt));
  }

  async getSeasonById(id: number): Promise<schema.Season | null> {
    const [season] = await db.select().from(schema.seasons)
      .where(eq(schema.seasons.id, id))
      .limit(1);
    return season || null;
  }

  async createSeason(data: schema.InsertSeason): Promise<schema.Season> {
    const [season] = await db.insert(schema.seasons)
      .values(data)
      .returning();
    return season;
  }

  async updateSeason(id: number, data: Partial<schema.InsertSeason>): Promise<schema.Season | null> {
    const [updated] = await db.update(schema.seasons)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.seasons.id, id))
      .returning();
    return updated || null;
  }

  async deleteSeason(id: number): Promise<boolean> {
    const result = await db.delete(schema.seasons)
      .where(eq(schema.seasons.id, id));
    return true;
  }

  async publishSeason(id: number): Promise<schema.Season | null> {
    const [updated] = await db.update(schema.seasons)
      .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.seasons.id, id))
      .returning();
    return updated || null;
  }

  async getLessonsForSeason(seasonId: number): Promise<schema.StudyLesson[]> {
    return db.select().from(schema.studyLessons)
      .where(eq(schema.studyLessons.seasonId, seasonId))
      .orderBy(asc(schema.studyLessons.orderIndex));
  }

  async createSeasonLesson(data: { seasonId: number; orderIndex: number; lessonNumber?: number; title: string; type?: string; description?: string; xpReward?: number; estimatedMinutes?: number; icon?: string; isBonus?: boolean }): Promise<schema.StudyLesson> {
    const [lesson] = await db.insert(schema.studyLessons)
      .values({
        seasonId: data.seasonId,
        orderIndex: data.orderIndex,
        lessonNumber: data.lessonNumber,
        title: data.title,
        type: data.type || "study",
        description: data.description,
        xpReward: data.xpReward || 10,
        estimatedMinutes: data.estimatedMinutes || 5,
        icon: data.icon,
        isBonus: data.isBonus || false,
        isLocked: true,
        isReleased: false,
      })
      .returning();
    return lesson;
  }

  async releaseLessonInSeason(lessonId: number): Promise<schema.StudyLesson | null> {
    const [updated] = await db.update(schema.studyLessons)
      .set({ isReleased: true, isLocked: false, releaseDate: new Date(), updatedAt: new Date() })
      .where(eq(schema.studyLessons.id, lessonId))
      .returning();
    return updated || null;
  }

  // ==================== FINAL CHALLENGE METHODS ====================

  async getSeasonFinalChallenge(seasonId: number): Promise<schema.SeasonFinalChallenge | null> {
    const [challenge] = await db.select().from(schema.seasonFinalChallenges)
      .where(eq(schema.seasonFinalChallenges.seasonId, seasonId))
      .limit(1);
    return challenge || null;
  }

  async createFinalChallenge(data: schema.InsertSeasonFinalChallenge): Promise<schema.SeasonFinalChallenge> {
    const [challenge] = await db.insert(schema.seasonFinalChallenges)
      .values(data)
      .returning();
    return challenge;
  }

  async updateFinalChallenge(id: number, data: Partial<schema.InsertSeasonFinalChallenge>): Promise<schema.SeasonFinalChallenge | null> {
    const [updated] = await db.update(schema.seasonFinalChallenges)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.seasonFinalChallenges.id, id))
      .returning();
    return updated || null;
  }

  async startFinalChallenge(userId: number, challengeId: number): Promise<{ progress: schema.UserFinalChallengeProgress; token: string }> {
    const token = `${userId}-${challengeId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const existing = await this.getUserFinalChallengeProgress(userId, challengeId);
    if (existing && existing.isCompleted) {
      throw new Error("Desafio já foi completado");
    }

    if (existing) {
      const [updated] = await db.update(schema.userFinalChallengeProgress)
        .set({ startedAt: new Date(), challengeToken: token })
        .where(eq(schema.userFinalChallengeProgress.id, existing.id))
        .returning();
      return { progress: updated, token };
    }

    const [progress] = await db.insert(schema.userFinalChallengeProgress)
      .values({
        userId,
        challengeId,
        startedAt: new Date(),
        challengeToken: token,
      })
      .returning();
    return { progress, token };
  }

  async submitFinalChallenge(userId: number, challengeId: number, token: string, answers: number[]): Promise<schema.FinalChallengeResult> {
    const progress = await this.getUserFinalChallengeProgress(userId, challengeId);
    if (!progress) {
      throw new Error("Desafio não iniciado");
    }
    if (progress.challengeToken !== token) {
      throw new Error("Token inválido");
    }
    if (progress.isCompleted) {
      throw new Error("Desafio já foi completado");
    }

    const challenge = await db.select().from(schema.seasonFinalChallenges)
      .where(eq(schema.seasonFinalChallenges.id, challengeId))
      .limit(1)
      .then(r => r[0]);
    
    if (!challenge) {
      throw new Error("Desafio não encontrado");
    }

    const now = new Date();
    const startedAt = new Date(progress.startedAt);
    const timeSpentSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
    
    if (timeSpentSeconds > challenge.timeLimitSeconds + 10) {
      throw new Error("Tempo esgotado");
    }

    const questions: schema.FinalChallengeQuestion[] = JSON.parse(challenge.questions);
    let correctAnswers = 0;
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].correctAnswer) {
        correctAnswers++;
      }
    }

    const isPerfect = correctAnswers === challenge.questionCount && timeSpentSeconds <= challenge.timeLimitSeconds;
    let xpEarned = challenge.xpReward;
    if (isPerfect) {
      xpEarned += challenge.perfectXpBonus;
    }

    const [updated] = await db.update(schema.userFinalChallengeProgress)
      .set({
        completedAt: now,
        timeSpentSeconds,
        correctAnswers,
        xpEarned,
        isPerfect,
        isCompleted: true,
        answersGiven: JSON.stringify(answers),
      })
      .where(eq(schema.userFinalChallengeProgress.id, progress.id))
      .returning();

    if (isPerfect) {
      await this.updateUserSeasonProgress(userId, challenge.seasonId, {
        finalChallengeCompleted: true,
        finalChallengePerfect: true,
        isMastered: true,
      });
    } else {
      await this.updateUserSeasonProgress(userId, challenge.seasonId, {
        finalChallengeCompleted: true,
      });
    }

    return {
      challengeId,
      userId,
      correctAnswers,
      totalQuestions: challenge.questionCount,
      timeSpentSeconds,
      xpEarned,
      isPerfect,
      isMastered: isPerfect,
    };
  }

  async getUserFinalChallengeProgress(userId: number, challengeId: number): Promise<schema.UserFinalChallengeProgress | null> {
    const [progress] = await db.select().from(schema.userFinalChallengeProgress)
      .where(and(
        eq(schema.userFinalChallengeProgress.userId, userId),
        eq(schema.userFinalChallengeProgress.challengeId, challengeId)
      ))
      .limit(1);
    return progress || null;
  }

  // ==================== USER SEASON PROGRESS METHODS ====================

  async getUserSeasonProgress(userId: number, seasonId: number): Promise<schema.UserSeasonProgress | null> {
    const [progress] = await db.select().from(schema.userSeasonProgress)
      .where(and(
        eq(schema.userSeasonProgress.userId, userId),
        eq(schema.userSeasonProgress.seasonId, seasonId)
      ))
      .limit(1);
    return progress || null;
  }

  async updateUserSeasonProgress(userId: number, seasonId: number, data: Partial<schema.InsertUserSeasonProgress>): Promise<schema.UserSeasonProgress> {
    const existing = await this.getUserSeasonProgress(userId, seasonId);
    
    if (existing) {
      const [updated] = await db.update(schema.userSeasonProgress)
        .set({ ...data, lastActivityAt: new Date() })
        .where(eq(schema.userSeasonProgress.id, existing.id))
        .returning();
      return updated;
    }

    const season = await this.getSeasonById(seasonId);
    const [created] = await db.insert(schema.userSeasonProgress)
      .values({
        userId,
        seasonId,
        totalLessons: season?.totalLessons || 0,
        startedAt: new Date(),
        lastActivityAt: new Date(),
        ...data,
      })
      .returning();
    return created;
  }

  // ==================== SEASON RANKING METHODS ====================

  async getSeasonRankings(seasonId: number, limit: number = 50): Promise<schema.SeasonRankingEntry[]> {
    const rankings = await db.select({
      id: schema.seasonRankings.id,
      seasonId: schema.seasonRankings.seasonId,
      userId: schema.seasonRankings.userId,
      xpEarned: schema.seasonRankings.xpEarned,
      lessonsCompleted: schema.seasonRankings.lessonsCompleted,
      correctPercentage: schema.seasonRankings.correctPercentage,
      finalChallengeScore: schema.seasonRankings.finalChallengeScore,
      isMastered: schema.seasonRankings.isMastered,
      rankPosition: schema.seasonRankings.rankPosition,
      isWinner: schema.seasonRankings.isWinner,
      updatedAt: schema.seasonRankings.updatedAt,
      user: {
        id: schema.users.id,
        fullName: schema.users.fullName,
        photoUrl: schema.users.photoUrl,
      },
    })
    .from(schema.seasonRankings)
    .innerJoin(schema.users, eq(schema.seasonRankings.userId, schema.users.id))
    .where(eq(schema.seasonRankings.seasonId, seasonId))
    .orderBy(desc(schema.seasonRankings.xpEarned))
    .limit(limit);

    return rankings as schema.SeasonRankingEntry[];
  }

  async updateSeasonRanking(seasonId: number, userId: number): Promise<schema.SeasonRanking> {
    const progress = await this.getUserSeasonProgress(userId, seasonId);
    
    const xpEarned = progress?.xpEarned || 0;
    const lessonsCompleted = progress?.lessonsCompleted || 0;
    const correctPercentage = progress?.totalAnswers ? 
      Math.round((progress.correctAnswers / progress.totalAnswers) * 100) : 0;
    const isMastered = progress?.isMastered || false;

    const [existing] = await db.select().from(schema.seasonRankings)
      .where(and(
        eq(schema.seasonRankings.seasonId, seasonId),
        eq(schema.seasonRankings.userId, userId)
      ))
      .limit(1);

    if (existing) {
      const [updated] = await db.update(schema.seasonRankings)
        .set({ xpEarned, lessonsCompleted, correctPercentage, isMastered, updatedAt: new Date() })
        .where(eq(schema.seasonRankings.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(schema.seasonRankings)
      .values({ seasonId, userId, xpEarned, lessonsCompleted, correctPercentage, isMastered })
      .returning();
    return created;
  }

  async finalizeSeasonRankings(seasonId: number): Promise<void> {
    const rankings = await db.select().from(schema.seasonRankings)
      .where(eq(schema.seasonRankings.seasonId, seasonId))
      .orderBy(desc(schema.seasonRankings.xpEarned));

    for (let i = 0; i < rankings.length; i++) {
      await db.update(schema.seasonRankings)
        .set({ 
          rankPosition: i + 1, 
          isWinner: i === 0,
          updatedAt: new Date() 
        })
        .where(eq(schema.seasonRankings.id, rankings[i].id));
    }
  }

  // ==================== WEEKLY GOAL METHODS ====================

  async getWeeklyGoalProgress(userId: number, weekKey: string): Promise<schema.WeeklyGoalProgress | null> {
    const [progress] = await db.select().from(schema.weeklyGoalProgress)
      .where(and(
        eq(schema.weeklyGoalProgress.userId, userId),
        eq(schema.weeklyGoalProgress.weekKey, weekKey)
      ))
      .limit(1);
    return progress || null;
  }

  async updateWeeklyGoalProgress(userId: number, weekKey: string, data: Partial<schema.InsertWeeklyGoalProgress>): Promise<schema.WeeklyGoalProgress> {
    const existing = await this.getWeeklyGoalProgress(userId, weekKey);
    
    if (existing) {
      const [updated] = await db.update(schema.weeklyGoalProgress)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.weeklyGoalProgress.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(schema.weeklyGoalProgress)
      .values({ userId, weekKey, ...data })
      .returning();
    return created;
  }

  async getWeeklyGoalStatus(userId: number, weekKey: string): Promise<schema.WeeklyGoalStatus> {
    const profile = await this.getStudyProfile(userId);
    const progress = await this.getWeeklyGoalProgress(userId, weekKey);

    const goals = {
      lessons: {
        current: progress?.lessonsCompleted || 0,
        target: profile?.weeklyLessonsGoal || 1,
        completed: (progress?.lessonsCompleted || 0) >= (profile?.weeklyLessonsGoal || 1),
      },
      verses: {
        current: progress?.versesRead || 0,
        target: profile?.weeklyVersesGoal || 7,
        completed: (progress?.versesRead || 0) >= (profile?.weeklyVersesGoal || 7),
      },
      missions: {
        current: progress?.missionsCompleted || 0,
        target: profile?.weeklyMissionsGoal || 3,
        completed: (progress?.missionsCompleted || 0) >= (profile?.weeklyMissionsGoal || 3),
      },
      devotionals: {
        current: progress?.devotionalsRead || 0,
        target: profile?.weeklyDevotionalsGoal || 1,
        completed: (progress?.devotionalsRead || 0) >= (profile?.weeklyDevotionalsGoal || 1),
      },
    };

    const isGoalMet = goals.lessons.completed && goals.verses.completed && 
                      goals.missions.completed && goals.devotionals.completed;
    
    // Calculate overall progress as average of all goal progress percentages
    // Guard against zero targets to prevent NaN/Infinity
    const totalProgress = [goals.lessons, goals.verses, goals.missions, goals.devotionals]
      .reduce((sum, goal) => sum + Math.min(goal.current / Math.max(goal.target, 1), 1), 0);
    const overallProgress = Math.round((totalProgress / 4) * 100);
    
    return {
      weekKey,
      goals,
      isGoalMet,
      xpBonus: progress?.xpBonus || 0,
      overallProgress,
    };
  }

  async incrementWeeklyLesson(userId: number, weekKey: string): Promise<void> {
    const progress = await this.getWeeklyGoalProgress(userId, weekKey);
    await this.updateWeeklyGoalProgress(userId, weekKey, {
      lessonsCompleted: (progress?.lessonsCompleted || 0) + 1,
    });
    await this.checkAndAwardWeeklyGoalBonus(userId, weekKey);
  }

  async incrementWeeklyVerse(userId: number, weekKey: string): Promise<void> {
    const progress = await this.getWeeklyGoalProgress(userId, weekKey);
    await this.updateWeeklyGoalProgress(userId, weekKey, {
      versesRead: (progress?.versesRead || 0) + 1,
    });
    await this.checkAndAwardWeeklyGoalBonus(userId, weekKey);
  }

  async incrementWeeklyMission(userId: number, weekKey: string): Promise<void> {
    const progress = await this.getWeeklyGoalProgress(userId, weekKey);
    await this.updateWeeklyGoalProgress(userId, weekKey, {
      missionsCompleted: (progress?.missionsCompleted || 0) + 1,
    });
    await this.checkAndAwardWeeklyGoalBonus(userId, weekKey);
  }

  async incrementWeeklyDevotional(userId: number, weekKey: string): Promise<void> {
    const progress = await this.getWeeklyGoalProgress(userId, weekKey);
    await this.updateWeeklyGoalProgress(userId, weekKey, {
      devotionalsRead: (progress?.devotionalsRead || 0) + 1,
    });
    await this.checkAndAwardWeeklyGoalBonus(userId, weekKey);
  }

  private async checkAndAwardWeeklyGoalBonus(userId: number, weekKey: string): Promise<void> {
    const status = await this.getWeeklyGoalStatus(userId, weekKey);
    const progress = await this.getWeeklyGoalProgress(userId, weekKey);
    
    if (status.isGoalMet && !progress?.isGoalMet) {
      const xpBonus = 50;
      await this.updateWeeklyGoalProgress(userId, weekKey, {
        isGoalMet: true,
        xpBonus,
      });
      
      const profile = await this.getStudyProfile(userId);
      if (profile) {
        await db.update(schema.studyProfiles)
          .set({ totalXp: profile.totalXp + xpBonus, updatedAt: new Date() })
          .where(eq(schema.studyProfiles.id, profile.id));
      }
    }
  }

  // ==================== DEVOTIONAL READING METHODS ====================

  async confirmDevotionalRead(userId: number, devotionalId: number, weekKey?: string): Promise<schema.DevotionalReading> {
    const existing = await this.hasReadDevotional(userId, devotionalId);
    if (existing) {
      throw new Error("Devocional já foi confirmado como lido");
    }

    const [reading] = await db.insert(schema.devotionalReadings)
      .values({ userId, devotionalId, weekKey })
      .returning();
    
    if (weekKey) {
      await this.incrementWeeklyDevotional(userId, weekKey);
    }

    return reading;
  }

  async hasReadDevotional(userId: number, devotionalId: number): Promise<boolean> {
    const [reading] = await db.select().from(schema.devotionalReadings)
      .where(and(
        eq(schema.devotionalReadings.userId, userId),
        eq(schema.devotionalReadings.devotionalId, devotionalId)
      ))
      .limit(1);
    return !!reading;
  }

  async getDevotionalReadings(userId: number, limit: number = 10): Promise<schema.DevotionalReading[]> {
    return db.select().from(schema.devotionalReadings)
      .where(eq(schema.devotionalReadings.userId, userId))
      .orderBy(desc(schema.devotionalReadings.readAt))
      .limit(limit);
  }

  // ==================== DEVOTIONAL COMMENTS METHODS ====================

  async getApprovedDevotionalComments(devotionalId: number): Promise<DevotionalComment[]> {
    return db.select().from(schema.devotionalComments)
      .where(and(
        eq(schema.devotionalComments.devotionalId, devotionalId),
        eq(schema.devotionalComments.isApproved, true)
      ))
      .orderBy(desc(schema.devotionalComments.createdAt));
  }

  async getAllDevotionalComments(): Promise<DevotionalComment[]> {
    return db.select().from(schema.devotionalComments)
      .orderBy(desc(schema.devotionalComments.createdAt));
  }

  async createDevotionalComment(data: InsertDevotionalComment): Promise<DevotionalComment> {
    const [comment] = await db.insert(schema.devotionalComments)
      .values(data)
      .returning();
    return comment;
  }

  async approveDevotionalComment(id: number, approvedBy: number): Promise<DevotionalComment | null> {
    const [comment] = await db.update(schema.devotionalComments)
      .set({
        isApproved: true,
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.devotionalComments.id, id))
      .returning();
    return comment || null;
  }

  async highlightDevotionalComment(id: number, isHighlighted: boolean): Promise<DevotionalComment | null> {
    const [comment] = await db.update(schema.devotionalComments)
      .set({
        isHighlighted,
        updatedAt: new Date(),
      })
      .where(eq(schema.devotionalComments.id, id))
      .returning();
    return comment || null;
  }

  async deleteDevotionalComment(id: number): Promise<void> {
    await db.delete(schema.devotionalComments).where(eq(schema.devotionalComments.id, id));
  }

  // ==================== PUSH NOTIFICATION METHODS ====================

  async getPushSubscriptionsByUserId(userId: number): Promise<PushSubscription[]> {
    return db.select().from(schema.pushSubscriptions)
      .where(eq(schema.pushSubscriptions.userId, userId));
  }

  async updatePushSubscriptionLastUsed(subscriptionId: number): Promise<void> {
    await db.update(schema.pushSubscriptions)
      .set({ lastUsedAt: new Date() })
      .where(eq(schema.pushSubscriptions.id, subscriptionId));
  }

  async deletePushSubscription(userId: number, endpoint: string): Promise<void> {
    await db.delete(schema.pushSubscriptions)
      .where(and(
        eq(schema.pushSubscriptions.userId, userId),
        eq(schema.pushSubscriptions.endpoint, endpoint)
      ));
  }

  async getUsersBySecretaria(secretaria: string): Promise<User[]> {
    return db.select().from(schema.users)
      .where(and(
        eq(schema.users.secretaria, secretaria),
        eq(schema.users.isMember, true),
        eq(schema.users.activeMember, true)
      ));
  }

  async getAdminUsers(): Promise<User[]> {
    return db.select().from(schema.users)
      .where(eq(schema.users.isAdmin, true));
  }

  async getActiveMembers(): Promise<User[]> {
    return db.select().from(schema.users)
      .where(and(
        eq(schema.users.isMember, true),
        eq(schema.users.activeMember, true)
      ));
  }

  async createNotification(data: { userId: number; type: string; title: string; body: string; data?: string | null }): Promise<Notification> {
    const [notification] = await db.insert(schema.notifications)
      .values({
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        data: data.data || null,
      })
      .returning();
    return notification;
  }

  async getUsersWithActiveStreakNotStudiedToday(): Promise<{ userId: number; currentStreak: number }[]> {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());

    const profiles = await db.select({
      userId: schema.studyProfiles.userId,
      currentStreak: schema.studyProfiles.currentStreak,
      lastActivityDate: schema.studyProfiles.lastActivityDate,
    })
    .from(schema.studyProfiles)
    .innerJoin(schema.users, eq(schema.studyProfiles.userId, schema.users.id))
    .where(and(
      gt(schema.studyProfiles.currentStreak, 0),
      eq(schema.users.isMember, true),
      eq(schema.users.activeMember, true),
      sql`${schema.studyProfiles.lastActivityDate} IS NOT NULL`,
      ne(schema.studyProfiles.lastActivityDate, today)
    ));

    return profiles.map(p => ({
      userId: p.userId,
      currentStreak: p.currentStreak
    }));
  }

  async getInactiveUsersByDays(days: number): Promise<{ userId: number; daysSinceLastActivity: number }[]> {
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() - days);
    
    const targetDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(targetDate);

    const profiles = await db.select({
      userId: schema.studyProfiles.userId,
      lastActivityDate: schema.studyProfiles.lastActivityDate,
    })
    .from(schema.studyProfiles)
    .innerJoin(schema.users, eq(schema.studyProfiles.userId, schema.users.id))
    .where(and(
      eq(schema.users.isMember, true),
      eq(schema.users.activeMember, true),
      sql`${schema.studyProfiles.lastActivityDate} IS NOT NULL`,
      eq(schema.studyProfiles.lastActivityDate, targetDateStr)
    ));

    return profiles.map(p => ({
      userId: p.userId,
      daysSinceLastActivity: days
    }));
  }

  // ==================== ANONYMOUS PUSH SUBSCRIPTION METHODS ====================

  async saveAnonymousPushSubscription(endpoint: string, p256dh: string, auth: string): Promise<void> {
    const [existing] = await db.select().from(schema.anonymousPushSubscriptions)
      .where(eq(schema.anonymousPushSubscriptions.endpoint, endpoint))
      .limit(1);
    
    if (existing) {
      await db.update(schema.anonymousPushSubscriptions)
        .set({ p256dh, auth, lastUsed: new Date() })
        .where(eq(schema.anonymousPushSubscriptions.id, existing.id));
    } else {
      await db.insert(schema.anonymousPushSubscriptions).values({
        endpoint,
        p256dh,
        auth,
      });
    }
  }

  async removeAnonymousPushSubscription(endpoint: string): Promise<void> {
    await db.delete(schema.anonymousPushSubscriptions)
      .where(eq(schema.anonymousPushSubscriptions.endpoint, endpoint));
  }

  async getAllAnonymousPushSubscriptions(): Promise<AnonymousPushSubscription[]> {
    return db.select().from(schema.anonymousPushSubscriptions);
  }

  async updateAnonymousPushSubscriptionLastUsed(subscriptionId: number): Promise<void> {
    await db.update(schema.anonymousPushSubscriptions)
      .set({ lastUsed: new Date() })
      .where(eq(schema.anonymousPushSubscriptions.id, subscriptionId));
  }

  async deleteAnonymousPushSubscriptionByEndpoint(endpoint: string): Promise<void> {
    await db.delete(schema.anonymousPushSubscriptions)
      .where(eq(schema.anonymousPushSubscriptions.endpoint, endpoint));
  }
}

export const storage = new DatabaseStorage();
