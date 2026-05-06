import { useEffect, useState } from "react";
import { X, Heart, UserPlus, MessageSquare, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchNotifications, markAllRead, type NotificationRow } from "@/lib/notifications";
import { timeAgo } from "@/lib/posts";

export function NotificationsSheet({
  onClose,
  onOpenUser,
}: {
  onClose: () => void;
  onOpenUser?: (userId: string) => void;
}) {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchNotifications(user.id).then((rows) => {
      setItems(rows);
      setLoading(false);
      markAllRead(user.id);
    });
    const ch = supabase
      .channel(`notif:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${user.id}` },
        () => fetchNotifications(user.id).then(setItems),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  return (
    <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose}>
      <div
        className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-card pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <h2 className="text-base font-semibold text-foreground">Notifications</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-pink-soft">
            <X className="h-5 w-5 text-foreground" />
          </button>
        </header>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((n) => {
              const Icon = n.type === "like" ? Heart : n.type === "follow" ? UserPlus : MessageSquare;
              const text = n.type === "like" ? "liked your post" : n.type === "follow" ? "started following you" : "commented on your post";
              const avatar = n.actor?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${n.actor?.username ?? "u"}`;
              return (
                <li key={n.id}>
                  <button
                    onClick={() => { onOpenUser?.(n.actor_id); onClose(); }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-pink-soft"
                  >
                    <div className="relative">
                      <img src={avatar} alt="" className="h-10 w-10 rounded-full bg-pink-soft object-cover" />
                      <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-card p-0.5">
                        <Icon className={`h-3.5 w-3.5 ${n.type === "like" ? "fill-destructive text-destructive" : "text-foreground"}`} />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">
                        <span className="font-semibold">{n.actor?.username ?? "someone"}</span>{" "}
                        <span className="text-muted-foreground">{text}</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">{timeAgo(n.created_at)} ago</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
