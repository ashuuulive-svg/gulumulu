import { supabase } from "@/integrations/supabase/client";

export type FeedPost = {
  id: string;
  author_id: string;
  image_url: string;
  media_type: "image" | "video";
  caption: string | null;
  location: string | null;
  created_at: string;
  author: { username: string; avatar_url: string | null; full_name: string | null; is_verified?: boolean } | null;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
};

export type FeedComment = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author: { username: string; avatar_url: string | null } | null;
};

export async function uploadPostMedia(
  file: File,
  userId: string,
  bucket: "post-images" | "stories" = "post-images",
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || (file.type.startsWith("video") ? "mp4" : "jpg");
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type || (ext === "mp4" ? "video/mp4" : "image/jpeg"),
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// Backward-compat alias
export const uploadPostImage = uploadPostMedia;

export async function createPost(input: {
  authorId: string;
  imageUrl: string;
  mediaType?: "image" | "video";
  caption: string;
  location: string | null;
}) {
  const { error } = await supabase.from("posts").insert({
    author_id: input.authorId,
    image_url: input.imageUrl,
    media_type: input.mediaType ?? "image",
    caption: input.caption,
    location: input.location,
  });
  if (error) throw error;
}

export async function fetchFeed(currentUserId: string): Promise<FeedPost[]> {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, author_id, image_url, media_type, caption, location, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  if (!posts || posts.length === 0) return [];

  const ids = posts.map((p) => p.id);
  const authorIds = Array.from(new Set(posts.map((p) => p.author_id)));

  const [{ data: profiles }, { data: likes }, { data: myLikes }, { data: comments }] = await Promise.all([
    supabase.from("profiles").select("id, username, avatar_url, full_name, is_verified").in("id", authorIds),
    supabase.from("post_likes").select("post_id").in("post_id", ids),
    supabase.from("post_likes").select("post_id").in("post_id", ids).eq("user_id", currentUserId),
    supabase.from("post_comments").select("post_id").in("post_id", ids),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const likeCount = new Map<string, number>();
  (likes ?? []).forEach((l) => likeCount.set(l.post_id, (likeCount.get(l.post_id) ?? 0) + 1));
  const commentCount = new Map<string, number>();
  (comments ?? []).forEach((c) => commentCount.set(c.post_id, (commentCount.get(c.post_id) ?? 0) + 1));
  const mineSet = new Set((myLikes ?? []).map((l) => l.post_id));

  return posts.map((p) => ({
    ...p,
    author: profileMap.get(p.author_id) ?? null,
    like_count: likeCount.get(p.id) ?? 0,
    comment_count: commentCount.get(p.id) ?? 0,
    liked_by_me: mineSet.has(p.id),
  }));
}

export async function toggleLike(postId: string, userId: string, currentlyLiked: boolean) {
  if (currentlyLiked) {
    const { error } = await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
    if (error && error.code !== "23505") throw error;
  }
}

export async function fetchComments(postId: string): Promise<FeedComment[]> {
  const { data, error } = await supabase
    .from("post_comments")
    .select("id, post_id, author_id, body, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!data || data.length === 0) return [];
  const authorIds = Array.from(new Set(data.map((c) => c.author_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", authorIds);
  const map = new Map((profiles ?? []).map((p) => [p.id, p]));
  return data.map((c) => ({ ...c, author: map.get(c.author_id) ?? null }));
}

export async function addComment(postId: string, userId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) return;
  const { error } = await supabase
    .from("post_comments")
    .insert({ post_id: postId, author_id: userId, body: trimmed });
  if (error) throw error;
}

export function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const dd = Math.floor(h / 24);
  if (dd < 7) return `${dd}d`;
  return new Date(iso).toLocaleDateString();
}
