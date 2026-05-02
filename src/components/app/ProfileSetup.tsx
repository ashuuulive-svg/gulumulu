import { useRef, useState } from "react";
import { Camera, Check } from "lucide-react";

export function ProfileSetup({ onDone }: { onDone: (data: { username: string; fullName: string; avatar?: string }) => void }) {
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatar, setAvatar] = useState<string | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = (f?: File) => {
    if (!f) return;
    const url = URL.createObjectURL(f);
    setAvatar(url);
  };

  const valid = username.trim().length >= 3 && fullName.trim().length >= 2;

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 py-10">
      <h1 className="text-2xl font-bold text-foreground">Set up your profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">A few details so friends can find you.</p>

      <div className="mt-8 flex flex-col items-center">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative h-28 w-28 overflow-hidden rounded-full bg-pink-soft shadow-card"
          aria-label="Upload display picture"
        >
          {avatar ? (
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <span className="absolute bottom-1 right-1 rounded-full bg-foreground p-1.5 text-background">
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
        <p className="mt-3 text-xs text-muted-foreground">Tap to upload your photo</p>
      </div>

      <div className="mt-8 space-y-4">
        <Field label="Unique Username">
          <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-card">
            <span className="text-sm text-muted-foreground">@</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, "_"))}
              placeholder="yourname"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {username.length >= 3 && <Check className="h-4 w-4 text-online" />}
          </div>
        </Field>

        <Field label="Full Name">
          <div className="rounded-2xl bg-card px-4 py-3 shadow-card">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </Field>
      </div>

      <div className="mt-auto pt-8">
        <button
          disabled={!valid}
          onClick={() => onDone({ username, fullName, avatar })}
          className="w-full rounded-full bg-foreground py-4 text-base font-semibold text-background transition-opacity disabled:opacity-40"
        >
          Continue
        </button>
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
