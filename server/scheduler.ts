import cron from "node-cron";
import { storage } from "./storage";
import { sendBirthdayEmail } from "./email";
import { notifyStreakReminder, notifyInactivity } from "./notifications";

function getTodayDateString(): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    month: '2-digit',
    day: '2-digit'
  });
  
  const parts = formatter.formatToParts(new Date());
  const month = parts.find(p => p.type === 'month')?.value || '01';
  const day = parts.find(p => p.type === 'day')?.value || '01';
  
  return `${month}-${day}`;
}

async function sendBirthdayEmails(): Promise<void> {
  console.log('[Birthday Scheduler] Running daily birthday check...');
  
  try {
    const allMembers = storage.getAllMembers();
    const todayDateString = getTodayDateString();
    
    const birthdayMembers = allMembers.filter(member => {
      if (!member.birthdate) return false;
      
      const birthdateParts = member.birthdate.split('-');
      if (birthdateParts.length !== 3) return false;
      
      const month = birthdateParts[1];
      const day = birthdateParts[2];
      const memberDateString = `${month}-${day}`;
      
      return memberDateString === todayDateString;
    });
    
    if (birthdayMembers.length === 0) {
      console.log('[Birthday Scheduler] No birthdays today');
      return;
    }
    
    console.log(`[Birthday Scheduler] Found ${birthdayMembers.length} birthday(s) today`);
    
    for (const member of birthdayMembers) {
      try {
        const sent = await sendBirthdayEmail(
          member.fullName, 
          member.email,
          member.photoUrl || null
        );
        if (sent) {
          console.log(`[Birthday Scheduler] ✓ Sent birthday email to ${member.fullName} (${member.email})`);
        } else {
          console.log(`[Birthday Scheduler] ✗ Failed to send birthday email to ${member.fullName} (${member.email})`);
        }
      } catch (error) {
        console.error(`[Birthday Scheduler] Error sending email to ${member.fullName}:`, error);
      }
    }
    
    console.log(`[Birthday Scheduler] Completed. Sent ${birthdayMembers.length} birthday email(s)`);
  } catch (error) {
    console.error('[Birthday Scheduler] Error during birthday check:', error);
  }
}

export function initBirthdayScheduler(): void {
  cron.schedule('0 7 * * *', sendBirthdayEmails, {
    timezone: 'America/Sao_Paulo'
  });
  
  console.log('[Birthday Scheduler] Initialized - will run daily at 07:00 AM (America/Sao_Paulo)');
}

async function sendStreakReminders(): Promise<void> {
  console.log('[DeoGlory Scheduler] Running streak reminder check...');
  
  try {
    const usersWithStreak = await storage.getUsersWithActiveStreakNotStudiedToday();
    
    if (usersWithStreak.length === 0) {
      console.log('[DeoGlory Scheduler] No users with active streak needing reminder');
      return;
    }
    
    console.log(`[DeoGlory Scheduler] Found ${usersWithStreak.length} user(s) with active streak needing reminder`);
    
    for (const user of usersWithStreak) {
      try {
        await notifyStreakReminder(user.userId, user.currentStreak);
        console.log(`[DeoGlory Scheduler] Sent streak reminder to user ${user.userId} (streak: ${user.currentStreak})`);
      } catch (error) {
        console.error(`[DeoGlory Scheduler] Error sending streak reminder to user ${user.userId}:`, error);
      }
    }
    
    console.log(`[DeoGlory Scheduler] Streak reminder completed. Sent ${usersWithStreak.length} notification(s)`);
  } catch (error) {
    console.error('[DeoGlory Scheduler] Error during streak reminder check:', error);
  }
}

async function sendInactivityReminders(): Promise<void> {
  console.log('[DeoGlory Scheduler] Running inactivity check...');
  
  const inactivityDays = [2, 3, 5, 7, 10, 15];
  let totalSent = 0;
  
  try {
    for (const days of inactivityDays) {
      const inactiveUsers = await storage.getInactiveUsersByDays(days);
      
      for (const user of inactiveUsers) {
        try {
          await notifyInactivity(user.userId, user.daysSinceLastActivity);
          totalSent++;
          console.log(`[DeoGlory Scheduler] Sent ${days}-day inactivity reminder to user ${user.userId}`);
        } catch (error) {
          console.error(`[DeoGlory Scheduler] Error sending inactivity reminder to user ${user.userId}:`, error);
        }
      }
    }
    
    console.log(`[DeoGlory Scheduler] Inactivity check completed. Sent ${totalSent} notification(s)`);
  } catch (error) {
    console.error('[DeoGlory Scheduler] Error during inactivity check:', error);
  }
}

export function initDeoGlorySchedulers(): void {
  cron.schedule('0 18 * * *', sendStreakReminders, {
    timezone: 'America/Sao_Paulo'
  });
  console.log('[DeoGlory Scheduler] Streak reminder initialized - will run daily at 18:00 (America/Sao_Paulo)');
  
  cron.schedule('0 10 * * *', sendInactivityReminders, {
    timezone: 'America/Sao_Paulo'
  });
  console.log('[DeoGlory Scheduler] Inactivity check initialized - will run daily at 10:00 (America/Sao_Paulo)');
}

export { sendBirthdayEmails, sendStreakReminders, sendInactivityReminders };
