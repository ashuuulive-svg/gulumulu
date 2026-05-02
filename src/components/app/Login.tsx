import { useState } from "react";
import { Sparkles, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

type Mode = "social" | "email-signin" | "email-signup";

export function Login() {
  const [mode, setMode] = useState<Mode>("social");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed", { description: String(result.error?.message ?? result.error) });
      setLoading(false);
      return;
    }
    if (result.redirected) return; // browser will navigate
    // Tokens received — AuthProvider listener will pick it up
    setLoading(false);
  };

  const handleFacebook = () => {
    toast.info("Facebook login coming soon", {
      description: "We're finalising Facebook OAuth setup. For now please use Google or Email.",
    });
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || password.length < 6) {
      toast.error("Enter a valid email and a password of 6+ characters.");
      return;
    }
    setLoading(true);
    if (mode === "email-signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) toast.error("Sign up failed", { description: error.message });
      else toast.success("Check your inbox", { description: "We sent you a confirmation link." });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error("Sign in failed", { description: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-background px-6 py-12">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-pink-200 to-rose-100 shadow-card">
          <Sparkles className="h-10 w-10 text-foreground" strokeWidth={1.6} />
        </div>
        <h1 className="text-3xl font-bold text-foreground">GuluMulu</h1>
        <p className="mt-2 text-sm text-muted-foreground">Soft social, sweetly designed.</p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {mode === "social" && (
          <>
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-card py-3.5 text-sm font-semibold text-foreground shadow-card transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
              Continue with Google
            </button>
            <button
              onClick={handleFacebook}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-[#1877F2] py-3.5 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
            >
              <FacebookIcon />
              Continue with Facebook
            </button>
            <button
              onClick={() => setMode("email-signin")}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-card py-3.5 text-sm font-semibold text-foreground shadow-card"
            >
              <Mail className="h-4 w-4" />
              Continue with Email
            </button>
          </>
        )}

        {mode !== "social" && (
          <form onSubmit={handleEmail} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="w-full rounded-2xl bg-card px-4 py-3 text-sm shadow-card focus:outline-none"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete={mode === "email-signup" ? "new-password" : "current-password"}
              className="w-full rounded-2xl bg-card px-4 py-3 text-sm shadow-card focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-semibold text-background disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "email-signup" ? "Create account" : "Sign in"}
            </button>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <button type="button" onClick={() => setMode("social")} className="font-medium">
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setMode(mode === "email-signup" ? "email-signin" : "email-signup")}
                className="font-medium text-foreground"
              >
                {mode === "email-signup" ? "Have an account? Sign in" : "New here? Create account"}
              </button>
            </div>
          </form>
        )}

        <p className="pt-4 text-center text-xs text-muted-foreground">
          By continuing you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8a12 12 0 1 1 7.9-21l5.7-5.7A20 20 0 1 0 44 24c0-1.2-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.7 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.5 5A20 20 0 0 0 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C41 35 44 30 44 24c0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden>
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/>
    </svg>
  );
}
