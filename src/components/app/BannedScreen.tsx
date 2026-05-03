import { ShieldAlert, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function BannedScreen() {
  const { profile, signOut } = useAuth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-soft via-background to-pink-soft px-4">
      <div className="w-full max-w-sm rounded-3xl bg-card p-8 text-center shadow-card">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-ring to-destructive text-white shadow-card">
          <ShieldAlert className="h-10 w-10" strokeWidth={2.5} />
        </div>

        <p className="mt-5 font-serif text-xl italic tracking-tight text-foreground">
          GuluMulu Team
        </p>

        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-destructive">
          ID IS BANNED
        </h1>

        <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
          @{profile?.username}
        </p>

        <div className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-destructive">
            Reason for ban
          </p>
          <p className="mt-1.5 whitespace-pre-line text-sm text-foreground">
            {profile?.ban_reason?.trim() || "Violation of community guidelines."}
          </p>
        </div>

        <p className="mt-5 text-xs text-muted-foreground">
          If you believe this is a mistake, contact GuluMulu support.
        </p>

        <button
          onClick={signOut}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-semibold text-background transition active:scale-95"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </main>
  );
}
