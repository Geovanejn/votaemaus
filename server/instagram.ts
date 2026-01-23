import { storage } from "./storage";
import https from "node:https"; // Módulo nativo para o bypass
import dns from "node:dns/promises"; // Módulo nativo para a resolução manual

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || "";
const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID || process.env.INSTAGRAM_ACCOUNT_ID || "";
const INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID || "";
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID || "";
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET || "";

// ==================== HELPER: RETRY & BYPASS LOGIC ====================

/**
 * Função de fetch "blindada" que:
 * 1. Tenta o fetch normal.
 * 2. Se der erro de DNS (ENOTFOUND), resolve o IP manualmente (usando o 8.8.8.8 configurado no index.ts).
 * 3. Conecta diretamente no IP usando https.request para garantir o SNI correto.
 */
async function fetchWithRetry(url: string, options: RequestInit = {}, retries: number = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      // Tenta o método padrão primeiro
      return await fetch(url, options);
    } catch (error: any) {
      const errorCode = error.cause?.code;
      const isNetworkError = errorCode === 'ENOTFOUND' || errorCode === 'EAI_AGAIN' || errorCode === 'ECONNRESET' || error.message?.includes('fetch failed');

      // Se não for erro de rede, ou for a última tentativa, desiste
      if (!isNetworkError || i === retries - 1) {
        console.error(`❌ [Instagram API] Falha definitiva:`, error.message);
        throw error;
      }

      console.log(`⚠️ [Instagram API] Falha de conexão (${errorCode}). Tentando Bypass Manual (Tentativa ${i + 1}/${retries})...`);

      // === TENTATIVA DE BYPASS MANUAL ===
      // Aqui usamos o DNS do Node (que configuramos para 8.8.8.8) para achar o IP
      // e usamos https.request para conectar direto no IP, ignorando o OS quebrado.
      try {
        const urlObj = new URL(url);
        
        // 1. Resolve o IP manualmente (respeita o dns.setServers do index.ts)
        const addresses = await dns.resolve4(urlObj.hostname);
        const ip = addresses[0]; // Pega o primeiro IP (ex: 157.240.x.x)
        
        console.log(`🔧 [Bypass] IP resolvido manualmente para ${urlObj.hostname}: ${ip}`);

        // 2. Faz a requisição manual via HTTPS nativo
        return await new Promise<Response>((resolve, reject) => {
          const req = https.request(url, {
            ...options,
            method: options.method || 'GET',
            host: ip, // Conecta direto no IP
            servername: urlObj.hostname, // Garante que o SSL/SNI funcione
            headers: {
              ...(options.headers as any),
              'Host': urlObj.hostname // Garante que o Host header esteja certo
            }
          }, (res) => {
            // Reconstrói a resposta para parecer um objeto 'Response' do fetch
            const chunks: any[] = [];
            res.on('data', d => chunks.push(d));
            res.on('end', () => {
              const body = Buffer.concat(chunks).toString();
              resolve({
                ok: (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 300,
                status: res.statusCode || 500,
                statusText: res.statusMessage || "",
                json: async () => JSON.parse(body),
                text: async () => body,
                headers: new Headers(res.headers as any)
              } as unknown as Response);
            });
          });

          req.on('error', (e) => {
            console.error("❌ [Bypass] Erro na conexão manual:", e.message);
            // Se falhar o bypass, espera e deixa o loop tentar de novo
            reject(e);
          });
          
          if (options.body) {
            req.write(options.body);
          }
          req.end();
        });
      } catch (bypassError: any) {
        console.error(`⚠️ [Bypass] Falha no bypass manual: ${bypassError.message}. Aguardando 5s...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
  throw new Error('Unreachable');
}

// ==================== INTERFACES ====================

interface InstagramMediaItem {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  permalink: string;
  timestamp: string;
  thumbnail_url?: string;
  like_count?: number;
  comments_count?: number;
}

interface InstagramMediaResponse {
  data: InstagramMediaItem[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

interface InstagramChildrenResponse {
  data: Array<{
    id: string;
    media_type: "IMAGE" | "VIDEO";
    media_url: string;
    thumbnail_url?: string;
  }>;
}

export interface InstagramComment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
}

interface InstagramCommentsResponse {
  data: Array<{
    id: string;
    text: string;
    username: string;
    timestamp: string;
  }>;
  paging?: {
    cursors: { before: string; after: string };
    next?: string;
  };
}

export function isInstagramConfigured(): boolean {
  return !!(INSTAGRAM_ACCESS_TOKEN && INSTAGRAM_USER_ID);
}

async function fetchCarouselChildren(mediaId: string): Promise<InstagramChildrenResponse["data"]> {
  try {
    const fields = "id,media_type,media_url,thumbnail_url";
    const url = `https://graph.facebook.com/v18.0/${mediaId}/children?fields=${fields}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      console.error(`[Instagram] Failed to fetch carousel children for ${mediaId}`);
      return [];
    }
    
    const data: InstagramChildrenResponse = await response.json();
    return data.data || [];
  } catch (error) {
    console.error(`[Instagram] Error fetching carousel children:`, error);
    return [];
  }
}

export async function fetchInstagramPosts(limit: number = 12): Promise<InstagramMediaItem[]> {
  if (!isInstagramConfigured()) {
    console.log("[Instagram] API not configured - missing access token or user ID");
    return [];
  }

  try {
    const fields = "id,caption,media_type,media_url,permalink,timestamp,thumbnail_url,like_count,comments_count";
    const url = `https://graph.facebook.com/v18.0/${INSTAGRAM_USER_ID}/media?fields=${fields}&limit=${limit}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Instagram] API error:", response.status, errorData);
      return [];
    }
    
    const data: InstagramMediaResponse = await response.json();
    console.log(`[Instagram] Fetched ${data.data?.length || 0} posts from API`);
    
    return data.data || [];
  } catch (error) {
    console.error("[Instagram] Error fetching posts:", error);
    return [];
  }
}

export async function syncInstagramPosts(): Promise<{ synced: number; errors: number }> {
  console.log("[Instagram] Starting sync...");
  
  if (!isInstagramConfigured()) {
    console.log("[Instagram] Sync skipped - API not configured");
    return { synced: 0, errors: 0 };
  }
  
  try {
    const posts = await fetchInstagramPosts(12);
    
    if (posts.length === 0) {
      console.log("[Instagram] No new posts fetched - keeping existing data");
      return { synced: 0, errors: 0 };
    }
    
    const newPosts: Array<{
      instagramId: string;
      caption?: string;
      imageUrl: string;
      videoUrl?: string;
      mediaType: string;
      permalink: string;
      likesCount: number;
      commentsCount: number;
      postedAt: string;
      isActive: boolean;
    }> = [];
    
    for (const post of posts) {
      let imageUrl = post.media_url;
      let videoUrl: string | undefined = undefined;
      let mediaType = post.media_type;
      
      if (post.media_type === "VIDEO") {
        imageUrl = post.thumbnail_url || post.media_url;
        videoUrl = post.media_url;
      } else if (post.media_type === "CAROUSEL_ALBUM") {
        const children = await fetchCarouselChildren(post.id);
        const videoChild = children.find(child => child.media_type === "VIDEO");
        const firstImageChild = children.find(child => child.media_type === "IMAGE");
        
        if (videoChild) {
          mediaType = "VIDEO";
          imageUrl = videoChild.thumbnail_url || firstImageChild?.media_url || children[0]?.media_url || post.media_url;
          videoUrl = videoChild.media_url;
        } else if (children.length > 0 && children[0].media_url) {
          imageUrl = children[0].media_url;
        }
      }
        
      newPosts.push({
        instagramId: post.id,
        caption: post.caption,
        imageUrl: imageUrl,
        videoUrl: videoUrl,
        mediaType: mediaType,
        permalink: post.permalink,
        likesCount: post.like_count || 0,
        commentsCount: post.comments_count || 0,
        postedAt: post.timestamp,
        isActive: true,
      });
    }
    
    await storage.clearAllInstagramPosts();
    
    let synced = 0;
    let errors = 0;
    
    for (const postData of newPosts) {
      try {
        await storage.createInstagramPost(postData);
        synced++;
      } catch (error) {
        console.error(`[Instagram] Error saving post:`, error);
        errors++;
      }
    }
    
    console.log(`[Instagram] Sync completed: ${synced} saved, ${errors} errors`);
    return { synced, errors };
  } catch (error) {
    console.error("[Instagram] Sync error:", error);
    return { synced: 0, errors: 1 };
  }
}

export async function fetchInstagramComments(instagramId: string, limit: number = 50): Promise<InstagramComment[]> {
  if (!isInstagramConfigured()) {
    console.log("[Instagram] API not configured - cannot fetch comments");
    return [];
  }

  try {
    const fields = "id,text,username,timestamp";
    const url = `https://graph.facebook.com/v18.0/${instagramId}/comments?fields=${fields}&limit=${limit}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Instagram] Comments API error:", response.status, errorData);
      return [];
    }
    
    const data: InstagramCommentsResponse = await response.json();
    console.log(`[Instagram] Fetched ${data.data?.length || 0} comments for post ${instagramId}`);
    
    return data.data || [];
  } catch (error) {
    console.error("[Instagram] Error fetching comments:", error);
    return [];
  }
}

export async function refreshInstagramToken(): Promise<boolean> {
  if (!INSTAGRAM_ACCESS_TOKEN) {
    console.log("[Instagram] Cannot refresh - no access token configured");
    return false;
  }
  
  try {
    const url = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${INSTAGRAM_APP_ID}&client_secret=${INSTAGRAM_APP_SECRET}&fb_exchange_token=${INSTAGRAM_ACCESS_TOKEN}`;
    
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Instagram] Token refresh failed:", response.status, errorData);
      return false;
    }
    
    const data = await response.json();
    console.log(`[Instagram] Token refreshed, expires in ${data.expires_in} seconds`);
    
    return true;
  } catch (error) {
    console.error("[Instagram] Token refresh error:", error);
    return false;
  }
}

// ==================== INSTAGRAM STORIES PUBLISHING ====================

export function isInstagramPublishingConfigured(): boolean {
  return !!(INSTAGRAM_ACCESS_TOKEN && INSTAGRAM_ACCOUNT_ID);
}

interface StoryPublishResult {
  success: boolean;
  mediaId?: string;
  error?: string;
}

/**
 * Create a story container for an image
 */
async function createStoryContainer(imageUrl: string): Promise<{ containerId?: string; error?: string }> {
  try {
    const url = `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}/media`;
    
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        image_url: imageUrl,
        media_type: 'STORIES',
        access_token: INSTAGRAM_ACCESS_TOKEN,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("[Instagram Stories] Container creation failed:", data);
      return { error: data.error?.message || 'Failed to create story container' };
    }
    
    if (data.id) {
      console.log(`[Instagram Stories] Container created: ${data.id}`);
      return { containerId: data.id };
    }
    
    return { error: 'No container ID returned' };
  } catch (error) {
    console.error("[Instagram Stories] Container creation error:", error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Check the status of a media container
 */
async function checkContainerStatus(containerId: string): Promise<'FINISHED' | 'IN_PROGRESS' | 'ERROR'> {
  try {
    const url = `https://graph.facebook.com/v18.0/${containerId}?fields=status_code&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    
    const response = await fetchWithRetry(url);
    const data = await response.json();
    
    if (data.status_code === 'FINISHED') {
      return 'FINISHED';
    } else if (data.status_code === 'ERROR') {
      console.error("[Instagram Stories] Container processing error:", data);
      return 'ERROR';
    }
    
    return 'IN_PROGRESS';
  } catch (error) {
    console.error("[Instagram Stories] Status check error:", error);
    return 'ERROR';
  }
}

/**
 * Publish a story from a container
 */
async function publishStoryFromContainer(containerId: string): Promise<StoryPublishResult> {
  try {
    const url = `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}/media_publish`;
    
    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        creation_id: containerId,
        access_token: INSTAGRAM_ACCESS_TOKEN,
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("[Instagram Stories] Publish failed:", data);
      return { success: false, error: data.error?.message || 'Failed to publish story' };
    }
    
    if (data.id) {
      console.log(`[Instagram Stories] Story published! Media ID: ${data.id}`);
      return { success: true, mediaId: data.id };
    }
    
    return { success: false, error: 'No media ID returned' };
  } catch (error) {
    console.error("[Instagram Stories] Publish error:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Publish an image as Instagram Story
 */
export async function publishInstagramStory(imageUrl: string, maxWaitTime: number = 30000): Promise<StoryPublishResult> {
  if (!isInstagramPublishingConfigured()) {
    console.log("[Instagram Stories] Not configured - missing access token or account ID");
    return { success: false, error: 'Instagram publishing not configured' };
  }
  
  console.log(`[Instagram Stories] Starting story publish for image: ${imageUrl.substring(0, 50)}...`);
  
  const containerResult = await createStoryContainer(imageUrl);
  if (!containerResult.containerId) {
    return { success: false, error: containerResult.error };
  }
  
  const startTime = Date.now();
  let status: 'FINISHED' | 'IN_PROGRESS' | 'ERROR' = 'IN_PROGRESS';
  
  while (status === 'IN_PROGRESS' && (Date.now() - startTime) < maxWaitTime) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    status = await checkContainerStatus(containerResult.containerId);
  }
  
  if (status === 'ERROR') {
    return { success: false, error: 'Container processing failed' };
  }
  
  if (status === 'IN_PROGRESS') {
    return { success: false, error: 'Container processing timeout' };
  }
  
  return await publishStoryFromContainer(containerResult.containerId);
}

/**
 * Test Instagram Story configuration
 */
export async function testInstagramStoryConfig(): Promise<{ configured: boolean; accountId?: string; error?: string }> {
  if (!isInstagramPublishingConfigured()) {
    return { configured: false, error: 'Missing INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_ACCOUNT_ID' };
  }
  
  try {
    const url = `https://graph.facebook.com/v18.0/${INSTAGRAM_ACCOUNT_ID}?fields=id,username&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    
    const response = await fetchWithRetry(url);
    const data = await response.json();
    
    if (!response.ok) {
      return { configured: false, error: data.error?.message || 'Failed to verify account' };
    }
    
    console.log(`[Instagram Stories] Verified account: @${data.username} (ID: ${data.id})`);
    return { configured: true, accountId: data.id };
  } catch (error) {
    return { configured: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
