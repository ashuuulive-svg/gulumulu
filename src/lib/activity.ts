import { supabase } from "@/integrations/supabase/client";

export type ActivityPost = {
  id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
};

async function postsByIds(ids: string[]): Promise<ActivityPost[]> {
  if (!ids.length) return [];
  const { data } = await supabase
    .from("posts")
    .select("id, image_url, caption, created_at")
    .in("id", ids)
    .order("created_at", { ascending: false });
  return (data as ActivityPost[]) ?? [];
}

export async function getLikedPosts(userId: string): Promise<ActivityPost[]> {
  const { data } = await supabase.from("post_likes").select("post_id").eq("user_id", userId).order("created_at", { ascending: false });
  return postsByIds((data ?? []).map((r) => r.post_id));
}

export async function getSavedPosts(userId: string): Promise<ActivityPost[]> {
  const { data } = await supabase.from("post_saves").select("post_id").eq("user_id", userId).order("created_at", { ascending: false });
  return postsByIds((data ?? []).map((r) => r.post_id));
}

export type MyComment = {
  id: string;
  body: string;
  created_at: string;
  post_id: string;
  post_image_url?: string | null;
};

export async function getMyComments(userId: string): Promise<MyComment[]> {
  const { data } = await supabase
    .from("post_comments")
    .select("id, body, created_at, post_id")
    .eq("author_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as MyComment[];
  if (!rows.length) return rows;
  const ids = Array.from(new Set(rows.map((r) => r.post_id)));
  const { data: posts } = await supabase.from("posts").select("id, image_url").in("id", ids);
  const map = new Map((posts ?? []).map((p) => [p.id, p.image_url]));
  return rows.map((r) => ({ ...r, post_image_url: map.get(r.post_id) ?? null }));
}

export async function toggleSave(postId: string, userId: string, currentlySaved: boolean) {
  if (currentlySaved) {
    await supabase.from("post_saves").delete().eq("post_id", postId).eq("user_id", userId);
  } else {
    await supabase.from("post_saves").insert({ post_id: postId, user_id: userId });
  }
}

export async function isSaved(postId: string, userId: string): Promise<boolean> {
  const { data } = await supabase.from("post_saves").select("post_id").eq("post_id", postId).eq("user_id", userId).maybeSingle();
  return !!data;
}

export async function hidePost(postId: string, userId: string) {
  await supabase.from("post_hides").insert({ post_id: postId, user_id: userId });
}

export async function getHiddenPostIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase.from("post_hides").select("post_id").eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.post_id));
}
