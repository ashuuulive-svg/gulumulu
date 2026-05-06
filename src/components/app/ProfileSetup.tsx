import { useEffect, useRef, useState } from "react";
import { Camera, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";

export function ProfileSetup({ onDone }: { onDone: () => void }) {
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>();

  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Pre-fill from existing profile (auto-created on signup)
  useEffect(() => {
    if (!profile) return;
    if (!username) setUsername(profile.username);
    if (!fullName) setFullName(profile.full_name ?? "");
    if (!avatarPreview && profile.avatar_url) setAvatarPreview(profile.avatar_url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Live username availability check (debounced)
  useEffect(() => {
    if (username.length < 3) {
      setAvailable(null);
      return;
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      setAvailable(false);
      return;
    }
    setChecking(true);
    const t = setTimeout(async () => {
      // If unchanged from current profile username, treat as available
      if (profile && username.toLowerCase() === profile.username.toLowerCase()) {
        setAvailable(true);
        setChecking(false);
        return;
      }
      const { data, error } = await supabase.rpc("username_available", { _username: username });
      setAvailable(!error && !!data);
      setChecking(false);
    }, 350);
    return () => clearTimeout(t);
  }, [username, profile]);

  const onPickAvatar = (f?: File) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Image too large", { description: "Please choose an image under 5 MB." });
      return;
    }
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  };

  const finish = async () => {
    if (!user) return;
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
        const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
        avatar_url = pub.publicUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          username,
          full_name: fullName || null,
          bio: bio || "",
          gender: (gender || null) as Gender | null,
          avatar_url,
        })
        .eq("id", user.id);
      if (error) throw error;

      await refreshProfile();
      toast.success("Profile ready!");
      onDone();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Could not save profile", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  const usernameRegex = /^[a-z0-9_]{3,24}$/;
  const usernameOk = usernameRegex.test(username);
  const fullNameOk = fullName.trim().length > 0;
  const canStep1 = usernameOk && available === true && fullNameOk;
  const canStep2 = true;
  const canStep3 = true;

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 py-10">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Set up your profile</h1>
        <span className="text-xs text-muted-foreground">Step {step} of 3</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {step === 1 && "Username (lowercase + underscores only) and a Display Name are required."}
        {step === 2 && "Add a profile picture (you can skip)."}
        {step === 3 && "Tell us a bit about yourself."}
      </p>

      <div className="mt-2 flex gap-1.5">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${s <= step ? "bg-foreground" : "bg-pink-soft"}`}
          />
        ))}
      </div>

      <div className="mt-8 flex-1">
        {step === 1 && (
          <div className="space-y-4">
            <Field label="Unique Username">
              <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-card">
                <span className="text-sm text-muted-foreground">@</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="yourname"
                  maxLength={24}
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                {checking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                {!checking && available === true && <Check className="h-4 w-4 text-green-600" />}
                {!checking && available === false && <X className="h-4 w-4 text-destructive" />}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {username.length === 0 && "3–24 chars · letters, numbers, underscore"}
                {username.length > 0 && username.length < 3 && "At least 3 characters."}
                {username.length >= 3 && available === false && "Sorry, that username is taken."}
                {username.length >= 3 && available === true && "Great, this username is available!"}
              </p>
            </Field>

            <Field label="Full Name (optional)">
              <div className="rounded-2xl bg-card px-4 py-3 shadow-card">
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  maxLength={60}
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center">
            <button
              onClick={() => fileRef.current?.click()}
              className="relative h-32 w-32 overflow-hidden rounded-full bg-pink-soft shadow-card"
              aria-label="Upload display picture"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Camera className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
              <span className="absolute bottom-1 right-1 rounded-full bg-foreground p-2 text-background">
                <Camera className="h-4 w-4" />
              </span>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickAvatar(e.target.files?.[0])}
            />
            <p className="mt-3 text-xs text-muted-foreground">Tap to upload (max 5 MB)</p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Field label="Bio">
              <div className="rounded-2xl bg-card px-4 py-3 shadow-card">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A line or two about you"
                  rows={3}
                  maxLength={150}
                  className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <p className="mt-1 text-right text-[10px] text-muted-foreground">{bio.length}/150</p>
              </div>
            </Field>

            <Field label="Gender">
              <div className="grid grid-cols-2 gap-2">
                {([
                  { v: "female", l: "Female" },
                  { v: "male", l: "Male" },
                  { v: "non_binary", l: "Non-binary" },
                  { v: "prefer_not_to_say", l: "Prefer not to say" },
                ] as const).map((o) => (
                  <button
                    key={o.v}
                    onClick={() => setGender(o.v)}
                    className={`rounded-2xl px-3 py-2.5 text-sm font-medium shadow-card transition-colors ${
                      gender === o.v ? "bg-foreground text-background" : "bg-card text-foreground"
                    }`}
                  >
                    {o.l}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}
      </div>

      <div className="space-y-2 pt-6">
        <button
          disabled={(step === 1 && !canStep1) || (step === 2 && !canStep2) || (step === 3 && !canStep3) || saving}
          onClick={() => {
            if (step < 3) setStep((step + 1) as 2 | 3);
            else finish();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-4 text-base font-semibold text-background transition-opacity disabled:opacity-40"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {step < 3 ? "Continue" : saving ? "Saving…" : "Finish"}
        </button>
        {step > 1 && (
          <button
            onClick={() => setStep((step - 1) as 1 | 2)}
            className="w-full rounded-full py-2 text-sm font-medium text-muted-foreground"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
