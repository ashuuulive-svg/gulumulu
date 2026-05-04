import { Search as SearchIcon, MessageCircle, BadgeCheck, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { listConversations, type ConversationListItem } from "@/lib/chat";

export function ChatList({
  onOpen,
}: {
  onOpen: (otherUserId: string, conversationId: string) => void;
}) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    if (!user) return;
    try {
      setItems(await listConversations(user.id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    reload();
    const channel = supabase
      .channel("chat-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => reload())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => reload())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filtered = query.trim()
    ? items.filter((i) =>
        (i.other?.username ?? "").toLowerCase().includes(query.toLowerCase()) ||
        (i.other?.full_name ?? "").toLowerCase().includes(query.toLowerCase()),
      )
    : items;

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between pb-3">
          <h1 className="text-xl font-bold text-foreground">Messages</h1>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-pink-soft px-4 py-2.5">
          <SearchIcon className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-soft">
            <MessageCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm font-semibold text-foreground">No conversations yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tap a profile and press Message to start chatting.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {filtered.map((c) => {
            const username = c.other?.username ?? "user";
            const avatar =
              c.other?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${username}`;
            return (
              <li key={c.id}>
                <button
                  onClick={() => onOpen(c.other_user_id, c.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-pink-soft/50"
                >
                  <img src={avatar} alt="" className="h-12 w-12 rounded-full bg-pink-soft object-cover" />
                  <div className="flex-1 leading-tight">
                    <p className="flex items-center gap-1 text-sm font-semibold text-foreground">
                      {username}
                      {c.other?.is_verified && (
                        <BadgeCheck className="h-3.5 w-3.5 fill-sky-500 text-white" />
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.preview ?? "Say hi 👋"}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
