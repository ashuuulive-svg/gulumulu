import { supabase } from "@/integrations/supabase/client";
import { uploadPostMedia } from "@/lib/posts";

export type StoryGroup = {
  user_id: string;
  username: string;
  avatar_url: string | null;
  is_verified: boolean;
  stories: StoryItem[];
};

export type StoryItem = {
  id: string;
  user_id: string;
  media_url: string;
  media_type: "image" | "video";
  duration_seconds: number | null;
  created_at: string;
  expires_at: string;
};

export const STORY_VIDEO_MAX_SECONDS = 60;
export const STORY_FILE_MAX_BYTES = 50 * 1024 * 1024;

export async function probeVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(v.duration);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read video"));
    };
    v.src = url;
  });
}

export async function uploadStory(
  file: File,
  userId: string,
  durationSeconds: number | null,
): Promise<void> {
  const isVideo = file.type.startsWith("video");
  const url = await uploadPostMedia(file, userId, "stories");
  const { error } = await supabase.from("stories").insert({
    user_id: userId,
    media_url: url,
    media_type: isVideo ? "video" : "image",
    duration_seconds: durationSeconds,
  });
  if (error) throw error;
}

export async function fetchActiveStories(): Promise<StoryGroup[]> {
  const { data: stories, error } = await supabase
    .from("stories")
    .select("id, user_id, media_url, media_type, duration_seconds, created_at, expires_at")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!stories || stories.length === 0) return [];
  const userIds = Array.from(new Set(stories.map((s) => s.user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, is_verified")
    .in("id", userIds);
  const pmap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const groups = new Map<string, StoryGroup>();
  for (const s of stories) {
    const p = pmap.get(s.user_id);
    if (!p) continue;
    const item: StoryItem = {
      ...s,
      media_type: (s.media_type === "video" ? "video" : "image") as "image" | "video",
    };
    const g = groups.get(s.user_id) ?? {
      user_id: s.user_id,
      username: p.username,
      avatar_url: p.avatar_url,
      is_verified: p.is_verified,
      stories: [],
    };
    g.stories.push(item);
    groups.set(s.user_id, g);
  }
  return Array.from(groups.values());
}
