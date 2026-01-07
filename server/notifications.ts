import webpush from "web-push";
import { storage } from "./storage";
import type { User, PushSubscription, AnonymousPushSubscription } from "@shared/schema";
import {
  sendNewPrayerRequestEmail,
  sendNewCommentEmail,
  sendNewDevotionalEmail,
  sendNewEventEmail,
  sendSeasonPublishedEmail,
  sendNewStudyEventEmail,
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
  | "prayer_liked"
  | "devotional_comment"
  | "event_deadline"
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
    ).then(() => {
      console.log(`[Push] Successfully sent notification to ${subscription.userId ? 'member user ' + subscription.userId : 'anonymous user ' + subscription.id}`);
    }).catch(err => {
      console.error(`[Push] WebPush delivery error for ${subscription.userId ? 'member user ' + subscription.userId : 'anonymous user ' + subscription.id}:`, err.message || err);
      throw err;
    });

    await storage.updatePushSubscriptionLastUsed(subscription.id);
    return true;
  } catch (error: any) {
    const statusCode = error.statusCode || error.status;
    console.error(`[Push] Error sending notification (status ${statusCode}):`, error.message || error);
    
    if (statusCode === 410 || statusCode === 404 || statusCode === 401) {
      console.log(`[Push] Subscription expired/invalid (${statusCode}), removing: ${subscription.endpoint.substring(0, 50)}...`);
      try {
        await storage.deletePushSubscription(subscription.userId, subscription.endpoint);
      } catch (e) {
        console.error("[Push] Failed to delete invalid subscription:", e);
      }
    }
    
    return false;
  }
}

export async function sendPushToUser(
  userId: number,
  payload: NotificationPayload
): Promise<number> {
  try {
    const subscriptions = await storage.getPushSubscriptionsByUserId(userId);
    
    if (subscriptions.length === 0) {
      console.log(`[Push] User ${userId} has no push subscriptions registered`);
      return 0;
    }
    
    let successCount = 0;

    for (const subscription of subscriptions) {
      try {
        const success = await sendPushNotification(subscription, payload);
        if (success) {
          successCount++;
        }
      } catch (error) {
        console.error(`[Push] Error sending to subscription for user ${userId}:`, error);
      }
    }

    if (successCount > 0) {
      console.log(`[Push] Sent "${payload.title}" to user ${userId} (${successCount}/${subscriptions.length} success)`);
    } else {
      console.log(`[Push] All ${subscriptions.length} subscriptions failed for user ${userId}`);
    }
    return successCount;
  } catch (error) {
    console.error(`[Push] Error in sendPushToUser for user ${userId}:`, error);
    return 0;
  }
}

export async function sendPushToUsers(
  userIds: number[],
  payload: NotificationPayload
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const userId of userIds) {
    try {
      const count = await sendPushToUser(userId, payload);
      if (count > 0) {
        sent++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`[Push] Error sending to user ${userId}:`, error);
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

  console.log(`[Push] Sending "${payload.title}" to ${userIds.length} active members`);
  return sendPushToUsers(userIds, payload);
}

export async function sendPushToAllMembersIncludingInactive(
  payload: NotificationPayload
): Promise<{ sent: number; failed: number }> {
  const members = await storage.getAllMembers();
  const userIds = members.map(m => m.id);

  console.log(`[Push] Sending "${payload.title}" to ${userIds.length} members (including inactive)`);
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
    ).then(() => {
      console.log(`[Push] Successfully sent notification to ${subscription.userId ? 'member user ' + subscription.userId : 'anonymous user ' + subscription.id}`);
    }).catch(err => {
      console.error(`[Push] WebPush delivery error for ${subscription.userId ? 'member user ' + subscription.userId : 'anonymous user ' + subscription.id}:`, err.message || err);
      throw err;
    });

    await storage.updateAnonymousPushSubscriptionLastUsed(subscription.id);
    return true;
  } catch (error: any) {
    if (error.statusCode === 410 || error.statusCode === 404) {
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
    try {
      const success = await sendAnonymousPushNotification(subscription, payload);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    } catch (error) {
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
  try {
    await storage.createNotification({
      userId,
      type,
      title,
      body,
      data: data ? JSON.stringify(data) : null,
    });
  } catch (error) {
    console.error(`[Notifications] Failed to create in-app notification for user ${userId}:`, error);
  }
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
    icon: "/logo.png",
  };

  // Send push notifications to all active members
  const pushResult = await sendPushToAllMembers(payload);
  console.log(`[Notifications] Devotional push: ${pushResult.sent} sent, ${pushResult.failed} failed`);

  // Create in-app notifications (separate loop to not block push)
  const activeMembers = await storage.getActiveMembers();
  for (const member of activeMembers) {
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
    const emailMap = new Map<string, { email: string; fullName: string }>();
    for (const member of allMembers) {
      if (member.email && !emailMap.has(member.email.toLowerCase())) {
        emailMap.set(member.email.toLowerCase(), { email: member.email, fullName: member.fullName });
      }
    }
    
    const uniqueRecipients = Array.from(emailMap.values());
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
    console.log(`[Notifications] Devotional email sent to ${emailsSent}/${uniqueRecipients.length} members`);
  }

  // Also notify anonymous visitors
  const anonymousResult = await sendPushToAllAnonymousVisitors(payload);
  console.log(`[Notifications] Devotional anonymous push: ${anonymousResult.sent} sent`);
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
    icon: "/logo.png",
  };

  // Send push notifications to all active members
  const pushResult = await sendPushToAllMembers(payload);
  console.log(`[Notifications] Event push: ${pushResult.sent} sent, ${pushResult.failed} failed`);

  // Create in-app notifications
  const activeMembers = await storage.getActiveMembers();
  for (const member of activeMembers) {
    await createInAppNotification(
      member.id,
      "new_event",
      payload.title,
      payload.body,
      { eventId, url: payload.url }
    );
  }

  // Send email to ALL members
  if (isEmailConfigured() && eventDate) {
    const allMembers = await storage.getAllMembers();
    const emailMap = new Map<string, { email: string; fullName: string }>();
    for (const member of allMembers) {
      if (member.email && !emailMap.has(member.email.toLowerCase())) {
        emailMap.set(member.email.toLowerCase(), { email: member.email, fullName: member.fullName });
      }
    }
    
    const uniqueRecipients = Array.from(emailMap.values());
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
    console.log(`[Notifications] Event email sent to ${emailsSent}/${uniqueRecipients.length} members`);
  }

  // Also notify anonymous visitors
  const anonymousResult = await sendPushToAllAnonymousVisitors(payload);
  console.log(`[Notifications] Event anonymous push: ${anonymousResult.sent} sent`);
}

export async function notifyNewPrayerRequest(
  requestId: number,
  requesterName: string,
  category?: string,
  requestText?: string
): Promise<void> {
  console.log(`[Notifications] notifyNewPrayerRequest STARTED for request ${requestId} from "${requesterName}"`);
  
  const payload: NotificationPayload = {
    title: "Novo Pedido de Oração",
    body: `${requesterName} enviou um pedido de oração.`,
    url: "/oracao",
    tag: `prayer-${requestId}`,
    icon: "/logo.png",
  };

  const pushResult = await sendPushToAllMembers(payload);
  console.log(`[Notifications] Prayer request push: ${pushResult.sent} sent, ${pushResult.failed} failed`);

  // Send email to ALL members
  if (isEmailConfigured() && category && requestText) {
    const allMembers = await storage.getAllMembers();
    const emailMap = new Map<string, { email: string; fullName: string }>();
    for (const member of allMembers) {
      if (member.email && !emailMap.has(member.email.toLowerCase())) {
        emailMap.set(member.email.toLowerCase(), { email: member.email, fullName: member.fullName });
      }
    }
    
    const uniqueRecipients = Array.from(emailMap.values());
    const batchSize = 10;
    let emailsSent = 0;

    for (let i = 0; i < uniqueRecipients.length; i += batchSize) {
      const batch = uniqueRecipients.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(recipient => 
          sendNewPrayerRequestEmail(recipient.email, recipient.fullName, requesterName, category, requestText)
        )
      );
      emailsSent += results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    }
    console.log(`[Notifications] Prayer request email sent to ${emailsSent}/${uniqueRecipients.length} members`);
  }
}

export async function notifyPrayerApproved(
  userId: number,
  prayerRequestId: number
): Promise<void> {
  console.log(`[Notifications] notifyPrayerApproved STARTED for user ${userId}, request ${prayerRequestId}`);
  
  const payload: NotificationPayload = {
    title: "Pedido de Oração Aprovado",
    body: "Seu pedido de oração foi aprovado e está no Mural da Oração!",
    url: "/oracao",
    tag: `prayer-approved-${prayerRequestId}`,
    icon: "/logo.png",
  };

  const result = await sendPushToUser(userId, payload);
  console.log(`[Notifications] Prayer approved push to user ${userId}: ${result > 0 ? 'success' : 'no subscriptions'}`);
  
  await createInAppNotification(
    userId,
    "prayer_approved",
    payload.title,
    payload.body,
    { prayerRequestId, url: payload.url }
  );
}

export async function notifyPrayerLiked(
  userId: number,
  likerName: string,
  prayerRequestId: number
): Promise<void> {
  console.log(`[Notifications] notifyPrayerLiked STARTED for user ${userId} from "${likerName}"`);
  
  const payload: NotificationPayload = {
    title: "Curtida no seu Pedido",
    body: `${likerName} curtiu seu pedido de oração`,
    url: "/oracao",
    tag: `prayer-like-${Date.now()}`,
    icon: "/logo.png",
  };

  const result = await sendPushToUser(userId, payload);
  console.log(`[Notifications] Prayer liked push to user ${userId}: ${result > 0 ? 'success' : 'no subscriptions'}`);
  
  await createInAppNotification(
    userId,
    "prayer_liked",
    payload.title,
    payload.body,
    { likerName, prayerRequestId, url: payload.url }
  );
}

export async function notifyDevotionalComment(
  authorUserId: number,
  commenterName: string,
  devotionalTitle: string,
  devotionalId: number
): Promise<void> {
  console.log(`[Notifications] notifyDevotionalComment for user ${authorUserId} from "${commenterName}"`);
  
  const payload: NotificationPayload = {
    title: "Novo Comentário",
    body: `${commenterName} comentou em "${devotionalTitle}"`,
    url: `/devocionais/${devotionalId}`,
    tag: `devotional-comment-${Date.now()}`,
    icon: "/logo.png",
  };

  const result = await sendPushToUser(authorUserId, payload);
  console.log(`[Notifications] Devotional comment push to user ${authorUserId}: ${result > 0 ? 'success' : 'no subscriptions'}`);
  
  await createInAppNotification(
    authorUserId,
    "devotional_comment",
    payload.title,
    payload.body,
    { commenterName, devotionalId, url: payload.url }
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
    title: "Novo Comentário",
    body: `${commenterName} comentou em "${devotionalTitle}"`,
    url: "/admin/espiritualidade/comentarios",
    tag: `comment-${devotionalId}`,
    icon: "/logo.png",
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
        try {
          await sendNewCommentEmail(user.email, user.fullName, commenterName, devotionalTitle, commentText);
        } catch (error) {
          console.error(`[Notifications] Failed to send comment email to ${user.email}`);
        }
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
    icon: "/logo.png",
  };

  // Send push notifications to all active members
  const pushResult = await sendPushToAllMembers(payload);
  console.log(`[Notifications] Season push: ${pushResult.sent} sent, ${pushResult.failed} failed`);

  // Create in-app notifications
  const activeMembers = await storage.getActiveMembers();
  for (const member of activeMembers) {
    await createInAppNotification(
      member.id,
      "season_published",
      payload.title,
      payload.body,
      { seasonId, url: payload.url }
    );
  }

  // Send email to ALL members
  if (isEmailConfigured()) {
    const allMembers = await storage.getAllMembers();
    const emailMap = new Map<string, { email: string; fullName: string }>();
    for (const member of allMembers) {
      if (member.email && !emailMap.has(member.email.toLowerCase())) {
        emailMap.set(member.email.toLowerCase(), { email: member.email, fullName: member.fullName });
      }
    }
    
    const uniqueRecipients = Array.from(emailMap.values());
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
    console.log(`[Notifications] Season email sent to ${emailsSent}/${uniqueRecipients.length} members`);
  }

  console.log(`[Notifications] Season published notification complete`);
}

export async function notifyNewStudyEvent(
  eventId: number,
  title: string,
  description: string | null,
  startDate: string,
  endDate: string,
  imageUrl: string | null
): Promise<void> {
  console.log(`[Notifications] notifyNewStudyEvent STARTED for event ${eventId}: "${title}"`);
  
  const payload: NotificationPayload = {
    title: "Novo Evento Especial!",
    body: `"${title}" está disponível no DeoGlory. Participe agora!`,
    url: `/study/events/${eventId}`,
    tag: `study-event-${eventId}`,
    icon: "/logo.png",
  };

  // Send push notifications to all active members
  const pushResult = await sendPushToAllMembers(payload);
  console.log(`[Notifications] Study event push: ${pushResult.sent} sent, ${pushResult.failed} failed`);

  // Create in-app notifications
  const activeMembers = await storage.getActiveMembers();
  for (const member of activeMembers) {
    try {
      await createInAppNotification(
        member.id,
        "new_event",
        payload.title,
        payload.body,
        { eventId, url: payload.url }
      );
    } catch (error) {
      console.error(`[Notifications] Failed to create in-app notification for user ${member.id}:`, error);
    }
  }

  // Send email to ALL members
  if (isEmailConfigured()) {
    const allMembers = await storage.getAllMembers();
    const emailMap = new Map<string, { email: string; fullName: string }>();
    for (const member of allMembers) {
      if (member.email && !emailMap.has(member.email.toLowerCase())) {
        emailMap.set(member.email.toLowerCase(), { email: member.email, fullName: member.fullName });
      }
    }
    
    const uniqueRecipients = Array.from(emailMap.values());
    const batchSize = 10;
    let emailsSent = 0;
    
    for (let i = 0; i < uniqueRecipients.length; i += batchSize) {
      const batch = uniqueRecipients.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(recipient => 
          sendNewStudyEventEmail(
            recipient.email, 
            recipient.fullName, 
            title, 
            description,
            startDate,
            endDate,
            eventId, 
            imageUrl
          )
        )
      );
      emailsSent += results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    }
    console.log(`[Notifications] Study event email sent to ${emailsSent}/${uniqueRecipients.length} members`);
  }

  console.log(`[Notifications] Study event notification complete`);
}

export async function notifyLessonAvailable(
  userId: number,
  lessonTitle: string,
  seasonTitle: string
): Promise<void> {
  console.log(`[Notifications] notifyLessonAvailable STARTED for user ${userId}: "${lessonTitle}"`);
  
  const payload: NotificationPayload = {
    title: "Nova Lição Disponível!",
    body: `"${lessonTitle}" de "${seasonTitle}" está liberada.`,
    url: "/study",
    tag: "lesson-available",
    icon: "/logo.png",
  };

  const result = await sendPushToUser(userId, payload);
  console.log(`[Notifications] Lesson available push to user ${userId}: ${result > 0 ? 'success' : 'no subscriptions'}`);
  
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
    icon: "/logo.png",
  };

  // Send push notifications
  const pushResult = await sendPushToAllMembers(payload);
  console.log(`[Notifications] New lesson push: ${pushResult.sent} sent, ${pushResult.failed} failed`);

  // Create in-app notifications
  const activeMembers = await storage.getActiveMembers();
  for (const member of activeMembers) {
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
      `Sua ofensiva de ${currentStreak} dias está em risco!`,
      `Não perca sua ofensiva! ${currentStreak} dias de dedicação.`,
      `Só uma lição rápida para manter sua ofensiva de ${currentStreak} dias!`,
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
    icon: "/logo.png",
  };

  console.log(`[Notifications] notifyStreakReminder for user ${userId}, streak ${currentStreak}, type: ${type || 'default'}`);
  const result = await sendPushToUser(userId, payload);
  console.log(`[Notifications] Streak reminder push to user ${userId}: ${result > 0 ? 'success' : 'no subscriptions'}`);
  
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
    2: "Sentimos sua falta! Seu streak está em risco.",
    3: "Opa! Já faz 3 dias. Volte para continuar crescendo!",
    5: "Não desista! 5 dias longe, mas nunca é tarde para voltar.",
    7: "Uma semana sem estudar? Vamos retomar juntos!",
    10: "10 dias! Sua jornada espiritual precisa de você.",
    15: "15 dias longe... Que tal um novo começo hoje?",
  };

  const message = messages[daysSinceLastAccess];
  if (!message) return;

  const payload: NotificationPayload = {
    title: "DeoGlory sente sua falta!",
    body: message,
    url: "/study",
    tag: "inactivity-reminder",
    icon: "/logo.png",
  };

  console.log(`[Notifications] notifyInactivity for user ${userId}, days: ${daysSinceLastAccess}`);
  const result = await sendPushToUser(userId, payload);
  console.log(`[Notifications] Inactivity reminder push to user ${userId}: ${result > 0 ? 'success' : 'no subscriptions'}`);
  
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
    icon: "/logo.png",
  };

  const result = await sendPushToUser(userId, payload);
  console.log(`[Notifications] Achievement push to user ${userId}: ${result > 0 ? 'success' : 'no subscriptions'}`);
  
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
    icon: "/logo.png",
  };

  const result = await sendPushToUser(userId, payload);
  console.log(`[Notifications] Achievement liked push to user ${userId}: ${result > 0 ? 'success' : 'no subscriptions'}`);
  
  await createInAppNotification(
    userId,
    "achievement_liked",
    payload.title,
    payload.body,
    { likerName, achievementName, url: payload.url }
  );
}

export async function notifyEncouragement(
  userId: number,
  senderName: string,
  messageText: string,
  encouragementId: number
): Promise<void> {
  console.log(`[Notifications] notifyEncouragement STARTED for user ${userId} from "${senderName}"`);
  
  const payload: NotificationPayload = {
    title: "Mensagem de Incentivo",
    body: `${senderName}: ${messageText}`,
    url: "/study",
    tag: `encouragement-${encouragementId}`,
    icon: "/logo.png",
  };

  const result = await sendPushToUser(userId, payload);
  console.log(`[Notifications] Encouragement push to user ${userId}: ${result > 0 ? 'success' : 'no subscriptions'}`);
  
  await createInAppNotification(
    userId,
    "encouragement",
    payload.title,
    payload.body,
    { senderName, url: payload.url }
  );
}

export async function notifyEventStartingSoon(
  eventId: number,
  eventTitle: string
): Promise<void> {
  console.log(`[Notifications] notifyEventStartingSoon STARTED for event ${eventId}: "${eventTitle}"`);
  
  const payload: NotificationPayload = {
    title: "Evento Começa Amanhã!",
    body: `"${eventTitle}" começa em 24 horas. Prepare-se!`,
    url: `/study/eventos/${eventId}`,
    tag: `event-starting-${eventId}`,
    icon: "/logo.png",
  };

  const pushResult = await sendPushToAllMembers(payload);
  console.log(`[Notifications] Event starting soon push: ${pushResult.sent} sent, ${pushResult.failed} failed`);
}

export async function notifyEventDeadline(
  eventId: number,
  eventTitle: string,
  timeRemaining: string
): Promise<void> {
  console.log(`[Notifications] notifyEventDeadline STARTED for event ${eventId}: "${eventTitle}" - ${timeRemaining}`);
  
  const payload: NotificationPayload = {
    title: "Evento Terminando!",
    body: `"${eventTitle}" termina em ${timeRemaining}. Não perca!`,
    url: `/study/eventos/${eventId}`,
    tag: `event-deadline-${eventId}`,
    icon: "/logo.png",
  };

  const pushResult = await sendPushToAllMembers(payload);
  console.log(`[Notifications] Event deadline push: ${pushResult.sent} sent, ${pushResult.failed} failed`);
}

export async function notifyEventEnded(
  eventId: number,
  eventTitle: string
): Promise<void> {
  console.log(`[Notifications] notifyEventEnded STARTED for event ${eventId}: "${eventTitle}"`);
  
  const payload: NotificationPayload = {
    title: "Evento Encerrado",
    body: `"${eventTitle}" chegou ao fim. Veja suas conquistas!`,
    url: `/study/eventos/${eventId}`,
    tag: `event-ended-${eventId}`,
    icon: "/logo.png",
  };

  const pushResult = await sendPushToAllMembers(payload);
  console.log(`[Notifications] Event ended push: ${pushResult.sent} sent, ${pushResult.failed} failed`);
}

export async function notifyDailyVerse(verse: string, reference: string): Promise<void> {
  const payload: NotificationPayload = {
    title: "Versículo do Dia",
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

export async function notifyMarketingEventReminder(
  eventId: number,
  eventTitle: string,
  eventDate: string,
  eventTime: string | null,
  timeLabel: string
): Promise<void> {
  console.log(`[Notifications] notifyMarketingEventReminder STARTED for event ${eventId}: "${eventTitle}" - ${timeLabel}`);
  
  const timeInfo = eventTime ? ` às ${eventTime}` : '';
  const payload: NotificationPayload = {
    title: `Lembrete: ${eventTitle}`,
    body: `O evento acontece em ${timeLabel}${timeInfo}. Não esqueça!`,
    url: `/agenda/${eventId}`,
    tag: `marketing-event-reminder-${eventId}-${timeLabel}`,
    icon: "/logo.png",
  };

  // Send push notifications to all active members
  const pushResult = await sendPushToAllMembers(payload);
  console.log(`[Notifications] Marketing event reminder push: ${pushResult.sent} sent, ${pushResult.failed} failed`);

  // Create in-app notifications
  const activeMembers = await storage.getActiveMembers();
  for (const member of activeMembers) {
    try {
      await createInAppNotification(
        member.id,
        "new_event",
        payload.title,
        payload.body,
        { eventId, url: payload.url }
      );
    } catch (error) {
      console.error(`[Notifications] Failed to create marketing event reminder in-app for user ${member.id}:`, error);
    }
  }

  // Also notify anonymous visitors
  const anonymousResult = await sendPushToAllAnonymousVisitors(payload);
  console.log(`[Notifications] Marketing event reminder anonymous push: ${anonymousResult.sent} sent`);
}
