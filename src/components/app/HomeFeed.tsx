import { Heart, PlusSquare, MessageCircle, MoreHorizontal, Send, Bookmark } from "lucide-react";
import { useState } from "react";
import { stories, posts } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function Stories() {
  return (
    <section aria-label="Stories" className="border-b border-border bg-card">
      <div className="scrollbar-hide flex gap-4 overflow-x-auto px-4 py-4">
        {stories.map((s) => (
          <button key={s.id} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
            <div
              className={cn(
                "rounded-full p-[2.5px]",
                s.hasNewStory ? "story-ring" : "bg-border"
              )}
            >
              <div className="rounded-full bg-card p-[2px]">
                <img
                  src={s.avatar}
                  alt={s.username}
                  className="h-14 w-14 rounded-full bg-pink-soft object-cover"
                />
              </div>
            </div>
            <span className="max-w-full truncate text-[11px] text-foreground">{s.username}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function PostCard({ post }: { post: (typeof posts)[number] }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const likeCount = post.likes + (liked ? 1 : 0);

  return (
    <article className="overflow-hidden rounded-2xl bg-card shadow-card">
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="story-ring rounded-full p-[2px]">
            <img src={post.avatar} alt="" className="h-9 w-9 rounded-full bg-card object-cover" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">{post.username}</p>
            {post.location && (
              <p className="text-[11px] text-muted-foreground">{post.location}</p>
            )}
          </div>
        </div>
        <button aria-label="More options" className="rounded-full p-1.5 hover:bg-pink-soft">
          <MoreHorizontal className="h-5 w-5 text-foreground" />
        </button>
      </header>

      <div className="aspect-[4/5] w-full overflow-hidden bg-pink-soft">
        <img
          src={post.image}
          alt={post.caption}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-4">
          <button onClick={() => setLiked((v) => !v)} aria-label="Like">
            <Heart
              className={cn(
                "h-6 w-6 transition-transform active:scale-90",
                liked ? "fill-destructive text-destructive" : "text-foreground"
              )}
            />
          </button>
          <button aria-label="Comment">
            <MessageCircle className="h-6 w-6 text-foreground" />
          </button>
          <button aria-label="Share">
            <Send className="h-6 w-6 text-foreground" />
          </button>
        </div>
        <button onClick={() => setSaved((v) => !v)} aria-label="Save">
          <Bookmark
            className={cn("h-6 w-6 text-foreground", saved && "fill-foreground")}
          />
        </button>
      </div>

      <div className="space-y-1 px-4 pb-4 pt-2">
        <p className="text-sm font-semibold text-foreground">{likeCount.toLocaleString()} likes</p>
        <p className="text-sm text-foreground">
          <span className="font-semibold">{post.username}</span>{" "}
          <span>{post.caption}</span>
        </p>
        <button className="text-sm text-muted-foreground">
          View all {post.comments} comments
        </button>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {post.timestamp} ago
        </p>
      </div>
    </article>
  );
}

export function HomeFeed({ onCreate }: { onCreate?: () => void } = {}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <h1 className="font-serif text-2xl font-bold italic tracking-tight text-foreground">
          GuluMulu
        </h1>
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
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </div>
  );
}
