import { supabase } from "@/integrations/supabase/client";

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type ConversationListItem = {
  id: string;
  other_user_id: string;
  last_message_at: string;
  other: { username: string; avatar_url: string | null; full_name: string | null; is_verified: boolean } | null;
  preview: string | null;
};

function pair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function getOrCreateConversation(meId: string, otherId: string): Promise<string> {
  if (meId === otherId) throw new Error("Cannot message yourself");
  const [user_a, user_b] = pair(meId, otherId);

  const { data: existing, error: selErr } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_a", user_a)
    .eq("user_b", user_b)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return existing.id;

  const { data: created, error: insErr } = await supabase
    .from("conversations")
    .insert({ user_a, user_b })
    .select("id")
    .single();
  if (insErr) throw insErr;
  return created.id;
}

export async function listConversations(meId: string): Promise<ConversationListItem[]> {
  const { data: convos, error } = await supabase
    .from("conversations")
    .select("id, user_a, user_b, last_message_at")
    .or(`user_a.eq.${meId},user_b.eq.${meId}`)
    .order("last_message_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  if (!convos || convos.length === 0) return [];

  const otherIds = convos.map((c) => (c.user_a === meId ? c.user_b : c.user_a));
  const ids = convos.map((c) => c.id);

  const [{ data: profiles }, { data: lastMsgs }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, avatar_url, full_name, is_verified")
      .in("id", otherIds),
    supabase
      .from("messages")
      .select("conversation_id, body, created_at")
      .in("conversation_id", ids)
      .order("created_at", { ascending: false }),
  ]);

  const profMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const previewMap = new Map<string, string>();
  for (const m of lastMsgs ?? []) {
    if (!previewMap.has(m.conversation_id)) previewMap.set(m.conversation_id, m.body);
  }

  return convos.map((c) => {
    const otherId = c.user_a === meId ? c.user_b : c.user_a;
    return {
      id: c.id,
      other_user_id: otherId,
      last_message_at: c.last_message_at,
      other: profMap.get(otherId) ?? null,
      preview: previewMap.get(c.id) ?? null,
    };
  });
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function sendMessage(conversationId: string, senderId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) return;
  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body: trimmed });
  if (error) throw error;
}
