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
import { BannedScreen } from "@/components/app/BannedScreen";
import { AdminPanel } from "@/components/app/AdminPanel";
import type { ChatItem } from "@/lib/mock-data";
import { useAuth } from "@/hooks/useAuth";

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

function Index() {
  const { session, profile, loading, setupComplete, isAdmin } = useAuth();
  const [seenOnboarding, setSeenOnboarding] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("gulumulu.onboarded") === "1";
  });
  const [tab, setTab] = useState<Tab>("home");
  const [activeChat, setActiveChat] = useState<ChatItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </main>
    );
  }

  // 1. First-time visitor → onboarding cards
  if (!seenOnboarding) {
    return (
      <Onboarding
        onDone={() => {
          localStorage.setItem("gulumulu.onboarded", "1");
          setSeenOnboarding(true);
        }}
      />
    );
  }

  // 2. Not signed in → login
  if (!session) return <Login />;

  // 3. Signed in but profile not set up → setup wizard
  if (!profile || !setupComplete) {
    return <ProfileSetup onDone={() => { /* AuthProvider will refresh; setupComplete becomes true */ }} />;
  }

  // 4. Banned users see the lock screen with the reason.
  if (profile.is_banned) return <BannedScreen />;

  // 5. Admin panel (only accessible to admins)
  if (adminOpen && isAdmin) return <AdminPanel onBack={() => setAdminOpen(false)} />;

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
        <BottomNav active={tab} onChange={setTab} onCreate={() => setCreating(true)} />
      </div>
      {creating && <CreatePostModal onClose={() => setCreating(false)} />}
    </main>
  );
}
