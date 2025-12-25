import webpush from "web-push";
import { storage } from "./storage";
import type { User, PushSubscription, AnonymousPushSubscription } from "@shared/schema";
import {
  sendNewPrayerRequestEmail,
  sendNewCommentEmail,
  sendNewDevotionalEmail,
  sendNewEventEmail,
  sendSeasonPublishedEmail,
  isEmailConfigured,
} from "./email";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = "mailto:suporte@emausvota.com.br";

let webPushConfigured = false;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    webPushConfigured = true;
    console.log("[Push] Web Push configured successfully");
  } catch (error) {
    console.error("[Push] Failed to configure web push:", error);
  }
} else {
  console.log("[Push] VAPID keys not configured - push notifications disabled");
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, any>;
}

export type NotificationType =
  | "new_devotional"
  | "new_event"
  | "new_prayer_request"
  | "prayer_approved"
  | "new_comment"
  | "streak_reminder"
  | "lesson_available"
  | "season_published"
  | "season_ended"
  | "achievement"
  | "achievement_liked"
  | "encouragement"
  | "inactivity_reminder"
  | "daily_verse"
  | "system";

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload
): Promise<boolean> {
  if (!webPushConfigured) {
    console.log("[Push] Web push not configured, skipping notification");
    return false;
  }

  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || "/logo.png",
        badge: payload.badge || "/favicon.png",
        data: {
          url: payload.url || "/",
          ...payload.data,
        },
        tag: payload.tag,
      })
    );

    await storage.updatePushSubscriptionLastUsed(subscription.id);
    return true;
  } catch (error: any) {
    console.error("[Push] Error sending notification:", error);
    
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log(`[Push] Subscription expired/invalid, removing: ${subscription.endpoint}`);
      await storage.deletePushSubscription(subscription.userId, subscription.endpoint);
    }
    
    return false;
  }
}

export async function sendPushToUser(
  userId: number,
  payload: NotificationPayload
): Promise<number> {
  const subscriptions = await storage.getPushSubscriptionsByUserId(userId);
  
  if (subscriptions.length === 0) {
    console.log(`[Push] No subscriptions found for user ${userId} - user needs to enable notifications`);
    return 0;
  }
  
  console.log(`[Push] Sending "${payload.title}" to user ${userId} (${subscriptions.length} subscription(s))`);
  let successCount = 0;

  for (const subscription of subscriptions) {
    const success = await sendPushNotification(subscription, payload);
    if (success) {
      successCount++;
      console.log(`[Push] Successfully sent to user ${userId}`);
    }
  }

  return successCount;
}

export async function sendPushToUsers(
  userIds: number[],
  payload: NotificationPayload
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const userId of userIds) {
    const count = await sendPushToUser(userId, payload);
    if (count > 0) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

export async function sendPushToSecretaria(
  secretaria: "espiritualidade" | "marketing",
  payload: NotificationPayload
): Promise<{ sent: number; failed: number }> {
  const users = await storage.getUsersBySecretaria(secretaria);
  const admins = await storage.getAdminUsers();
  
  const allUsers = [...users, ...admins];
  const uniqueUserIds = Array.from(new Set(allUsers.map(u => u.id)));

  return sendPushToUsers(uniqueUserIds, payload);
}

export async function sendPushToAllMembers(
  payload: NotificationPayload
): Promise<{ sent: number; failed: number }> {
  const members = await storage.getActiveMembers();
  const userIds = members.map(m => m.id);

  return sendPushToUsers(userIds, payload);
}

export async function sendPushToAllMembersIncludingInactive(
  payload: NotificationPayload
): Promise<{ sent: number; failed: number }> {
  const members = await storage.getAllMembers();
  const userIds = members.map(m => m.id);

  return sendPushToUsers(userIds, payload);
}

export async function sendAnonymousPushNotification(
  subscription: AnonymousPushSubscription,
  payload: NotificationPayload
): Promise<boolean> {
  if (!webPushConfigured) {
    return false;
  }

  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || "/logo.png",
        badge: payload.badge || "/favicon.png",
        data: {
          url: payload.url || "/",
          ...payload.data,
        },
        tag: payload.tag,
      })
    );

    await storage.updateAnonymousPushSubscriptionLastUsed(subscription.id);
    return true;
  } catch (error: any) {
    console.error("[Push] Error sending anonymous notification:", error);
    
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log(`[Push] Anonymous subscription expired/invalid, removing: ${subscription.endpoint}`);
      await storage.deleteAnonymousPushSubscriptionByEndpoint(subscription.endpoint);
    }
    
    return false;
  }
}

export async function sendPushToAllAnonymousVisitors(
  payload: NotificationPayload
): Promise<{ sent: number; failed: number }> {
  const subscriptions = await storage.getAllAnonymousPushSubscriptions();
  let sent = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    const success = await sendAnonymousPushNotification(subscription, payload);
    if (success) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

export async function createInAppNotification(
  userId: number,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  await storage.createNotification({
    userId,
    type,
    title,
    body,
    data: data ? JSON.stringify(data) : null,
  });
}

export async function notifyNewDevotional(
  devotionalId: number,
  title: string,
  imageUrl?: string | null
): Promise<void> {
  console.log(`[Notifications] notifyNewDevotional STARTED for devotional ${devotionalId}: "${title}"`);
  
  const payload: NotificationPayload = {
    title: "Novo Devocional",
    body: `"${title}" foi publicado. Leia agora!`,
    url: `/devocionais/${devotionalId}`,
    tag: `devotional-${devotionalId}`,
  };

  const activeMembers = await storage.getActiveMembers();
  console.log(`[Notifications] Sending devotional notification to ${activeMembers.length} active members`);
  
  for (const member of activeMembers) {
    await sendPushToUser(member.id, payload);
    await createInAppNotification(
      member.id,
      "new_devotional",
      payload.title,
      payload.body,
      { devotionalId, url: payload.url }
    );
  }

  // Send email to ALL members (active and inactive) - deduplicated by email
  if (isEmailConfigured()) {
    const allMembers = await storage.getAllMembers();
    
    // Deduplicate by email address
    const emailMap = new Map<string, { email: string; fullName: string }>();
    for (const member of allMembers) {
      if (member.email && !emailMap.has(member.email.toLowerCase())) {
        emailMap.set(member.email.toLowerCase(), { email: member.email, fullName: member.fullName });
      }
    }
    
    const uniqueRecipients = Array.from(emailMap.values());
    
    // Send emails in parallel batches for better performance
    const batchSize = 10;
    let emailsSent = 0;
    
    for (let i = 0; i < uniqueRecipients.length; i += batchSize) {
      const batch = uniqueRecipients.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(recipient => 
          sendNewDevotionalEmail(recipient.email, recipient.fullName, title, devotionalId, imageUrl || null)
        )
      );
      
      emailsSent += results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    }
    
    console.log(`[Notifications] Devotional email sent to ${emailsSent}/${uniqueRecipients.length} members (all active and inactive)`);
  }

  // Also notify anonymous visitors
  const anonymousResult = await sendPushToAllAnonymousVisitors(payload);
  console.log(`[Notifications] New devotional notification sent to ${activeMembers.length} active members and ${anonymousResult.sent} anonymous visitors`);
}

export async function notifyNewEvent(
  eventId: number,
  title: string,
  eventDate?: string,
  eventLocation?: string | null,
  imageUrl?: string | null
): Promise<void> {
  console.log(`[Notifications] notifyNewEvent STARTED for event ${eventId}: "${title}"`);
  
  const payload: NotificationPayload = {
    title: "Novo Evento",
    body: `"${title}" foi adicionado a agenda. Confira!`,
    url: `/agenda/${eventId}`,
    tag: `event-${eventId}`,
  };

  const activeMembers = await storage.getActiveMembers();
  console.log(`[Notifications] Sending event notification to ${activeMembers.length} active members`);
  
  for (const member of activeMembers) {
    await sendPushToUser(member.id, payload);
    await createInAppNotification(
      member.id,
      "new_event",
      payload.title,
      payload.body,
      { eventId, url: payload.url }
    );
  }

  // Send email to ALL members (active and inactive) - deduplicated by email
  if (isEmailConfigured() && eventDate) {
    const allMembers = await storage.getAllMembers();
    
    // Deduplicate by email address
    const emailMap = new Map<string, { email: string; fullName: string }>();
    for (const member of allMembers) {
      if (member.email && !emailMap.has(member.email.toLowerCase())) {
        emailMap.set(member.email.toLowerCase(), { email: member.email, fullName: member.fullName });
      }
    }
    
    const uniqueRecipients = Array.from(emailMap.values());
    
    // Send emails in parallel batches for better performance
    const batchSize = 10;
    let emailsSent = 0;
    
    for (let i = 0; i < uniqueRecipients.length; i += batchSize) {
      const batch = uniqueRecipients.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(recipient => 
          sendNewEventEmail(recipient.email, recipient.fullName, title, eventDate, eventLocation || null, eventId, imageUrl || null)
        )
      );
      
      emailsSent += results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    }
    
    console.log(`[Notifications] Event email sent to ${emailsSent}/${uniqueRecipients.length} members (all active and inactive)`);
  }

  // Also notify anonymous visitors
  const anonymousResult = await sendPushToAllAnonymousVisitors(payload);
  console.log(`[Notifications] New event notification sent to ${activeMembers.length} active members and ${anonymousResult.sent} anonymous visitors`);
}

export async function notifyNewPrayerRequest(
  requestId: number,
  requesterName: string,
  category?: string,
  requestText?: string
): Promise<void> {
  console.log(`[Notifications] notifyNewPrayerRequest STARTED for request ${requestId} from "${requesterName}"`);
  
  const payload: NotificationPayload = {
    title: "Novo Pedido de Oracao",
    body: `${requesterName} enviou um pedido de oracao.`,
    url: "/oracao",
    tag: `prayer-${requestId}`,
  };

  const pushResult = await sendPushToAllMembers(payload);
  console.log(`[Notifications] Prayer request push complete: ${pushResult.sent} sent, ${pushResult.failed} failed`);

  // Send email to ALL members (active and inactive) - deduplicated by email
  if (isEmailConfigured() && category && requestText) {
    const allMembers = await storage.getAllMembers();
    
    // Deduplicate by email address
    const emailMap = new Map<string, { email: string; fullName: string }>();
    for (const member of allMembers) {
      if (member.email && !emailMap.has(member.email.toLowerCase())) {
        emailMap.set(member.email.toLowerCase(), { email: member.email, fullName: member.fullName });
      }
    }
    
    const uniqueRecipients = Array.from(emailMap.values());
    
    // Send emails in parallel batches for better performance
    const batchSize = 10;
    let emailsSent = 0;

    for (let i = 0; i < uniqueRecipients.length; i += batchSize) {
      const batch = uniqueRecipients.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(recipient => 
          sendNewPrayerRequestEmail(
            recipient.email,
            recipient.fullName,
            requesterName,
            category,
            requestText
          )
        )
      );
      
      emailsSent += results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    }
    
    console.log(`[Notifications] Prayer request email sent to ${emailsSent}/${uniqueRecipients.length} members (all active and inactive)`);
  }
}

export async function notifyPrayerApproved(
  userId: number,
  prayerRequestId: number
): Promise<void> {
  console.log(`[Notifications] notifyPrayerApproved STARTED for user ${userId}, request ${prayerRequestId}`);
  
  const payload: NotificationPayload = {
    title: "Pedido de Oracao Aprovado",
    body: "Seu pedido de oracao foi aprovado e esta no Mural da Oracao!",
    url: "/oracao",
    tag: `prayer-approved-${prayerRequestId}`,
  };

  const result = await sendPushToUser(userId, payload);
  console.log(`[Notifications] Prayer approved push to user ${userId}: ${result ? 'success' : 'failed'}`);
  await createInAppNotification(
    userId,
    "prayer_approved",
    payload.title,
    payload.body,
    { prayerRequestId, url: payload.url }
  );
}

export async function notifyNewComment(
  devotionalId: number,
  devotionalTitle: string,
  commenterName: string,
  commentText?: string
): Promise<void> {
  console.log(`[Notifications] notifyNewComment STARTED for devotional ${devotionalId} from "${commenterName}"`);
  
  const payload: NotificationPayload = {
    title: "Novo Comentario",
    body: `${commenterName} comentou em "${devotionalTitle}"`,
    url: "/admin/espiritualidade/comentarios",
    tag: `comment-${devotionalId}`,
  };

  const result = await sendPushToSecretaria("espiritualidade", payload);
  console.log(`[Notifications] New comment notification: ${result.sent} sent, ${result.failed} failed`);

  if (isEmailConfigured() && commentText) {
    const users = await storage.getUsersBySecretaria("espiritualidade");
    const admins = await storage.getAdminUsers();
    const allUsers = [...users, ...admins];
    const uniqueUsers = allUsers.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );

    for (const user of uniqueUsers) {
      if (user.email) {
        await sendNewCommentEmail(
          user.email,
          user.fullName,
          commenterName,
          devotionalTitle,
          commentText
        );
      }
    }
    console.log(`[Notifications] Comment email sent to ${uniqueUsers.length} espiritualidade members`);
  }
}

export async function notifySeasonPublished(
  seasonId: number,
  seasonTitle: string,
  seasonDescription?: string | null,
  coverImageUrl?: string | null
): Promise<void> {
  console.log(`[Notifications] notifySeasonPublished STARTED for season ${seasonId}: "${seasonTitle}"`);
  
  const payload: NotificationPayload = {
    title: "Nova Revista DeoGlory!",
    body: `"${seasonTitle}" está disponível. Comece a estudar agora!`,
    url: "/study",
    tag: `season-${seasonId}`,
  };

  const activeMembers = await storage.getActiveMembers();
  console.log(`[Notifications] Sending season notification to ${activeMembers.length} active members`);
  
  for (const member of activeMembers) {
    await sendPushToUser(member.id, payload);
    await createInAppNotification(
      member.id,
      "season_published",
      payload.title,
      payload.body,
      { seasonId, url: payload.url }
    );
  }

  // Send email to ALL members (active and inactive) - deduplicated by email
  if (isEmailConfigured()) {
    const allMembers = await storage.getAllMembers();
    
    // Deduplicate by email address
    const emailMap = new Map<string, { email: string; fullName: string }>();
    for (const member of allMembers) {
      if (member.email && !emailMap.has(member.email.toLowerCase())) {
        emailMap.set(member.email.toLowerCase(), { email: member.email, fullName: member.fullName });
      }
    }
    
    const uniqueRecipients = Array.from(emailMap.values());
    
    // Send emails in parallel batches for better performance
    const batchSize = 10;
    let emailsSent = 0;
    
    for (let i = 0; i < uniqueRecipients.length; i += batchSize) {
      const batch = uniqueRecipients.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(recipient => 
          sendSeasonPublishedEmail(recipient.email, recipient.fullName, seasonTitle, seasonDescription || null, coverImageUrl || null)
        )
      );
      
      emailsSent += results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    }
    
    console.log(`[Notifications] Season email sent to ${emailsSent}/${uniqueRecipients.length} members (all active and inactive)`);
  }

  console.log(`[Notifications] Season published notification sent to ${activeMembers.length} active members`);
}

export async function notifyLessonAvailable(
  userId: number,
  lessonTitle: string,
  seasonTitle: string
): Promise<void> {
  console.log(`[Notifications] notifyLessonAvailable STARTED for user ${userId}: "${lessonTitle}"`);
  
  const payload: NotificationPayload = {
    title: "Nova Licao Disponivel!",
    body: `"${lessonTitle}" de "${seasonTitle}" esta liberada.`,
    url: "/study",
    tag: "lesson-available",
  };

  const result = await sendPushToUser(userId, payload);
  console.log(`[Notifications] Lesson available push to user ${userId}: ${result ? 'success' : 'failed'}`);
  await createInAppNotification(
    userId,
    "lesson_available",
    payload.title,
    payload.body,
    { url: payload.url }
  );
}

export async function notifyNewLessonToAll(
  lessonTitle: string,
  seasonTitle: string
): Promise<void> {
  console.log(`[Notifications] notifyNewLessonToAll STARTED: "${lessonTitle}" from "${seasonTitle}"`);
  
  const payload: NotificationPayload = {
    title: "Nova Unidade de Estudo!",
    body: `"${lessonTitle}" de "${seasonTitle}" foi liberada. Estude agora!`,
    url: "/study",
    tag: "new-lesson",
  };

  const activeMembers = await storage.getActiveMembers();
  console.log(`[Notifications] Sending new lesson notification to ${activeMembers.length} active members`);
  
  for (const member of activeMembers) {
    await sendPushToUser(member.id, payload);
    await createInAppNotification(
      member.id,
      "lesson_available",
      payload.title,
      payload.body,
      { url: payload.url }
    );
  }

  console.log(`[Notifications] New lesson notification sent to ${activeMembers.length} active members`);
}

export async function notifyStreakReminder(
  userId: number,
  currentStreak: number,
  customMessage?: string,
  type?: "warning" | "freeze_used" | "lost"
): Promise<void> {
  let title: string;
  let message: string;
  
  if (customMessage) {
    message = customMessage;
  } else {
    const messages = [
      `Sua ofensiva de ${currentStreak} dias esta em risco!`,
      `Nao perca sua ofensiva! ${currentStreak} dias de dedicacao.`,
      `So uma licao rapida para manter sua ofensiva de ${currentStreak} dias!`,
    ];
    message = messages[Math.floor(Math.random() * messages.length)];
  }
  
  switch (type) {
    case "warning":
      title = "DeoGlory - Ofensiva em Risco!";
      break;
    case "freeze_used":
      title = "DeoGlory - Congelamento Usado!";
      break;
    case "lost":
      title = "DeoGlory - Ofensiva Perdida";
      break;
    default:
      title = "DeoGlory - Mantenha sua Ofensiva!";
  }

  const payload: NotificationPayload = {
    title,
    body: message,
    url: "/study",
    tag: "streak-reminder",
  };

  console.log(`[Notifications] notifyStreakReminder for user ${userId}, streak ${currentStreak}, type: ${type || 'default'}`);
  const result = await sendPushToUser(userId, payload);
  console.log(`[Notifications] Streak reminder push to user ${userId}: ${result ? 'success' : 'failed'}`);
  
  await createInAppNotification(
    userId,
    "streak_reminder",
    title,
    message,
    { currentStreak, type, url: payload.url }
  );
}

export async function notifyInactivity(
  userId: number,
  daysSinceLastAccess: number
): Promise<void> {
  const messages: Record<number, string> = {
    2: "Sentimos sua falta! Seu streak esta em risco.",
    3: "Opa! Ja faz 3 dias. Volte para continuar crescendo!",
    5: "Nao desista! 5 dias longe, mas nunca e tarde para voltar.",
    7: "Uma semana sem estudar? Vamos retomar juntos!",
    10: "10 dias! Sua jornada espiritual precisa de voce.",
    15: "15 dias longe... Que tal um novo comeco hoje?",
  };

  const message = messages[daysSinceLastAccess];
  if (!message) return;

  const payload: NotificationPayload = {
    title: "DeoGlory sente sua falta!",
    body: message,
    url: "/study",
    tag: "inactivity-reminder",
  };

  console.log(`[Notifications] notifyInactivity for user ${userId}, days: ${daysSinceLastAccess}`);
  const result = await sendPushToUser(userId, payload);
  console.log(`[Notifications] Inactivity reminder push to user ${userId}: ${result ? 'success' : 'failed'}`);
  
  await createInAppNotification(
    userId,
    "inactivity_reminder",
    payload.title,
    payload.body,
    { daysSinceLastAccess, url: payload.url }
  );
}

export async function notifyAchievement(
  userId: number,
  achievementName: string,
  achievementDescription: string
): Promise<void> {
  console.log(`[Notifications] notifyAchievement STARTED for user ${userId}: "${achievementName}"`);
  
  const payload: NotificationPayload = {
    title: "Nova Conquista Desbloqueada!",
    body: `${achievementName}: ${achievementDescription}`,
    url: "/study/achievements",
    tag: `achievement-${achievementName}`,
  };

  const result = await sendPushToUser(userId, payload);
  console.log(`[Notifications] Achievement push to user ${userId}: ${result ? 'success' : 'failed'}`);
  await createInAppNotification(
    userId,
    "achievement",
    payload.title,
    payload.body,
    { achievementName, url: payload.url }
  );
}

export async function notifyAchievementLiked(
  userId: number,
  likerName: string,
  achievementName: string
): Promise<void> {
  console.log(`[Notifications] notifyAchievementLiked STARTED for user ${userId} from "${likerName}"`);
  
  const payload: NotificationPayload = {
    title: "Conquista Curtida!",
    body: `${likerName} curtiu sua conquista "${achievementName}"`,
    url: "/study/profile",
    tag: `achievement-like-${Date.now()}`,
  };

  const result = await sendPushToUser(userId, payload);
  console.log(`[Notifications] Achievement liked push to user ${userId}: ${result ? 'success' : 'failed'}`);
  await createInAppNotification(
    userId,
    "achievement_liked",
    payload.title,
    payload.body,
    { likerName, achievementName, url: payload.url }
  );
}

export async function notifyDailyVerse(verse: string, reference: string): Promise<void> {
  const payload: NotificationPayload = {
    title: "Versiculo do Dia",
    body: `"${verse.substring(0, 100)}${verse.length > 100 ? '...' : ''}" - ${reference}`,
    url: "/study",
    tag: "daily-verse",
    icon: "/logo.png",
  };

  const result = await sendPushToAllMembers(payload);
  
  // Also notify anonymous visitors
  const anonymousResult = await sendPushToAllAnonymousVisitors(payload);
  console.log(`[Notifications] Daily verse notification: ${result.sent} members sent, ${anonymousResult.sent} anonymous visitors sent`);
}

export function isWebPushConfigured(): boolean {
  return webPushConfigured;
}
