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
    const url = `https://graph.instagram.com/${mediaId}/children?fields=${fields}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    
    const response = await fetch(url);
    
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
    const url = `https://graph.instagram.com/${instagramId}/comments?fields=${fields}&limit=${limit}&access_token=${INSTAGRAM_ACCESS_TOKEN}`;
    
    const response = await fetch(url);
    
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
