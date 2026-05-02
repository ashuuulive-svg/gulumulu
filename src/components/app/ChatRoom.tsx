import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Phone, Video, Mic, Send, Smile, Plus, Check, CheckCheck } from "lucide-react";
import type { ChatItem } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type Msg = {
  id: string;
  text?: string;
  voice?: { duration: number };
  fromMe: boolean;
  status: "sent" | "delivered" | "read";
  time: string;
};

const seed: Msg[] = [
  { id: "m1", text: "hey! you up?", fromMe: false, status: "read", time: "10:02" },
  { id: "m2", text: "yes! just made tea 🍵", fromMe: true, status: "read", time: "10:03" },
  { id: "m3", voice: { duration: 7 }, fromMe: false, status: "read", time: "10:04" },
  { id: "m4", text: "omg yes let's go this weekend!", fromMe: false, status: "delivered", time: "10:05" },
];

export function ChatRoom({ chat, onBack }: { chat: ChatItem; onBack: () => void }) {
  const [messages, setMessages] = useState<Msg[]>(seed);
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [recStart, setRecStart] = useState(0);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  // Simulate the other person typing occasionally
  useEffect(() => {
    const t = setTimeout(() => setTyping(true), 1500);
    const t2 = setTimeout(() => {
      setTyping(false);
      setMessages((m) => [
        ...m,
        { id: `m${Date.now()}`, text: "can't wait 💗", fromMe: false, status: "delivered", time: "now" },
      ]);
    }, 4500);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, []);

  const send = () => {
    if (!text.trim()) return;
    setMessages((m) => [
      ...m,
      { id: `m${Date.now()}`, text: text.trim(), fromMe: true, status: "sent", time: "now" },
    ]);
    setText("");
  };

  const startRec = () => {
    setRecording(true);
    setRecStart(Date.now());
  };
  const stopRec = () => {
    if (!recording) return;
    const dur = Math.max(1, Math.round((Date.now() - recStart) / 1000));
    setRecording(false);
    setMessages((m) => [
      ...m,
      { id: `v${Date.now()}`, voice: { duration: dur }, fromMe: true, status: "sent", time: "now" },
    ]);
  };

  return (
    <div className="flex h-screen flex-col bg-pink-soft">
      <header className="flex items-center justify-between border-b border-border bg-card/95 px-3 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button onClick={onBack} aria-label="Back" className="rounded-full p-1.5 hover:bg-pink-soft">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <img src={chat.avatar} alt="" className="h-9 w-9 rounded-full bg-pink-soft object-cover" />
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">{chat.username}</p>
            <p className="text-[11px] text-muted-foreground">
              {typing ? "typing…" : chat.online ? "Active now" : "Offline"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button aria-label="Voice call" className="rounded-full p-2 hover:bg-pink-soft">
            <Phone className="h-5 w-5 text-foreground" />
          </button>
          <button aria-label="Video call" className="rounded-full p-2 hover:bg-pink-soft">
            <Video className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {messages.map((m) => (
          <Bubble key={m.id} m={m} />
        ))}
        {typing && (
          <div className="flex">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-card px-3 py-2 shadow-card">
              <Dot /> <Dot delay={0.15} /> <Dot delay={0.3} />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border bg-card/95 px-3 py-2 backdrop-blur-md">
        {recording ? (
          <div className="flex items-center justify-between rounded-full bg-pink-soft px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-destructive" />
              <span className="text-sm font-medium text-foreground">Recording…</span>
            </div>
            <button
              onMouseUp={stopRec}
              onTouchEnd={stopRec}
              onClick={stopRec}
              className="rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background"
            >
              Release to send
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button aria-label="Add" className="rounded-full p-2 hover:bg-pink-soft">
              <Plus className="h-5 w-5 text-foreground" />
            </button>
            <div className="flex flex-1 items-center gap-2 rounded-full bg-pink-soft px-4 py-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Message…"
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button aria-label="Emoji">
                <Smile className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            {text.trim() ? (
              <button
                onClick={send}
                aria-label="Send"
                className="rounded-full bg-foreground p-2.5 text-background"
              >
                <Send className="h-4 w-4" />
              </button>
            ) : (
              <button
                onMouseDown={startRec}
                onMouseUp={stopRec}
                onMouseLeave={stopRec}
                onTouchStart={startRec}
                onTouchEnd={stopRec}
                aria-label="Hold to record"
                className="rounded-full bg-foreground p-2.5 text-background active:scale-110"
              >
                <Mic className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Bubble({ m }: { m: Msg }) {
  return (
    <div className={cn("flex", m.fromMe ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3.5 py-2 shadow-card",
          m.fromMe ? "rounded-br-sm bg-foreground text-background" : "rounded-bl-sm bg-card text-foreground"
        )}
      >
        {m.voice ? (
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            <div className="flex items-end gap-0.5">
              {Array.from({ length: 16 }).map((_, i) => (
                <span
                  key={i}
                  className={cn("w-0.5 rounded-full", m.fromMe ? "bg-background/70" : "bg-foreground/60")}
                  style={{ height: `${6 + ((i * 7) % 14)}px` }}
                />
              ))}
            </div>
            <span className="text-[11px] opacity-80">0:{String(m.voice.duration).padStart(2, "0")}</span>
          </div>
        ) : (
          <p className="text-sm leading-snug">{m.text}</p>
        )}
        <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] opacity-70">
          <span>{m.time}</span>
          {m.fromMe && (m.status === "read" ? (
            <CheckCheck className="h-3 w-3 text-sky-300" />
          ) : m.status === "delivered" ? (
            <CheckCheck className="h-3 w-3" />
          ) : (
            <Check className="h-3 w-3" />
          ))}
        </div>
      </div>
    </div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}
