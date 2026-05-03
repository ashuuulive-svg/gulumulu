import { Search as SearchIcon, Edit, MessageCircle } from "lucide-react";
import { useState } from "react";
import type { ChatItem } from "@/lib/mock-data";

export function ChatList(_props: { onOpen?: (c: ChatItem) => void } = {}) {
  const [query, setQuery] = useState("");

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

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-soft">
          <MessageCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="mt-4 text-sm font-semibold text-foreground">No conversations yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Real-time DMs · Coming soon</p>
      </div>
    </div>
  );
}
