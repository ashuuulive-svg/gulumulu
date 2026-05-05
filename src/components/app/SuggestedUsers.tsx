import { useEffect, useState } from "react";
import { BadgeCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { followUser, getSuggestedUsers, type SuggestedUser } from "@/lib/follows";
import { toast } from "sonner";

export function SuggestedUsers({ onOpenUser }: { onOpenUser?: (id: string) => void }) {
  const { user } = useAuth();
  const [items, setItems] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    getSuggestedUsers(user.id, 10)
      .then(setItems)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleFollow = async (id: string) => {
    if (!user) return;
    setFollowingIds((s) => new Set(s).add(id));
    try {
      await followUser(user.id, id);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
      setFollowingIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl bg-card p-4 shadow-card">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Suggested for you</h2>
      <ul className="space-y-3">
        {items.map((u) => {
          const avatar = u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.username}`;
          const isFollowing = followingIds.has(u.id);
          return (
            <li key={u.id} className="flex items-center gap-3">
              <button onClick={() => onOpenUser?.(u.id)}>
                <img src={avatar} alt="" className="h-10 w-10 rounded-full bg-pink-soft object-cover" />
              </button>
              <button onClick={() => onOpenUser?.(u.id)} className="flex-1 text-left leading-tight">
                <p className="flex items-center gap-1 text-sm font-semibold text-foreground">
                  {u.username}
                  {u.is_verified && <BadgeCheck className="h-3.5 w-3.5 fill-sky-500 text-white" />}
                </p>
                {u.full_name && <p className="text-xs text-muted-foreground">{u.full_name}</p>}
              </button>
              <button
                onClick={() => handleFollow(u.id)}
                disabled={isFollowing}
                className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background disabled:opacity-40"
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
