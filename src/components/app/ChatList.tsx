import { Search as SearchIcon, Edit } from "lucide-react";
import { useState } from "react";
import { chats, type ChatItem } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function ChatList({ onOpen }: { onOpen?: (c: ChatItem) => void } = {}) {
  const [query, setQuery] = useState("");
  const filtered = chats.filter((c) =>
    c.username.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between pb-3">
          <h1 className="text-xl font-bold text-foreground">Messages</h1>
          <button aria-label="New message" className="rounded-full p-1.5 hover:bg-pink-soft">
            <Edit className="h-6 w-6 text-foreground" />
          </button>
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

      <ul className="divide-y divide-border">
        {filtered.map((c) => (
          <li key={c.id}>
            <button onClick={() => onOpen?.(c)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-pink-soft/40">
              <div className="relative shrink-0">
                <img
                  src={c.avatar}
                  alt=""
                  className="h-14 w-14 rounded-full bg-pink-soft object-cover"
                />
                {c.online && (
                  <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card bg-online" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{c.username}</p>
                <p
                  className={cn(
                    "truncate text-sm",
                    c.unread ? "font-medium text-foreground" : "text-muted-foreground"
                  )}
                >
                  {c.lastMessage} · {c.timestamp}
                </p>
              </div>
              {c.unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-unread" />}
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="px-4 py-12 text-center text-sm text-muted-foreground">
            No conversations found
          </li>
        )}
      </ul>
    </div>
  );
}
