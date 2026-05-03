import { useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, Ban, ShieldOff, Trash2, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AdminProfile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  created_at: string;
};

type AdminPost = {
  id: string;
  author_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  author?: { username: string } | null;
};

export function AdminPanel({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<"users" | "posts">("users");
  const [users, setUsers] = useState<AdminProfile[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [banTarget, setBanTarget] = useState<AdminProfile | null>(null);

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, is_verified, is_banned, ban_reason, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    setUsers((data as AdminProfile[]) ?? []);
    setLoading(false);
  };

  const loadPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("id, author_id, image_url, caption, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) toast.error(error.message);
    const rows = (data as AdminPost[]) ?? [];
    if (rows.length) {
      const ids = Array.from(new Set(rows.map((r) => r.author_id)));
      const { data: profs } = await supabase.from("profiles").select("id, username").in("id", ids);
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      rows.forEach((r) => (r.author = map.get(r.author_id) ?? null));
    }
    setPosts(rows);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    if (tab === "users") loadUsers();
    else loadPosts();
  }, [tab]);

  const toggleVerified = async (u: AdminProfile) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_verified: !u.is_verified })
      .eq("id", u.id);
    if (error) return toast.error(error.message);
    toast.success(u.is_verified ? "Verification removed" : "Verified ✓");
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_verified: !u.is_verified } : x)));
  };

  const unban = async (u: AdminProfile) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: false, ban_reason: null, banned_at: null })
      .eq("id", u.id);
    if (error) return toast.error(error.message);
    toast.success("User unbanned");
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_banned: false, ban_reason: null } : x)));
  };

  const deletePost = async (p: AdminPost) => {
    if (!confirm("Delete this post permanently?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Post deleted");
    setPosts((prev) => prev.filter((x) => x.id !== p.id));
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(query.toLowerCase()) ||
      (u.full_name ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background shadow-card">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-card/95 px-3 py-3 backdrop-blur-md">
          <button onClick={onBack} aria-label="Back" className="rounded-full p-1.5 hover:bg-pink-soft">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-base font-bold leading-tight text-foreground">Secretary Panel</h1>
            <p className="text-[11px] text-muted-foreground">Master Admin · GuluMulu</p>
          </div>
        </header>

        <div className="grid grid-cols-2 border-b border-border bg-card">
          {(["users", "posts"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 text-sm font-semibold capitalize ${tab === t ? "border-b-2 border-foreground text-foreground" : "text-muted-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "users" && (
          <div className="px-3 pb-6 pt-3">
            <div className="mb-3 flex items-center gap-2 rounded-full bg-pink-soft px-4 py-2.5">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users"
                className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            {loading ? (
              <Spinner />
            ) : (
              <ul className="space-y-2">
                {filteredUsers.map((u) => (
                  <li key={u.id} className="rounded-2xl bg-card p-3 shadow-card">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.username}`}
                        className="h-11 w-11 rounded-full bg-pink-soft object-cover"
                        alt=""
                      />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1 truncate text-sm font-semibold text-foreground">
                          {u.username}
                          {u.is_verified && <BadgeCheck className="h-4 w-4 fill-sky-500 text-white" />}
                          {u.is_banned && (
                            <span className="ml-1 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-destructive">
                              Banned
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{u.full_name || "—"}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => toggleVerified(u)}
                        className="inline-flex items-center gap-1 rounded-full bg-pink-soft px-3 py-1.5 text-xs font-semibold"
                      >
                        <BadgeCheck className="h-3.5 w-3.5" />
                        {u.is_verified ? "Unverify" : "Verify"}
                      </button>
                      {u.is_banned ? (
                        <button
                          onClick={() => unban(u)}
                          className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
                        >
                          <ShieldOff className="h-3.5 w-3.5" /> Unban
                        </button>
                      ) : (
                        <button
                          onClick={() => setBanTarget(u)}
                          className="inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          <Ban className="h-3.5 w-3.5" /> Instant Ban
                        </button>
                      )}
                    </div>
                    {u.is_banned && u.ban_reason && (
                      <p className="mt-2 rounded-lg bg-destructive/5 p-2 text-[11px] text-destructive">
                        Reason: {u.ban_reason}
                      </p>
                    )}
                  </li>
                ))}
                {filteredUsers.length === 0 && (
                  <li className="py-12 text-center text-sm text-muted-foreground">No users found</li>
                )}
              </ul>
            )}
          </div>
        )}

        {tab === "posts" && (
          <div className="px-3 pb-6 pt-3">
            {loading ? (
              <Spinner />
            ) : (
              <ul className="space-y-2">
                {posts.map((p) => (
                  <li key={p.id} className="flex gap-3 rounded-2xl bg-card p-3 shadow-card">
                    <img src={p.image_url} className="h-16 w-16 rounded-lg object-cover" alt="" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground">@{p.author?.username ?? "unknown"}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{p.caption || "—"}</p>
                      <button
                        onClick={() => deletePost(p)}
                        className="mt-2 inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1 text-[11px] font-semibold text-white"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </li>
                ))}
                {posts.length === 0 && (
                  <li className="py-12 text-center text-sm text-muted-foreground">No posts yet</li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>

      {banTarget && (
        <BanDialog
          user={banTarget}
          onClose={() => setBanTarget(null)}
          onBanned={(reason) => {
            setUsers((prev) =>
              prev.map((x) => (x.id === banTarget.id ? { ...x, is_banned: true, ban_reason: reason } : x)),
            );
            setBanTarget(null);
          }}
        />
      )}
    </main>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function BanDialog({
  user,
  onClose,
  onBanned,
}: {
  user: AdminProfile;
  onClose: () => void;
  onBanned: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const r = reason.trim() || "Violation of community guidelines.";
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: true, ban_reason: r, banned_at: new Date().toISOString() })
      .eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Banned @${user.username}`);
    onBanned(r);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-foreground">Ban @{user.username}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          User will be locked out and shown the ban screen with this reason.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for ban (shown to user)"
          rows={3}
          className="mt-3 w-full rounded-xl border border-border bg-pink-soft px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-ring"
        />
        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-full bg-pink-soft py-2.5 text-sm font-semibold">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy}
            className="flex-1 rounded-full bg-destructive py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Banning…" : "Ban User"}
          </button>
        </div>
      </div>
    </div>
  );
}
