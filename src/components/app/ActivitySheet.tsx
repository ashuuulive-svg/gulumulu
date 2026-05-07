import { useEffect, useState } from "react";
import { X, Heart, Bookmark, MessageCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getLikedPosts, getSavedPosts, getMyComments, type ActivityPost, type MyComment } from "@/lib/activity";
import { timeAgo } from "@/lib/posts";

type Tab = "saved" | "liked" | "comments";

export function ActivitySheet({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("saved");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<ActivityPost[]>([]);
  const [liked, setLiked] = useState<ActivityPost[]>([]);
  const [comments, setComments] = useState<MyComment[]>([]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    (async () => {
      if (tab === "saved") setSaved(await getSavedPosts(user.id));
      else if (tab === "liked") setLiked(await getLikedPosts(user.id));
      else setComments(await getMyComments(user.id));
      setLoading(false);
    })();
  }, [tab, user?.id]);

  const grid = tab === "saved" ? saved : liked;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-background sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold text-foreground">Your Activity</h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-pink-soft"><X className="h-5 w-5" /></button>
        </header>

        <div className="grid grid-cols-3 border-b border-border bg-card">
          {([
            { k: "saved" as const, label: "Saved", icon: Bookmark },
            { k: "liked" as const, label: "Liked", icon: Heart },
            { k: "comments" as const, label: "Comments", icon: MessageCircle },
          ]).map(({ k, label, icon: Icon }) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex items-center justify-center gap-1.5 py-3 text-xs font-semibold ${tab === k ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}>
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : tab === "comments" ? (
            comments.length === 0 ? (
              <p className="py-12 text-center text-xs text-muted-foreground">No comments yet</p>
            ) : (
              <ul className="space-y-2">
                {comments.map((c) => (
                  <li key={c.id} className="flex gap-3 rounded-2xl bg-card p-3 shadow-card">
                    {c.post_image_url && <img src={c.post_image_url} className="h-12 w-12 shrink-0 rounded-lg object-cover" alt="" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">{c.body}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{timeAgo(c.created_at)} ago</p>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : grid.length === 0 ? (
            <p className="py-12 text-center text-xs text-muted-foreground">Nothing here yet</p>
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {grid.map((p) => (
                <div key={p.id} className="aspect-square overflow-hidden bg-pink-soft">
                  <img src={p.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
