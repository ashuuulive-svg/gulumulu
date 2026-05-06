import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Phone, Video, Send, Smile, BadgeCheck, Loader2, Paperclip, Sticker } from "lucide-react";
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";
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

const STICKERS = [
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=hi",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=love",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=cool",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=lol",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=cry",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=wink",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=shocked",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=party",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=heart",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=star",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=fire",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=sleepy",
];

export function ChatRoom({
  conversationId,
  peer,
  onBack,
  onOpenPeer,
}: {
  conversationId: string;
  peer: ChatPeer;
  onBack: () => void;
  onOpenPeer?: (userId: string) => void;
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [tray, setTray] = useState<"emoji" | "sticker" | null>(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [callMode, setCallMode] = useState<"voice" | "video" | null>(null);
  const roomId = useMemo(() => `conv_${conversationId.replace(/-/g, "").slice(0, 24)}`, [conversationId]);

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

  const send = async (overrideText?: string, media?: { url: string; type: string }) => {
    if (!user) return;
    const body = overrideText ?? text;
    if (!body.trim() && !media) return;
    if (sending) return;
    setSending(true);
    if (overrideText === undefined) setText("");
    try {
      await sendMessage(conversationId, user.id, body, media ?? null);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to send");
      if (overrideText === undefined) setText(body);
    } finally {
      setSending(false);
    }
  };

  const onPickFile = async (f?: File) => {
    if (!f || !user) return;
    if (!/^(image\/(png|jpe?g|gif|webp)|video\/mp4)$/.test(f.type)) {
      toast.error("Only images or MP4 video supported");
      return;
    }
    if (f.size > 25 * 1024 * 1024) {
      toast.error("File too large (max 25 MB)");
      return;
    }
    setUploading(true);
    try {
      const ext = f.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("chat-media").upload(path, f, { contentType: f.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("chat-media").getPublicUrl(path);
      const type = f.type.startsWith("video/") ? "video" : "image";
      await send("", { url: pub.publicUrl, type });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const sendSticker = async (url: string) => {
    setTray(null);
    await send("", { url, type: "sticker" });
  };

  const avatar = peer.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${peer.username}`;

  return (
    <div className="flex h-screen flex-col bg-pink-soft">
      <header className="flex items-center justify-between border-b border-border bg-card/95 px-3 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button onClick={onBack} aria-label="Back" className="rounded-full p-1.5 hover:bg-pink-soft">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <button
            onClick={() => onOpenPeer?.(peer.id)}
            className="flex items-center gap-2 rounded-full px-1 py-0.5 text-left hover:bg-pink-soft"
          >
            <img src={avatar} alt="" className="h-9 w-9 rounded-full bg-pink-soft object-cover" />
            <div className="leading-tight">
              <p className="flex items-center gap-1 text-sm font-semibold text-foreground">
                {peer.username}
                {peer.is_verified && <BadgeCheck className="h-3.5 w-3.5 fill-sky-500 text-white" />}
              </p>
              <p className="text-[11px] text-muted-foreground">View profile</p>
            </div>
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setCallMode("voice")} aria-label="Voice call" className="rounded-full p-2 hover:bg-pink-soft">
            <Phone className="h-5 w-5 text-foreground" />
          </button>
          <button onClick={() => setCallMode("video")} aria-label="Video call" className="rounded-full p-2 hover:bg-pink-soft">
            <Video className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </header>

      {callMode && user && (
        <ZegoCall
          roomId={roomId}
          userId={user.id}
          userName={user.email ?? user.id.slice(0, 6)}
          mode={callMode}
          onLeave={() => setCallMode(null)}
        />
      )}

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
            <Bubble key={m.id} message={m} fromMe={m.sender_id === user?.id} />
          ))
        )}
      </div>

      {tray === "emoji" && (
        <div className="border-t border-border bg-card">
          <EmojiPicker
            theme={Theme.LIGHT}
            emojiStyle={EmojiStyle.NATIVE}
            width="100%"
            height={320}
            onEmojiClick={(e) => setText((t) => t + e.emoji)}
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}

      {tray === "sticker" && (
        <div className="grid grid-cols-4 gap-2 border-t border-border bg-card p-3 sm:grid-cols-6">
          {STICKERS.map((s) => (
            <button key={s} onClick={() => sendSticker(s)} className="aspect-square rounded-xl bg-pink-soft p-1 hover:scale-95 transition-transform">
              <img src={s} alt="sticker" className="h-full w-full" />
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-border bg-card/95 px-3 py-2 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Attach"
            className="rounded-full p-2 hover:bg-pink-soft disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5 text-foreground" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp,video/mp4"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0])}
          />
          <div className="flex flex-1 items-center gap-2 rounded-full bg-pink-soft px-4 py-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Message…"
              maxLength={2000}
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              type="button"
              aria-label="Sticker"
              onClick={() => setTray((t) => (t === "sticker" ? null : "sticker"))}
            >
              <Sticker className={cn("h-5 w-5", tray === "sticker" ? "text-foreground" : "text-muted-foreground")} />
            </button>
            <button
              type="button"
              aria-label="Emoji"
              onClick={() => setTray((t) => (t === "emoji" ? null : "emoji"))}
            >
              <Smile className={cn("h-5 w-5", tray === "emoji" ? "text-foreground" : "text-muted-foreground")} />
            </button>
          </div>
          <button
            onClick={() => send()}
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

function Bubble({ message, fromMe }: { message: Message; fromMe: boolean }) {
  const t = new Date(message.created_at);
  const hh = String(t.getHours()).padStart(2, "0");
  const mm = String(t.getMinutes()).padStart(2, "0");
  const isSticker = message.media_type === "sticker";

  if (isSticker && message.media_url) {
    return (
      <div className={cn("flex", fromMe ? "justify-end" : "justify-start")}>
        <div className="max-w-[40%]">
          <img src={message.media_url} alt="sticker" className="h-32 w-32" />
          <div className={cn("mt-0.5 text-[10px] opacity-70", fromMe ? "text-right" : "text-left")}>{hh}:{mm}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex", fromMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] overflow-hidden rounded-2xl shadow-card",
          fromMe ? "rounded-br-sm bg-foreground text-background" : "rounded-bl-sm bg-card text-foreground",
        )}
      >
        {message.media_url && message.media_type === "image" && (
          <img src={message.media_url} alt="" className="block max-h-72 w-full object-cover" />
        )}
        {message.media_url && message.media_type === "video" && (
          <video src={message.media_url} controls playsInline className="block max-h-72 w-full" />
        )}
        {message.body && (
          <p className="whitespace-pre-wrap px-3.5 py-2 text-sm leading-snug">{message.body}</p>
        )}
        <div className="px-3.5 pb-1 text-right text-[10px] opacity-70">
          {hh}:{mm}
        </div>
      </div>
    </div>
  );
}
