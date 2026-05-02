import { Menu, Grid3x3, UserSquare2, Link as LinkIcon, Lock, MoreVertical, Archive, LogOut } from "lucide-react";
import { useState } from "react";
import { profile as demoProfile } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { EditProfileModal, type ProfileEdit } from "./EditProfileModal";
import { ArchiveSheet } from "./ArchiveSheet";
import { useAuth } from "@/hooks/useAuth";

export function Profile() {
  const { profile: realProfile, signOut, refreshProfile } = useAuth();
  const [tab, setTab] = useState<"grid" | "tagged">("grid");
  const [editing, setEditing] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Compose display data: real profile fields + demo grid/stats (Phase 1 doesn't include posts yet).
  const data: ProfileEdit = {
    avatar: realProfile?.avatar_url || demoProfile.avatar,
    fullName: realProfile?.full_name || demoProfile.fullName,
    username: realProfile?.username || demoProfile.username,
    bio: realProfile?.bio || "",
    isPrivate: realProfile?.is_private ?? false,
  };
  const images = tab === "grid" ? demoProfile.grid : demoProfile.tagged;


  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          {data.isPrivate && <Lock className="h-4 w-4 text-foreground" />}
          <h1 className="text-lg font-semibold text-foreground">{data.username}</h1>
        </div>
        <div className="relative flex items-center gap-1">
          <button onClick={() => setMenuOpen((v) => !v)} aria-label="More" className="rounded-full p-1.5 hover:bg-pink-soft">
            <MoreVertical className="h-6 w-6 text-foreground" />
          </button>
          <button aria-label="Settings" className="rounded-full p-1.5 hover:bg-pink-soft">
            <Menu className="h-6 w-6 text-foreground" />
          </button>
          {menuOpen && (
            <div className="absolute right-10 top-10 z-40 w-52 overflow-hidden rounded-2xl bg-card shadow-card">
              <button
                onClick={() => { setMenuOpen(false); setArchiveOpen(true); }}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-foreground hover:bg-pink-soft"
              >
                <Archive className="h-4 w-4" /> Archives & Highlights
              </button>
              <button
                onClick={() => { setMenuOpen(false); signOut(); }}
                className="flex w-full items-center gap-2 border-t border-border px-4 py-3 text-left text-sm text-destructive hover:bg-pink-soft"
              >
                <LogOut className="h-4 w-4" /> Sign out
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
              { k: "Posts", v: demoProfile.posts },
              { k: "Followers", v: demoProfile.followers },
              { k: "Following", v: demoProfile.following },
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
          <p className="text-sm font-semibold text-foreground">{data.fullName}</p>
          <p className="text-xs text-muted-foreground">{demoProfile.category}</p>
          <p className="whitespace-pre-line text-sm text-foreground">{data.bio}</p>
          <a
            href={`https://${demoProfile.website}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-foreground"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            {demoProfile.website}
          </a>
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

      <div className="grid grid-cols-3 gap-0.5 bg-card">
        {images.map((src, i) => (
          <div key={i} className="aspect-square overflow-hidden bg-pink-soft">
            <img src={src} alt={`Post ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>

      {editing && (
        <EditProfileModal
          initial={data}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); refreshProfile(); }}
        />
      )}
      {archiveOpen && <ArchiveSheet onClose={() => setArchiveOpen(false)} />}
    </div>
  );
}
