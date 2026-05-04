import { supabase } from "@/integrations/supabase/client";

export type UserSearchResult = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
};

export async function searchUsers(query: string, currentUserId?: string): Promise<UserSearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  const like = `%${q.replace(/[%_]/g, (c) => "\\" + c)}%`;
  let req = supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, is_verified")
    .or(`username.ilike.${like},full_name.ilike.${like}`)
    .eq("is_banned", false)
    .limit(25);
  if (currentUserId) req = req.neq("id", currentUserId);
  const { data, error } = await req;
  if (error) throw error;
  return (data ?? []) as UserSearchResult[];
}

export async function getProfileById(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, bio, avatar_url, is_private, is_verified, is_banned")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProfileByUsername(username: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, bio, avatar_url, is_private, is_verified, is_banned")
    .ilike("username", username)
    .maybeSingle();
  if (error) throw error;
  return data;
}
