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
  { verse: "Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.", reference: "Provérbios 3:5 (ARA)" },
  { verse: "Porque eu sei os planos que tenho para vocês, diz o Senhor, planos de prosperidade e não de calamidade, para dar-lhes um futuro e uma esperança.", reference: "Jeremias 29:11 (ARA)" },
  { verse: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus; eu te fortaleço, e te ajudo, e te sustento com a destra da minha justiça.", reference: "Isaías 41:10 (ARA)" },
  { verse: "O Senhor é a minha luz e a minha salvação; a quem temerei? O Senhor é a força da minha vida; de quem me recearei?", reference: "Salmos 27:1 (ARA)" },
  { verse: "Buscai primeiro o Reino de Deus e a sua justiça, e todas estas coisas vos serão acrescentadas.", reference: "Mateus 6:33 (ARA)" },
  { verse: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará.", reference: "Salmos 37:5 (ARA)" },
  { verse: "Porque pela graça sois salvos, mediante a fé; e isto não vem de vós; é dom de Deus.", reference: "Efésios 2:8 (ARA)" },
  { verse: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", reference: "Mateus 11:28 (ARA)" },
  { verse: "O Senhor é bom, e serve de fortaleza no dia da angústia, e conhece os que confiam nele.", reference: "Naum 1:7 (ARA)" },
  { verse: "Alegrem-se na esperança, sejam pacientes na tribulação, perseverem na oração.", reference: "Romanos 12:12 (ARA)" },
  { verse: "Sejam fortes e corajosos. Não tenham medo nem fiquem apavorados, pois o Senhor, o seu Deus, estará com vocês por onde vocês andarem.", reference: "Josué 1:9 (ARA)" },
  { verse: "Ele dá força ao cansado e aumenta o poder do fraco.", reference: "Isaías 40:29 (ARA)" },
  { verse: "Deus é o nosso refúgio e fortaleza, socorro bem presente na angústia.", reference: "Salmos 46:1 (ARA)" },
  { verse: "E a paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos pensamentos em Cristo Jesus.", reference: "Filipenses 4:7 (ARA)" },
  { verse: "O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha.", reference: "1 Coríntios 13:4 (ARA)" },
  { verse: "Se Deus é por nós, quem será contra nós?", reference: "Romanos 8:31 (ARA)" },
  { verse: "O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti e tenha misericórdia de ti.", reference: "Números 6:24-25 (ARA)" },
  { verse: "Aquele que habita no abrigo do Altíssimo descansará à sombra do Todo-Poderoso.", reference: "Salmos 91:1 (ARA)" },
  { verse: "Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.", reference: "1 Pedro 5:7 (ARA)" },
  { verse: "Eu sou o caminho, a verdade e a vida. Ninguém vem ao Pai senão por mim.", reference: "João 14:6 (ARA)" },
  { verse: "Porque onde estiver o vosso tesouro, aí estará também o vosso coração.", reference: "Mateus 6:21 (ARA)" },
  { verse: "Orem sem cessar.", reference: "1 Tessalonicenses 5:17 (ARA)" },
  { verse: "Não andeis ansiosos de coisa alguma; em tudo, porém, sejam conhecidas diante de Deus as vossas petições, pela oração e pela súplica.", reference: "Filipenses 4:6 (ARA)" },
  { verse: "Antes sede uns para com os outros benignos, misericordiosos, perdoando-vos uns aos outros, como também Deus vos perdoou em Cristo.", reference: "Efésios 4:32 (ARA)" },
  { verse: "Mas os que esperam no Senhor renovarão as suas forças; subirão com asas como águias; correrão e não se cansarão; caminharão e não se fatigarão.", reference: "Isaías 40:31 (ARA)" },
  { verse: "O Senhor é fiel; ele os fortalecerá e os protegerá do Maligno.", reference: "2 Tessalonicenses 3:3 (ARA)" },
  { verse: "Deem graças em todas as circunstâncias, pois esta é a vontade de Deus para vocês em Cristo Jesus.", reference: "1 Tessalonicenses 5:18 (ARA)" },
];

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

async function processStreakCheck(): Promise<void> {
  console.log('[DeoGlory Scheduler] Running streak check at 19:00...');
  
  try {
    const usersNeedingCheck = await storage.getUsersNeedingStreakCheck();
    
    if (usersNeedingCheck.length === 0) {
      console.log('[DeoGlory Scheduler] No users with active streak needing check');
      return;
    }
    
    console.log(`[DeoGlory Scheduler] Found ${usersNeedingCheck.length} user(s) needing streak check`);
    
    let remindersCount = 0;
    let freezesUsed = 0;
    let streaksLost = 0;
    
    for (const user of usersNeedingCheck) {
      try {
        const newWarningDay = user.streakWarningDay + 1;
        
        if (newWarningDay === 1) {
          await storage.updateStreakWarningDay(user.userId, 1);
          await notifyStreakWarningDay1(user.userId, user.currentStreak);
          remindersCount++;
          console.log(`[DeoGlory Scheduler] Day 1 warning sent to user ${user.userId} (streak: ${user.currentStreak})`);
        } else if (newWarningDay >= 2) {
          if (user.streakFreezesAvailable > 0) {
            const froze = await storage.useStreakFreeze(user.userId, user.currentStreak, true);
            if (froze) {
              await notifyStreakFreezeUsed(user.userId, user.currentStreak);
              freezesUsed++;
              console.log(`[DeoGlory Scheduler] Streak freeze auto-used for user ${user.userId} (streak: ${user.currentStreak})`);
            }
          } else {
            await storage.resetStreak(user.userId);
            await notifyStreakLost(user.userId, user.currentStreak);
            streaksLost++;
            console.log(`[DeoGlory Scheduler] Streak lost for user ${user.userId} (was: ${user.currentStreak})`);
          }
        }
      } catch (error) {
        console.error(`[DeoGlory Scheduler] Error processing streak for user ${user.userId}:`, error);
      }
    }
    
    console.log(`[DeoGlory Scheduler] Streak check completed. Reminders: ${remindersCount}, Freezes used: ${freezesUsed}, Streaks lost: ${streaksLost}`);
  } catch (error) {
    console.error('[DeoGlory Scheduler] Error during streak check:', error);
  }
}

async function notifyStreakWarningDay1(userId: number, currentStreak: number): Promise<void> {
  const messages = [
    `Sua ofensiva de ${currentStreak} dias está em risco! Faça uma lição hoje para manter.`,
    `Ei! Não deixe sua sequência de ${currentStreak} dias escapar. Uma lição rápida resolve!`,
    `Faltam poucas horas! Proteja sua ofensiva de ${currentStreak} dias agora.`,
    `Sua dedicação de ${currentStreak} dias é inspiradora! Continue hoje.`,
  ];
  const message = messages[Math.floor(Math.random() * messages.length)];
  
  await notifyStreakReminder(userId, currentStreak, message, "warning");
}

async function notifyStreakFreezeUsed(userId: number, savedStreak: number): Promise<void> {
  const message = `Seu congelamento salvou sua ofensiva de ${savedStreak} dias! Volte amanhã para continuar.`;
  await notifyStreakReminder(userId, savedStreak, message, "freeze_used");
}

async function notifyStreakLost(userId: number, lostStreak: number): Promise<void> {
  const message = `Que pena! Sua ofensiva de ${lostStreak} dias foi perdida. Mas não desista, comece uma nova hoje!`;
  await notifyStreakReminder(userId, 0, message, "lost");
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
  cron.schedule('0 19 * * *', processStreakCheck, {
    timezone: 'America/Sao_Paulo'
  });
  console.log('[DeoGlory Scheduler] Streak check initialized - will run daily at 19:00 (America/Sao_Paulo)');
  
  cron.schedule('30 15 * * *', sendInactivityReminders, {
    timezone: 'America/Sao_Paulo'
  });
  console.log('[DeoGlory Scheduler] Inactivity check initialized - will run daily at 15:30 (America/Sao_Paulo)');
}

function getRandomBibleVerse(): { verse: string; reference: string } {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const index = dayOfYear % BIBLE_VERSES.length;
  return BIBLE_VERSES[index];
}

async function sendDailyVerse(): Promise<void> {
  console.log('[Daily Verse Scheduler] Sending daily verse notification...');
  
  try {
    let verse: string;
    let reference: string;
    
    if (isAIConfigured()) {
      const aiVerse = await generateDailyVerseWithAI();
      if (aiVerse) {
        verse = aiVerse.verse;
        reference = aiVerse.reference;
        console.log('[Daily Verse Scheduler] Using AI-generated verse');
      } else {
        const fallback = getRandomBibleVerse();
        verse = fallback.verse;
        reference = fallback.reference;
        console.log('[Daily Verse Scheduler] AI failed, using fallback verse');
      }
    } else {
      const fallback = getRandomBibleVerse();
      verse = fallback.verse;
      reference = fallback.reference;
      console.log('[Daily Verse Scheduler] AI not configured, using fallback verse');
    }
    
    await notifyDailyVerse(verse, reference);
    console.log(`[Daily Verse Scheduler] Sent: ${reference}`);
  } catch (error) {
    console.error('[Daily Verse Scheduler] Error sending daily verse:', error);
  }
}

export function initDailyVerseScheduler(): void {
  cron.schedule('30 15 * * *', sendDailyVerse, {
    timezone: 'America/Sao_Paulo'
  });
  console.log('[Daily Verse Scheduler] Initialized - will run daily at 15:30 (America/Sao_Paulo)');
}

function getTodayRecoveryCategory(): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year')?.value || '2025';
  const month = parts.find(p => p.type === 'month')?.value || '01';
  const day = parts.find(p => p.type === 'day')?.value || '01';
  return `recovery-${year}-${month}-${day}`;
}

async function generateDailyRecoveryVerses(): Promise<void> {
  console.log('[Recovery Verses Scheduler] Generating daily recovery verses...');
  
  try {
    const todayCategory = getTodayRecoveryCategory();
    
    const existingVerses = await storage.getAllBibleVerses();
    const alreadyGenerated = existingVerses.some(v => v.category === todayCategory);
    
    if (alreadyGenerated) {
      console.log(`[Recovery Verses Scheduler] Verses already generated for today (${todayCategory})`);
      return;
    }
    
    if (!isAIConfigured()) {
      console.log('[Recovery Verses Scheduler] AI not configured, skipping verse generation');
      return;
    }
    
    const generatedVerses = await generateRecoveryVersesWithAI(30);
    
    if (!generatedVerses || generatedVerses.length === 0) {
      console.log('[Recovery Verses Scheduler] AI did not generate any verses');
      return;
    }
    
    const existingReferences = new Set(existingVerses.map(v => v.reference));
    let addedCount = 0;
    
    for (const verse of generatedVerses) {
      if (existingReferences.has(verse.reference)) {
        console.log(`[Recovery Verses Scheduler] Skipping duplicate: ${verse.reference}`);
        continue;
      }
      
      await storage.createBibleVerse(
        verse.reference,
        verse.verse,
        verse.reflection,
        todayCategory
      );
      existingReferences.add(verse.reference);
      addedCount++;
    }
    
    console.log(`[Recovery Verses Scheduler] Added ${addedCount} new recovery verses for ${todayCategory}`);
  } catch (error) {
    console.error('[Recovery Verses Scheduler] Error generating recovery verses:', error);
  }
}

export function initRecoveryVersesScheduler(): void {
  cron.schedule('30 15 * * *', generateDailyRecoveryVerses, {
    timezone: 'America/Sao_Paulo'
  });
  console.log('[Recovery Verses Scheduler] Initialized - will run daily at 15:30 (America/Sao_Paulo)');
}

async function runInstagramSync(): Promise<void> {
  console.log('[Instagram Scheduler] Running sync...');
  
  try {
    const result = await syncInstagramPosts();
    console.log(`[Instagram Scheduler] Sync completed: ${result.synced} posts synced, ${result.errors} errors`);
  } catch (error) {
    console.error('[Instagram Scheduler] Error during sync:', error);
  }
}

export function initInstagramScheduler(): void {
  if (!isInstagramConfigured()) {
    console.log('[Instagram Scheduler] Not configured - INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID required');
    return;
  }
  
  cron.schedule('0 */6 * * *', runInstagramSync, {
    timezone: 'America/Sao_Paulo'
  });
  console.log('[Instagram Scheduler] Initialized - will sync every 6 hours (America/Sao_Paulo)');
  
  runInstagramSync();
}

export { sendBirthdayEmails, sendStreakReminders, sendInactivityReminders, sendDailyVerse, generateDailyRecoveryVerses, runInstagramSync };
