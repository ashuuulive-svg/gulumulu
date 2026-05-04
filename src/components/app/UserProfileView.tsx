import { useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, Lock, MessageCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getOrCreateConversation } from "@/lib/chat";
import { toast } from "sonner";

type ViewProfile = {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_private: boolean;
  is_verified: boolean;
};

export function UserProfileView({
  userId,
  onBack,
  onMessage,
}: {
  userId: string;
  onBack: () => void;
  onMessage: (otherUserId: string, conversationId: string) => void;
}) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ViewProfile | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [{ data: p }, { data: posts }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, full_name, bio, avatar_url, is_private, is_verified")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("posts")
          .select("id, image_url")
          .eq("author_id", userId)
          .order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      setProfile((p as ViewProfile | null) ?? null);
      setImages((posts ?? []).map((r) => r.image_url));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleMessage = async () => {
    if (!user || !profile) return;
    setOpening(true);
    try {
      const id = await getOrCreateConversation(user.id, profile.id);
      onMessage(profile.id, id);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to open chat");
    } finally {
      setOpening(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-border bg-card px-3 py-3">
          <button onClick={onBack} className="rounded-full p-1.5 hover:bg-pink-soft" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold">User not found</h1>
        </header>
      </div>
    );
  }

  const avatar =
    profile.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.username}`;

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-card/95 px-3 py-3 backdrop-blur-md">
        <button onClick={onBack} className="rounded-full p-1.5 hover:bg-pink-soft" aria-label="Back">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <div className="flex items-center gap-1.5">
          {profile.is_private && <Lock className="h-4 w-4 text-foreground" />}
          <h1 className="text-lg font-semibold text-foreground">{profile.username}</h1>
          {profile.is_verified && <BadgeCheck className="h-5 w-5 fill-sky-500 text-white" />}
        </div>
      </header>

      <section className="px-4 py-5">
        <div className="flex items-center gap-6">
          <div className="story-ring rounded-full p-[2.5px]">
            <img
              src={avatar}
              alt={profile.full_name ?? profile.username}
              className="h-20 w-20 rounded-full border-2 border-card bg-pink-soft object-cover"
            />
          </div>
          <dl className="flex flex-1 justify-around text-center">
            {[
              { k: "Posts", v: images.length },
              { k: "Followers", v: 0 },
              { k: "Following", v: 0 },
            ].map((s) => (
              <div key={s.k}>
                <dt className="text-xs text-muted-foreground">{s.k}</dt>
                <dd className="text-base font-bold text-foreground">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-4 space-y-0.5">
          {profile.full_name && (
            <p className="text-sm font-semibold text-foreground">{profile.full_name}</p>
          )}
          {profile.bio && (
            <p className="whitespace-pre-line text-sm text-foreground">{profile.bio}</p>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button className="flex-1 rounded-lg bg-foreground py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90">
            Follow
          </button>
          <button
            onClick={handleMessage}
            disabled={opening || profile.id === user?.id}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-pink-soft py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent disabled:opacity-40"
          >
            {opening ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageCircle className="h-4 w-4" />
            )}
            Message
          </button>
        </div>
      </section>

      {images.length === 0 ? (
        <div className="bg-card px-6 py-16 text-center">
          <p className="text-sm font-semibold text-foreground">No posts yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5 bg-card">
          {images.map((src, i) => (
            <div key={i} className="aspect-square overflow-hidden bg-pink-soft">
              <img src={src} alt={`Post ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
