import { Menu, Grid3x3, UserSquare2, MoreVertical, Archive, LogOut, Lock, BadgeCheck, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { EditProfileModal, type ProfileEdit } from "./EditProfileModal";
import { ArchiveSheet } from "./ArchiveSheet";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getFollowStats } from "@/lib/follows";
import { toast } from "sonner";

export function Profile({ onOpenAdmin }: { onOpenAdmin?: () => void } = {}) {
  const { profile: realProfile, signOut, refreshProfile, user } = useAuth();
  const [tab, setTab] = useState<"grid" | "tagged">("grid");
  const [editing, setEditing] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [postCount, setPostCount] = useState(0);
  const [myImages, setMyImages] = useState<string[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account", {});
      if (error) throw error;
      toast.success("Account deleted. You can sign up again with the same email.");
      await supabase.auth.signOut();
      window.location.reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete account");
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    supabase
      .from("posts")
      .select("id, image_url")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const rows = data ?? [];
        setPostCount(rows.length);
        setMyImages(rows.map((r) => r.image_url));
      });
    getFollowStats(user.id, user.id).then((s) => {
      setFollowers(s.followers);
      setFollowing(s.following);
    });
  }, [user?.id]);

  const data: ProfileEdit = {
    avatar: realProfile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${realProfile?.username ?? "u"}`,
    fullName: realProfile?.full_name || "",
    username: realProfile?.username || "",
    bio: realProfile?.bio || "",
    isPrivate: realProfile?.is_private ?? false,
  };
  const images = tab === "grid" ? myImages : [];


  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          {data.isPrivate && <Lock className="h-4 w-4 text-foreground" />}
          <h1 className="text-lg font-semibold text-foreground">{data.username}</h1>
          {realProfile?.is_verified && <BadgeCheck className="h-5 w-5 fill-sky-500 text-white" />}
        </div>
        <div className="relative flex items-center gap-1">
          <button onClick={() => setMenuOpen((v) => !v)} aria-label="More" className="rounded-full p-1.5 hover:bg-pink-soft">
            <MoreVertical className="h-6 w-6 text-foreground" />
          </button>
          <button aria-label="Settings" className="rounded-full p-1.5 hover:bg-pink-soft">
            <Menu className="h-6 w-6 text-foreground" />
          </button>
          {menuOpen && (
            <div className="absolute right-10 top-10 z-40 w-56 overflow-hidden rounded-2xl bg-card shadow-card">
              <button
                onClick={() => { setMenuOpen(false); setEditing(true); }}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-foreground hover:bg-pink-soft"
              >
                Edit Profile
              </button>
              <button
                onClick={() => { setMenuOpen(false); setArchiveOpen(true); }}
                className="flex w-full items-center gap-2 border-t border-border px-4 py-3 text-left text-sm text-foreground hover:bg-pink-soft"
              >
                <Archive className="h-4 w-4" /> Archives & Highlights
              </button>
              {onOpenAdmin && (
                <button
                  onClick={() => { setMenuOpen(false); onOpenAdmin(); }}
                  className="flex w-full items-center gap-2 border-t border-border px-4 py-3 text-left text-sm text-foreground hover:bg-pink-soft"
                >
                  <ShieldCheck className="h-4 w-4" /> Secretary Panel
                </button>
              )}
              <button
                onClick={() => { setMenuOpen(false); signOut(); }}
                className="flex w-full items-center gap-2 border-t border-border px-4 py-3 text-left text-sm text-foreground hover:bg-pink-soft"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
              <button
                onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                className="flex w-full items-center gap-2 border-t border-border px-4 py-3 text-left text-sm text-destructive hover:bg-pink-soft"
              >
                <Trash2 className="h-4 w-4" /> Delete Account
              </button>
            </div>
          )}
        </div>
      </header>

      <section className="px-4 py-5">
        <div className="flex items-center gap-6">
          <div className="story-ring rounded-full p-[2.5px]">
            <img
              src={data.avatar}
              alt={data.fullName}
              className="h-20 w-20 rounded-full border-2 border-card bg-pink-soft object-cover"
            />
          </div>
          <dl className="flex flex-1 justify-around text-center">
            {[
              { k: "Posts", v: postCount },
              { k: "Followers", v: followers },
              { k: "Following", v: following },
            ].map((s) => (
              <div key={s.k}>
                <dt className="text-xs text-muted-foreground">{s.k}</dt>
                <dd className="text-base font-bold text-foreground">
                  {s.v >= 1000 ? `${(s.v / 1000).toFixed(1)}k` : s.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-4 space-y-0.5">
          {data.fullName && <p className="text-sm font-semibold text-foreground">{data.fullName}</p>}
          {data.bio && <p className="whitespace-pre-line text-sm text-foreground">{data.bio}</p>}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="flex-1 rounded-lg bg-pink-soft py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            Edit Profile
          </button>
          <button className="flex-1 rounded-lg bg-pink-soft py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent">
            Share Profile
          </button>
        </div>
      </section>

      <div className="grid grid-cols-2 border-y border-border bg-card">
        {[
          { k: "grid" as const, icon: Grid3x3, label: "Grid" },
          { k: "tagged" as const, icon: UserSquare2, label: "Tagged" },
        ].map(({ k, icon: Icon, label }) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            aria-label={label}
            className={cn(
              "flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors",
              tab === k
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      {images.length === 0 ? (
        <div className="bg-card px-6 py-16 text-center">
          <p className="text-sm font-semibold text-foreground">No posts yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Share your first moment to see it here.</p>
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

      {editing && (
        <EditProfileModal
          initial={data}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); refreshProfile(); }}
        />
      )}
      {archiveOpen && <ArchiveSheet onClose={() => setArchiveOpen(false)} />}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => !deleting && setConfirmDelete(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground">Delete account?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This permanently removes your profile, posts, messages, stories, and follows. You can sign up again with the same email afterwards. This cannot be undone.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-full bg-pink-soft py-2.5 text-sm font-semibold text-foreground"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={handleDelete}
                className="flex-1 rounded-full bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
