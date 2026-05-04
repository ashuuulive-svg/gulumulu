import { Heart, PlusSquare, MessageCircle, MoreHorizontal, Send, Bookmark, MapPin, BadgeCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { fetchFeed, toggleLike, timeAgo, type FeedPost } from "@/lib/posts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CommentsSheet } from "./CommentsSheet";
import { toast } from "sonner";

function Stories() {
  return (
    <section aria-label="Stories" className="border-b border-border bg-card">
      <div className="px-4 py-6 text-center">
        <p className="text-xs text-muted-foreground">No stories yet · Coming soon</p>
      </div>
    </section>
  );
}

function PostCard({
  post,
  onToggleLike,
  onOpenComments,
  onOpenAuthor,
}: {
  post: FeedPost;
  onToggleLike: () => void;
  onOpenComments: () => void;
  onOpenAuthor: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const [burst, setBurst] = useState(false);
  const tapTimer = useRef<number | undefined>(undefined);

  const onImageClick = () => {
    if (tapTimer.current) {
      window.clearTimeout(tapTimer.current);
      tapTimer.current = undefined;
      if (!post.liked_by_me) onToggleLike();
      setBurst(true);
      window.setTimeout(() => setBurst(false), 600);
    } else {
      tapTimer.current = window.setTimeout(() => {
        tapTimer.current = undefined;
      }, 280);
    }
  };

  const username = post.author?.username ?? "user";
  const avatar =
    post.author?.avatar_url ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${username}`;

  return (
    <article className="overflow-hidden rounded-2xl bg-card shadow-card">
      <header className="flex items-center justify-between px-4 py-3">
        <button onClick={onOpenAuthor} className="flex items-center gap-3 text-left">
          <div className="story-ring rounded-full p-[2px]">
            <img src={avatar} alt="" className="h-9 w-9 rounded-full bg-card object-cover" />
          </div>
          <div className="leading-tight">
            <p className="flex items-center gap-1 text-sm font-semibold text-foreground hover:underline">
              {username}
              {(post.author as { is_verified?: boolean } | null)?.is_verified && (
                <BadgeCheck className="h-3.5 w-3.5 fill-sky-500 text-white" />
              )}
            </p>
            {post.location && (
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {post.location}
              </p>
            )}
          </div>
        </button>
        <button aria-label="More options" className="rounded-full p-1.5 hover:bg-pink-soft">
          <MoreHorizontal className="h-5 w-5 text-foreground" />
        </button>
      </header>

      <div
        className="relative aspect-[4/5] w-full select-none overflow-hidden bg-pink-soft"
        onClick={onImageClick}
      >
        <img src={post.image_url} alt={post.caption ?? ""} className="h-full w-full object-cover" loading="lazy" />
        {burst && (
          <Heart className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 fill-destructive text-destructive opacity-90 animate-in zoom-in-50" />
        )}
      </div>

      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-4">
          <button onClick={onToggleLike} aria-label="Like">
            <Heart
              className={cn(
                "h-6 w-6 transition-transform active:scale-90",
                post.liked_by_me ? "fill-destructive text-destructive" : "text-foreground",
              )}
            />
          </button>
          <button onClick={onOpenComments} aria-label="Comment">
            <MessageCircle className="h-6 w-6 text-foreground" />
          </button>
          <button onClick={() => sharePost(post)} aria-label="Share">
            <Send className="h-6 w-6 text-foreground" />
          </button>
        </div>
        <button onClick={() => setSaved((v) => !v)} aria-label="Save">
          <Bookmark className={cn("h-6 w-6 text-foreground", saved && "fill-foreground")} />
        </button>
      </div>

      <div className="space-y-1 px-4 pb-4 pt-2">
        <p className="text-sm font-semibold text-foreground">
          {post.like_count.toLocaleString()} {post.like_count === 1 ? "like" : "likes"}
        </p>
        {post.caption && (
          <p className="text-sm text-foreground">
            <span className="font-semibold">{username}</span> <span>{post.caption}</span>
          </p>
        )}
        {post.comment_count > 0 && (
          <button onClick={onOpenComments} className="text-sm text-muted-foreground">
            View all {post.comment_count} comments
          </button>
        )}
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{timeAgo(post.created_at)} ago</p>
      </div>
    </article>
  );
}

async function sharePost(post: FeedPost) {
  const url = typeof window !== "undefined" ? window.location.origin : "";
  const shareData = {
    title: `@${post.author?.username ?? "user"} on GuluMulu`,
    text: post.caption ?? `Check out this post by @${post.author?.username ?? "user"}`,
    url: `${url}/?post=${post.id}`,
  };
  try {
    if (navigator.share && navigator.canShare?.(shareData)) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(shareData.url);
    toast.success("Link copied to clipboard");
  } catch (e) {
    if ((e as Error)?.name === "AbortError") return;
    toast.error("Could not share");
  }
}

export function HomeFeed({
  onCreate,
  onOpenUser,
}: {
  onCreate?: () => void;
  onOpenUser?: (userId: string) => void;
}) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [openComments, setOpenComments] = useState<string | null>(null);

  const reload = async () => {
    if (!user) return;
    try {
      const data = await fetchFeed(user.id);
      setPosts(data);
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
      .channel("feed-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "post_likes" }, () => reload())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "post_comments" }, () => reload())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const onToggleLike = async (post: FeedPost) => {
    if (!user) return;
    // optimistic
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, liked_by_me: !p.liked_by_me, like_count: p.like_count + (p.liked_by_me ? -1 : 1) }
          : p,
      ),
    );
    try {
      await toggleLike(post.id, user.id, post.liked_by_me);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
      reload();
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <h1 className="font-serif text-2xl font-bold italic tracking-tight text-foreground">GuluMulu</h1>
        <div className="flex items-center gap-3">
          <button aria-label="Notifications" className="rounded-full p-1.5 hover:bg-pink-soft">
            <Heart className="h-6 w-6 text-foreground" />
          </button>
          <button onClick={onCreate} aria-label="Create post" className="rounded-full p-1.5 hover:bg-pink-soft">
            <PlusSquare className="h-6 w-6 text-foreground" />
          </button>
        </div>
      </header>

      <Stories />

      <div className="space-y-4 px-3 py-4">
        {loading && (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading feed…</div>
        )}
        {!loading && posts.length === 0 && (
          <div className="rounded-2xl bg-card p-8 text-center shadow-card">
            <p className="text-sm font-semibold text-foreground">No posts yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Tap the + below to share your first moment.</p>
            <button
              onClick={onCreate}
              className="mt-4 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"
            >
              Create post
            </button>
          </div>
        )}
        {posts.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            onToggleLike={() => onToggleLike(p)}
            onOpenComments={() => setOpenComments(p.id)}
            onOpenAuthor={() => onOpenUser?.(p.author_id)}
          />
        ))}
            onToggleLike={() => onToggleLike(p)}
            onOpenComments={() => setOpenComments(p.id)}
          />
        ))}
      </div>

      {openComments && <CommentsSheet postId={openComments} onClose={() => setOpenComments(null)} />}
    </div>
  );
}
