import cron from "node-cron";
import { storage } from "./storage";
import { sendBirthdayEmail } from "./email";
import { notifyStreakReminder, notifyInactivity, notifyDailyVerse } from "./notifications";
import { syncInstagramPosts, isInstagramConfigured } from "./instagram";
import { generateDailyVerseWithAI, generateRecoveryVersesWithAI, isAIConfigured } from "./ai";

const BIBLE_VERSES = [
  { verse: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.", reference: "João 3:16 (ARA)" },
  { verse: "O Senhor é o meu pastor; nada me faltará.", reference: "Salmos 23:1 (ARA)" },
  { verse: "Tudo posso naquele que me fortalece.", reference: "Filipenses 4:13 (ARA)" },
  { verse: "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.", reference: "Provérbios 3:5 (ARA)" }
];

function getTodayDateString(): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(new Date());
  return `${parts.find(p => p.type === 'month')?.value || '01'}-${parts.find(p => p.type === 'day')?.value || '01'}`;
}

async function sendBirthdayEmails(): Promise<void> {
  try {
    const allMembers = await storage.getAllMembers();
    const todayDateString = getTodayDateString();
    const birthdayMembers = allMembers.filter(member => {
      if (!member.birthdate) return false;
      const parts = member.birthdate.split('-');
      return parts.length === 3 && `${parts[1]}-${parts[2]}` === todayDateString;
    });
    for (const member of birthdayMembers) {
      await sendBirthdayEmail(member.fullName, member.email, member.photoUrl || null);
    }
  } catch (error) {
    console.error('[Birthday Scheduler] Error:', error);
  }
}

export function initBirthdayScheduler(): void {
  cron.schedule('0 7 * * *', sendBirthdayEmails, { timezone: 'America/Sao_Paulo' });
}

async function processStreakCheck(): Promise<void> {
  try {
    const users = await storage.getUsersNeedingStreakCheck();
    for (const user of users) {
      // Streak logic
    }
  } catch (error) {
    console.error('[DeoGlory Scheduler] Streak check error:', error);
  }
}

export function initDeoGlorySchedulers(): void {
  cron.schedule('0 19 * * *', processStreakCheck, { timezone: 'America/Sao_Paulo' });
}

async function sendDailyVerse(): Promise<void> {
  try {
    const verse = BIBLE_VERSES[0];
    await notifyDailyVerse(verse.verse, verse.reference);
  } catch (error) {
    console.error('[Daily Verse Scheduler] Error:', error);
  }
}

export function initDailyVerseScheduler(): void {
  cron.schedule('0 7 * * *', sendDailyVerse, { timezone: 'America/Sao_Paulo' });
}

export function initRecoveryVersesScheduler(): void {}
export function initInstagramScheduler(): void {}
export function initDailyMissionsScheduler(): void {}
export function initWeeklyGoalScheduler(): void {}

async function releaseDailyLessons(): Promise<void> {
  try {
    const events = await storage.getActiveStudyEvents();
    for (const event of events) {
      const start = new Date(event.startDate);
      const now = new Date();
      const day = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const lesson = await storage.getStudyEventLessonByDay(event.id, day);
      if (lesson && lesson.status === "locked") {
        await storage.updateStudyEventLesson(lesson.id, { status: "published" });
      }
    }
  } catch (error) {}
}

async function distributeEventCards(): Promise<void> {
  try {
    const events = await storage.getActiveStudyEvents();
    for (const event of events) {
      const end = new Date(event.endDate || "");
      const now = new Date();
      if (now.toDateString() === end.toDateString()) {
        // Card distribution
      }
    }
  } catch (error) {}
}

export function initEventScheduler(): void {
  cron.schedule("0 0 * * *", releaseDailyLessons, { timezone: "America/Sao_Paulo" });
  cron.schedule("59 23 * * *", distributeEventCards, { timezone: "America/Sao_Paulo" });
}

export { sendBirthdayEmails, sendDailyVerse, releaseDailyLessons, distributeEventCards };
