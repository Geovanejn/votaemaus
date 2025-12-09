import cron from "node-cron";
import { storage } from "./storage";
import { sendBirthdayEmail } from "./email";
import { notifyStreakReminder, notifyInactivity, notifyDailyVerse } from "./notifications";
import { syncInstagramPosts, isInstagramConfigured } from "./instagram";
import { generateDailyVerseWithAI, isAIConfigured } from "./ai";

const BIBLE_VERSES = [
  { verse: "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigenito, para que todo aquele que nele cre nao pereca, mas tenha a vida eterna.", reference: "Joao 3:16" },
  { verse: "O Senhor e o meu pastor; nada me faltara.", reference: "Salmos 23:1" },
  { verse: "Tudo posso naquele que me fortalece.", reference: "Filipenses 4:13" },
  { verse: "Confia no Senhor de todo o teu coracao e nao te estribes no teu proprio entendimento.", reference: "Proverbios 3:5" },
  { verse: "Porque eu sei os planos que tenho para voces, diz o Senhor, planos de prosperidade e nao de calamidade, para dar-lhes um futuro e uma esperanca.", reference: "Jeremias 29:11" },
  { verse: "Nao temas, porque eu sou contigo; nao te assombres, porque eu sou o teu Deus; eu te fortaleco, e te ajudo, e te sustento com a destra da minha justica.", reference: "Isaias 41:10" },
  { verse: "O Senhor e a minha luz e a minha salvacao; a quem temerei? O Senhor e a forca da minha vida; de quem me recearei?", reference: "Salmos 27:1" },
  { verse: "Buscai primeiro o Reino de Deus e a sua justica, e todas estas coisas vos serao acrescentadas.", reference: "Mateus 6:33" },
  { verse: "Entrega o teu caminho ao Senhor; confia nele, e ele tudo fara.", reference: "Salmos 37:5" },
  { verse: "Porque pela graca sois salvos, mediante a fe; e isto nao vem de vos; e dom de Deus.", reference: "Efesios 2:8" },
  { verse: "Vinde a mim, todos os que estais cansados e oprimidos, e eu vos aliviarei.", reference: "Mateus 11:28" },
  { verse: "O Senhor e bom, e serve de fortaleza no dia da angustia, e conhece os que confiam nele.", reference: "Naum 1:7" },
  { verse: "Alegrem-se na esperanca, sejam pacientes na tribulacao, perseverem na oracao.", reference: "Romanos 12:12" },
  { verse: "Sejam fortes e corajosos. Nao tenham medo nem fiquem apavorados, pois o Senhor, o seu Deus, estara com voces por onde voces andarem.", reference: "Josue 1:9" },
  { verse: "Ele da forca ao cansado e aumenta o poder do fraco.", reference: "Isaias 40:29" },
  { verse: "Deus e o nosso refugio e fortaleza, socorro bem presente na angustia.", reference: "Salmos 46:1" },
  { verse: "E a paz de Deus, que excede todo o entendimento, guardara os vossos coracoes e os vossos pensamentos em Cristo Jesus.", reference: "Filipenses 4:7" },
  { verse: "O amor e paciente, o amor e bondoso. Nao inveja, nao se vangloria, nao se orgulha.", reference: "1 Corintios 13:4" },
  { verse: "Se Deus e por nos, quem sera contra nos?", reference: "Romanos 8:31" },
  { verse: "O Senhor te abencoe e te guarde; o Senhor faca resplandecer o seu rosto sobre ti e tenha misericordia de ti.", reference: "Numeros 6:24-25" },
  { verse: "Aquele que habita no abrigo do Altissimo descansara a sombra do Todo-Poderoso.", reference: "Salmos 91:1" },
  { verse: "Lancando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vos.", reference: "1 Pedro 5:7" },
  { verse: "Eu sou o caminho, a verdade e a vida. Ninguem vem ao Pai senao por mim.", reference: "Joao 14:6" },
  { verse: "Porque onde estiver o vosso tesouro, ai estara tambem o vosso coracao.", reference: "Mateus 6:21" },
  { verse: "Orem sem cessar.", reference: "1 Tessalonicenses 5:17" },
  { verse: "Nao andeis ansiosos de coisa alguma; em tudo, porem, sejam conhecidas diante de Deus as vossas peticoes, pela oracao e pela suplica.", reference: "Filipenses 4:6" },
  { verse: "Antes sede uns para com os outros benignos, misericordiosos, perdoando-vos uns aos outros, como tambem Deus vos perdoou em Cristo.", reference: "Efesios 4:32" },
  { verse: "Mas os que esperam no Senhor renovarao as suas forcas; subiram com asas como aguias; correrao e nao se cansarao; caminharao e nao se fatigarao.", reference: "Isaias 40:31" },
  { verse: "O Senhor e fiel; ele os fortalecera e os protegera do Maligno.", reference: "2 Tessalonicenses 3:3" },
  { verse: "Deem gracas em todas as circunstancias, pois esta e a vontade de Deus para voces em Cristo Jesus.", reference: "1 Tessalonicenses 5:18" },
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
  cron.schedule('30 15 * * *', sendStreakReminders, {
    timezone: 'America/Sao_Paulo'
  });
  console.log('[DeoGlory Scheduler] Streak reminder initialized - will run daily at 15:30 (America/Sao_Paulo)');
  
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

export { sendBirthdayEmails, sendStreakReminders, sendInactivityReminders, sendDailyVerse, runInstagramSync };
