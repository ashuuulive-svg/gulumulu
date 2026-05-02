import { useRef, useState } from "react";
import { X, Camera, Lock, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ProfileEdit = {
  avatar: string;
  fullName: string;
  username: string;
  bio: string;
  isPrivate: boolean;
};

export function EditProfileModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: ProfileEdit;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user, profile } = useAuth();
  const [data, setData] = useState<ProfileEdit>(initial);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = (f?: File) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Image too large", { description: "Please choose an image under 5 MB." });
      return;
    }
    setAvatarFile(f);
    setData({ ...data, avatar: URL.createObjectURL(f) });
  };

  const handleSave = async () => {
    if (!user) return;
    if (data.username.length < 3 || !/^[a-z0-9_]+$/.test(data.username)) {
      toast.error("Username must be 3+ chars (letters, numbers, underscore).");
      return;
    }
    setSaving(true);
    try {
      let avatar_url = profile?.avatar_url ?? null;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/avatar-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
        if (upErr) throw upErr;
        avatar_url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }

      // If username changed, verify availability
      if (data.username.toLowerCase() !== (profile?.username.toLowerCase() ?? "")) {
        const { data: avail } = await supabase.rpc("username_available", { _username: data.username });
        if (!avail) {
          toast.error("That username is taken.");
          setSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          username: data.username,
          full_name: data.fullName || null,
          bio: data.bio || "",
          is_private: data.isPrivate,
          avatar_url,
        })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Profile updated");
      onSaved();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Could not save", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-background sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-pink-soft">
            <X className="h-5 w-5 text-foreground" />
          </button>
          <h2 className="text-base font-semibold text-foreground">Edit Profile</h2>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 text-sm font-semibold text-background disabled:opacity-60"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          <div className="flex flex-col items-center">
            <button
              onClick={() => fileRef.current?.click()}
              className="relative h-24 w-24 overflow-hidden rounded-full bg-pink-soft shadow-card"
            >
              <img src={data.avatar} alt="" className="h-full w-full object-cover" />
              <span className="absolute bottom-0 right-0 rounded-full bg-foreground p-1.5 text-background">
                <Camera className="h-3.5 w-3.5" />
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPick(e.target.files?.[0])}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-2 text-sm font-semibold text-foreground"
            >
              Change profile photo
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <Row label="Full Name">
              <input
                value={data.fullName}
                onChange={(e) => setData({ ...data, fullName: e.target.value })}
                className="w-full bg-transparent text-sm text-foreground focus:outline-none"
              />
            </Row>
            <Row label="Username">
              <input
                value={data.username}
                onChange={(e) => setData({ ...data, username: e.target.value })}
                className="w-full bg-transparent text-sm text-foreground focus:outline-none"
              />
            </Row>
            <Row label="Bio">
              <textarea
                value={data.bio}
                onChange={(e) => setData({ ...data, bio: e.target.value })}
                rows={4}
                className="w-full resize-none bg-transparent text-sm text-foreground focus:outline-none"
              />
            </Row>

            <div className="rounded-2xl bg-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {data.isPrivate ? (
                    <Lock className="h-5 w-5 text-foreground" />
                  ) : (
                    <Globe className="h-5 w-5 text-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {data.isPrivate ? "Private Account" : "Public Account"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {data.isPrivate ? "Only approved followers can see your posts." : "Anyone can see your posts."}
                    </p>
                  </div>
                </div>
                <Toggle
                  on={data.isPrivate}
                  onChange={(v) => setData({ ...data, isPrivate: v })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      role="switch"
      aria-checked={on}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-foreground" : "bg-pink-soft"}`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-card shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`}
      />
    </button>
  );
}
