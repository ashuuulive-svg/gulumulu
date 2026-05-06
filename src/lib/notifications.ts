import { supabase } from "@/integrations/supabase/client";

export type NotificationRow = {
  id: string;
  recipient_id: string;
  actor_id: string;
  type: "like" | "follow" | "comment";
  post_id: string | null;
  read: boolean;
  created_at: string;
  actor?: { username: string; avatar_url: string | null } | null;
};

export async function fetchNotifications(userId: string): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, recipient_id, actor_id, type, post_id, read, created_at")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  const rows = (data ?? []) as NotificationRow[];
  if (rows.length === 0) return rows;
  const actorIds = Array.from(new Set(rows.map((r) => r.actor_id)));
  const { data: profs } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", actorIds);
  const map = new Map((profs ?? []).map((p) => [p.id, p]));
  return rows.map((r) => ({ ...r, actor: map.get(r.actor_id) ?? null }));
}

export async function markAllRead(userId: string) {
  await supabase.from("notifications").update({ read: true }).eq("recipient_id", userId).eq("read", false);
}

export async function unreadCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .eq("read", false);
  return count ?? 0;
}
