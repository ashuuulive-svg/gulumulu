import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Phone, Video, Send, Smile, BadgeCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchMessages, sendMessage, type Message } from "@/lib/chat";
import { ZegoCall } from "./ZegoCall";
import { toast } from "sonner";

export type ChatPeer = {
  id: string;
  username: string;
  avatar_url: string | null;
  is_verified?: boolean;
};

export function ChatRoom({
  conversationId,
  peer,
  onBack,
}: {
  conversationId: string;
  peer: ChatPeer;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMessages(conversationId);
        if (!cancelled) setMessages(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!user || !text.trim() || sending) return;
    const body = text.trim();
    setText("");
    setSending(true);
    try {
      await sendMessage(conversationId, user.id, body);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to send");
      setText(body);
    } finally {
      setSending(false);
    }
  };

  const avatar =
    peer.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${peer.username}`;

  return (
    <div className="flex h-screen flex-col bg-pink-soft">
      <header className="flex items-center justify-between border-b border-border bg-card/95 px-3 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button onClick={onBack} aria-label="Back" className="rounded-full p-1.5 hover:bg-pink-soft">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <img src={avatar} alt="" className="h-9 w-9 rounded-full bg-pink-soft object-cover" />
          <div className="leading-tight">
            <p className="flex items-center gap-1 text-sm font-semibold text-foreground">
              {peer.username}
              {peer.is_verified && <BadgeCheck className="h-3.5 w-3.5 fill-sky-500 text-white" />}
            </p>
            <p className="text-[11px] text-muted-foreground">Direct message</p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-40">
          <button aria-label="Voice call (coming soon)" disabled className="rounded-full p-2">
            <Phone className="h-5 w-5 text-foreground" />
          </button>
          <button aria-label="Video call (coming soon)" disabled className="rounded-full p-2">
            <Video className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <p className="py-12 text-center text-xs text-muted-foreground">
            No messages yet. Say hi 👋
          </p>
        ) : (
          messages.map((m) => (
            <Bubble key={m.id} text={m.body} fromMe={m.sender_id === user?.id} time={m.created_at} />
          ))
        )}
      </div>

      <div className="border-t border-border bg-card/95 px-3 py-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-full bg-pink-soft px-4 py-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Message…"
              maxLength={2000}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button aria-label="Emoji" type="button">
              <Smile className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <button
            onClick={send}
            disabled={!text.trim() || sending}
            aria-label="Send"
            className="rounded-full bg-foreground p-2.5 text-background disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function Bubble({ text, fromMe, time }: { text: string; fromMe: boolean; time: string }) {
  const t = new Date(time);
  const hh = String(t.getHours()).padStart(2, "0");
  const mm = String(t.getMinutes()).padStart(2, "0");
  return (
    <div className={cn("flex", fromMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3.5 py-2 shadow-card",
          fromMe ? "rounded-br-sm bg-foreground text-background" : "rounded-bl-sm bg-card text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap text-sm leading-snug">{text}</p>
        <div className="mt-0.5 text-right text-[10px] opacity-70">
          {hh}:{mm}
        </div>
      </div>
    </div>
  );
}
