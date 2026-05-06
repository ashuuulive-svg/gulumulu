import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BottomNav, type Tab } from "@/components/app/BottomNav";
import { HomeFeed } from "@/components/app/HomeFeed";
import { SearchExplore } from "@/components/app/SearchExplore";
import { ChatList } from "@/components/app/ChatList";
import { Profile } from "@/components/app/Profile";
import { Onboarding } from "@/components/app/Onboarding";
import { Login } from "@/components/app/Login";
import { ProfileSetup } from "@/components/app/ProfileSetup";
import { ChatRoom, type ChatPeer } from "@/components/app/ChatRoom";
import { CreatePostModal } from "@/components/app/CreatePostModal";
import { BannedScreen } from "@/components/app/BannedScreen";
import { AdminPanel } from "@/components/app/AdminPanel";
import { UserProfileView } from "@/components/app/UserProfileView";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
  const [activeChat, setActiveChat] = useState<{ conversationId: string; peer: ChatPeer } | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const openChatWithUser = async (otherUserId: string, conversationId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, is_verified")
      .eq("id", otherUserId)
      .maybeSingle();
    if (data) {
      setActiveChat({
        conversationId,
        peer: {
          id: data.id,
          username: data.username,
          avatar_url: data.avatar_url,
          is_verified: data.is_verified,
        },
      });
      setViewingUserId(null);
    }
  };

  // Reset overlays on tab change
  useEffect(() => {
    setViewingUserId(null);
  }, [tab]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </main>
    );
  }

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

  if (!session) return <Login />;
  if (!profile || !setupComplete) return <ProfileSetup onDone={() => { /* refreshed via auth */ }} />;
  if (profile.is_banned) return <BannedScreen />;
  if (adminOpen && isAdmin) return <AdminPanel onBack={() => setAdminOpen(false)} />;

  if (activeChat) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-md">
          <ChatRoom
            conversationId={activeChat.conversationId}
            peer={activeChat.peer}
            onBack={() => setActiveChat(null)}
            onOpenPeer={(uid) => { setActiveChat(null); setViewingUserId(uid); }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background shadow-card">
        <div className="flex flex-1 flex-col">
          {viewingUserId ? (
            <UserProfileView
              userId={viewingUserId}
              onBack={() => setViewingUserId(null)}
              onMessage={openChatWithUser}
            />
          ) : (
            <>
              {tab === "home" && (
                <HomeFeed onCreate={() => setCreating(true)} onOpenUser={setViewingUserId} />
              )}
              {tab === "search" && <SearchExplore onOpenUser={setViewingUserId} />}
              {tab === "chat" && <ChatList onOpen={openChatWithUser} />}
              {tab === "profile" && (
                <Profile onOpenAdmin={isAdmin ? () => setAdminOpen(true) : undefined} />
              )}
            </>
          )}
        </div>
        <BottomNav active={tab} onChange={setTab} onCreate={() => setCreating(true)} />
      </div>
      {creating && <CreatePostModal onClose={() => setCreating(false)} />}
    </main>
  );
}
