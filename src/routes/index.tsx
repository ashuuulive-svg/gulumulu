import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BottomNav, type Tab } from "@/components/app/BottomNav";
import { HomeFeed } from "@/components/app/HomeFeed";
import { SearchExplore } from "@/components/app/SearchExplore";
import { ChatList } from "@/components/app/ChatList";
import { Profile } from "@/components/app/Profile";
import { Onboarding } from "@/components/app/Onboarding";
import { Login } from "@/components/app/Login";
import { ProfileSetup } from "@/components/app/ProfileSetup";
import { ChatRoom } from "@/components/app/ChatRoom";
import { CreatePostModal } from "@/components/app/CreatePostModal";
import type { ChatItem } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GuluMulu — Soft social, sweetly designed" },
      {
        name: "description",
        content: "GuluMulu: a soft pastel pink social app — onboarding, login, profile, feed, stories, chat, and calls.",
      },
      { property: "og:title", content: "GuluMulu — Soft social, sweetly designed" },
      { property: "og:description", content: "Onboarding, login, profile, feed, stories and real-time chat in a soft pastel pink design." },
    ],
  }),
  component: Index,
});

type Stage = "onboarding" | "login" | "setup" | "app";

function Index() {
  const [stage, setStage] = useState<Stage>("onboarding");
  const [tab, setTab] = useState<Tab>("home");
  const [activeChat, setActiveChat] = useState<ChatItem | null>(null);
  const [creating, setCreating] = useState(false);

  if (stage === "onboarding") return <Onboarding onDone={() => setStage("login")} />;
  if (stage === "login") return <Login onLogin={() => setStage("setup")} />;
  if (stage === "setup") return <ProfileSetup onDone={() => setStage("app")} />;

  if (activeChat) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-md">
          <ChatRoom chat={activeChat} onBack={() => setActiveChat(null)} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background shadow-card">
        <div className="flex flex-1 flex-col">
          {tab === "home" && <HomeFeed onCreate={() => setCreating(true)} />}
          {tab === "search" && <SearchExplore />}
          {tab === "chat" && <ChatList onOpen={setActiveChat} />}
          {tab === "profile" && <Profile />}
        </div>
        <BottomNav active={tab} onChange={setTab} />
      </div>
      {creating && (
        <CreatePostModal
          onClose={() => setCreating(false)}
          onShare={() => setCreating(false)}
        />
      )}
    </main>
  );
}
