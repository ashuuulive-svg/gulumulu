import { supabase } from "@/integrations/supabase/client";

export type SuggestedUser = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
};

export async function getFollowStats(userId: string, viewerId?: string) {
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
  ]);
  let isFollowing = false;
  if (viewerId && viewerId !== userId) {
    const { data } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", viewerId)
      .eq("following_id", userId)
      .maybeSingle();
    isFollowing = !!data;
  }
  return { followers: followers ?? 0, following: following ?? 0, isFollowing };
}

export async function followUser(followerId: string, followingId: string) {
  const { error } = await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId });
  if (error) throw error;
}

export async function unfollowUser(followerId: string, followingId: string) {
  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);
  if (error) throw error;
}

export async function getSuggestedUsers(currentUserId: string, limit = 10): Promise<SuggestedUser[]> {
  // Users I am NOT already following, excluding self & banned
  const { data: myFollows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", currentUserId);
  const exclude = [currentUserId, ...(myFollows ?? []).map((r) => r.following_id)];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, is_verified")
    .eq("is_banned", false)
    .not("id", "in", `(${exclude.map((id) => `"${id}"`).join(",")})`)
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as SuggestedUser[];
}
