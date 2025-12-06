import { storage } from "./storage";

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || "";
const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID || "";

interface InstagramMediaItem {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  permalink: string;
  timestamp: string;
  thumbnail_url?: string;
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

export function isInstagramConfigured(): boolean {
  return !!(INSTAGRAM_ACCESS_TOKEN && INSTAGRAM_USER_ID);
}

export async function fetchInstagramPosts(limit: number = 12): Promise<InstagramMediaItem[]> {
  if (!isInstagramConfigured()) {
    console.log("[Instagram] API not configured - missing access token or user ID");
    return [];
  }

  try {
    const fields = "id,caption,media_type,media_url,permalink,timestamp,thumbnail_url";
    const url = `https://graph.instagram.com/${INSTAGRAM_USER_ID}/media?fields=${fields}&limit=${limit}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    
    const response = await fetch(url);
    
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
      caption?: string;
      imageUrl: string;
      permalink: string;
      postedAt: string;
      isActive: boolean;
    }> = [];
    
    for (const post of posts) {
      const imageUrl = post.media_type === "VIDEO" && post.thumbnail_url 
        ? post.thumbnail_url 
        : post.media_url;
        
      newPosts.push({
        caption: post.caption,
        imageUrl: imageUrl,
        permalink: post.permalink,
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

export async function refreshInstagramToken(): Promise<boolean> {
  if (!INSTAGRAM_ACCESS_TOKEN) {
    console.log("[Instagram] Cannot refresh - no access token configured");
    return false;
  }
  
  try {
    const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    
    const response = await fetch(url);
    
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
