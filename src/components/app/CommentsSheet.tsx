import { useEffect, useRef, useState } from "react";
import { X, Send } from "lucide-react";
import { addComment, fetchComments, timeAgo, type FeedComment } from "@/lib/posts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function CommentsSheet({ postId, onClose }: { postId: string; onClose: () => void }) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchComments(postId).then(setComments).catch(console.error);

    const channel = supabase
      .channel(`comments:${postId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "post_comments", filter: `post_id=eq.${postId}` },
        () => fetchComments(postId).then(setComments).catch(console.error),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [comments]);

  const submit = async () => {
    if (!user || !body.trim()) return;
    setSending(true);
    try {
      await addComment(postId, user.id, body);
      setBody("");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to comment");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="flex h-[75vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <span className="w-8" />
          <h2 className="text-base font-semibold text-foreground">Comments</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-pink-soft">
            <X className="h-5 w-5 text-foreground" />
          </button>
        </header>

        <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {comments.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">Be the first to comment.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-3">
              <img
                src={c.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${c.author?.username || "u"}`}
                alt=""
                className="h-8 w-8 rounded-full bg-pink-soft object-cover"
              />
              <div className="flex-1 leading-snug">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">{c.author?.username ?? "user"}</span>{" "}
                  <span>{c.body}</span>
                </p>
                <p className="text-[11px] text-muted-foreground">{timeAgo(c.created_at)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-border bg-card px-3 py-3">
          <img
            src={profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.username || "u"}`}
            alt=""
            className="h-8 w-8 rounded-full bg-pink-soft object-cover"
          />
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Add a comment..."
            maxLength={2000}
            className="flex-1 rounded-full bg-pink-soft px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={submit}
            disabled={sending || !body.trim()}
            aria-label="Send comment"
            className="rounded-full bg-foreground p-2 text-background disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
