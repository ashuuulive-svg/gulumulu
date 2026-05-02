import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BottomNav, type Tab } from "@/components/app/BottomNav";
import { HomeFeed } from "@/components/app/HomeFeed";
import { SearchExplore } from "@/components/app/SearchExplore";
import { ChatList } from "@/components/app/ChatList";
import { Profile } from "@/components/app/Profile";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Blush — Soft social, sweetly designed" },
      {
        name: "description",
        content: "A soft pastel pink Instagram-style social app: feed, explore, chats, and profile in one beautifully minimal interface.",
      },
      { property: "og:title", content: "Blush — Soft social, sweetly designed" },
      { property: "og:description", content: "A pastel pink social app concept with feed, explore, chats and profile." },
    ],
  }),
  component: Index,
});

function Index() {
  const [tab, setTab] = useState<Tab>("home");

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background shadow-card">
        <div className="flex flex-1 flex-col">
          {tab === "home" && <HomeFeed />}
          {tab === "search" && <SearchExplore />}
          {tab === "chat" && <ChatList />}
          {tab === "profile" && <Profile />}
        </div>
        <BottomNav active={tab} onChange={setTab} />
      </div>
    </main>
  );
}
