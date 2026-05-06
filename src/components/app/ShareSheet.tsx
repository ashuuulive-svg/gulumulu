import { useEffect, useMemo, useState } from "react";
import { X, Send, Loader2, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateConversation, sendMessage } from "@/lib/chat";
import { toast } from "sonner";

type Candidate = {
  id: string;
  username: string;
  avatar_url: string | null;
  msg_count: number;
};

export function ShareSheet({
  postId,
  authorUsername,
  onClose,
}: {
  postId: string;
  authorUsername: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState<string | null>(null);

  const shareUrl = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/?post=${postId}`;
  }, [postId]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // 1) my conversations + message counts to rank "frequent chats"
      const { data: convos } = await supabase
        .from("conversations")
        .select("id, user_a, user_b")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);
      const convoIds = (convos ?? []).map((c) => c.id);
      const otherByConvo = new Map<string, string>();
      for (const c of convos ?? []) otherByConvo.set(c.id, c.user_a === user.id ? c.user_b : c.user_a);

      const counts = new Map<string, number>();
      if (convoIds.length) {
        const { data: msgs } = await supabase
          .from("messages")
          .select("conversation_id")
          .in("conversation_id", convoIds);
        for (const m of msgs ?? []) {
          const other = otherByConvo.get(m.conversation_id);
          if (other) counts.set(other, (counts.get(other) ?? 0) + 1);
        }
      }

      // 2) also include followed users with 0 count
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      const allIds = new Set<string>([...counts.keys(), ...(follows ?? []).map((f) => f.following_id)]);
      allIds.delete(user.id);

      if (allIds.size === 0) { setCandidates([]); setLoading(false); return; }

      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", Array.from(allIds));

      const list: Candidate[] = (profs ?? []).map((p) => ({
        id: p.id,
        username: p.username,
        avatar_url: p.avatar_url,
        msg_count: counts.get(p.id) ?? 0,
      }));
      list.sort((a, b) => b.msg_count - a.msg_count || a.username.localeCompare(b.username));
      setCandidates(list);
      setLoading(false);
    })();
  }, [user?.id]);

  const sendTo = async (uid: string) => {
    if (!user || sent.has(uid)) return;
    setSending(uid);
    try {
      const convId = await getOrCreateConversation(user.id, uid);
      await sendMessage(convId, user.id, `Check out @${authorUsername}'s post: ${shareUrl}`);
      setSent((s) => new Set(s).add(uid));
      toast.success("Sent");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(null);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div
        className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-card pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 mb-1 h-1 w-10 rounded-full bg-muted" />
        <header className="flex items-center justify-between px-4 py-2">
          <h2 className="text-base font-semibold text-foreground">Share</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-pink-soft">
            <X className="h-5 w-5 text-foreground" />
          </button>
        </header>

        <button
          onClick={copyLink}
          className="mx-4 mb-2 w-[calc(100%-2rem)] rounded-2xl bg-pink-soft py-2.5 text-sm font-semibold text-foreground"
        >
          Copy link
        </button>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : candidates.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Follow or chat with people to share posts.</p>
        ) : (
          <ul className="divide-y divide-border">
            {candidates.map((c) => {
              const isSent = sent.has(c.id);
              const avatar = c.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${c.username}`;
              return (
                <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                  <img src={avatar} alt="" className="h-10 w-10 rounded-full bg-pink-soft object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{c.username}</p>
                    {c.msg_count > 0 && (
                      <p className="text-[11px] text-muted-foreground">{c.msg_count} messages</p>
                    )}
                  </div>
                  <button
                    disabled={isSent || sending === c.id}
                    onClick={() => sendTo(c.id)}
                    className="flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-50"
                  >
                    {sending === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : isSent ? <Check className="h-3 w-3" /> : <Send className="h-3 w-3" />}
                    {isSent ? "Sent" : "Send"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
