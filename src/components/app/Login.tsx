import { useState } from "react";
import { Sparkles, Mail, Lock, User as UserIcon, Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

type Panel = "login" | "register" | "phone";

export function Login() {
  const [panel, setPanel] = useState<Panel>("login");
  const [loading, setLoading] = useState(false);

  const [liEmail, setLiEmail] = useState("");
  const [liPassword, setLiPassword] = useState("");

  const [rEmail, setREmail] = useState("");
  const [rPassword, setRPassword] = useState("");
  const [rConfirm, setRConfirm] = useState("");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const sendOtp = async () => {
    if (!/^\+\d{8,15}$/.test(phone)) { toast.error("Enter phone in international format e.g. +14155552671"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setLoading(false);
    if (error) toast.error("Failed to send code", { description: error.message });
    else { setOtpSent(true); toast.success("Code sent via SMS"); }
  };
  const verifyOtp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
    setLoading(false);
    if (error) toast.error("Invalid code", { description: error.message });
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed", {
        description: String(result.error?.message ?? result.error),
      });
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    setLoading(false);
  };

  const handleFacebook = () => {
    toast.info("Facebook login coming soon", {
      description: "Please use Google or Email for now.",
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liEmail || liPassword.length < 6) {
      toast.error("Enter a valid email and a password of 6+ characters.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: liEmail,
      password: liPassword,
    });
    if (error) toast.error("Sign in failed", { description: error.message });
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rEmail || rPassword.length < 6) {
      toast.error("Enter a valid email and a password of 6+ characters.");
      return;
    }
    if (rPassword !== rConfirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: rEmail,
      password: rPassword,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) toast.error("Sign up failed", { description: error.message });
    else
      toast.success("Check your inbox 💌", {
        description: "We sent you a confirmation link.",
      });
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-5 py-10">
      {/* Decorative blobs using app pink tokens */}
      <div className="pointer-events-none absolute -top-24 -left-20 h-64 w-64 rounded-full bg-pink-soft/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-accent/60 blur-3xl" />

      {/* Mascot / Logo */}
      <div className="z-10 mb-6 flex flex-col items-center animate-fade-in">
        <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-pink-soft to-accent shadow-card">
          <Sparkles className="h-10 w-10 text-foreground" strokeWidth={1.8} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Gulumulu</h1>
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          Soft social, sweetly designed
        </p>
      </div>

      {/* Sliding card */}
      <div className="z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card shadow-card">
        {/* Tab switcher */}
        <div className="relative m-3 grid grid-cols-2 rounded-full bg-secondary p-1">
          <span
            className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-foreground shadow transition-transform duration-500 ease-in-out"
            style={{ transform: panel === "login" ? "translateX(0%)" : "translateX(100%)" }}
            aria-hidden
          />
          <button
            onClick={() => setPanel("login")}
            className={`relative z-10 rounded-full py-2 text-sm font-semibold transition-colors duration-300 ${
              panel === "login" ? "text-background" : "text-foreground"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setPanel("register")}
            className={`relative z-10 rounded-full py-2 text-sm font-semibold transition-colors duration-300 ${
              panel === "register" ? "text-background" : "text-foreground"
            }`}
          >
            Register
          </button>
        </div>
        <div className="mx-3 mb-2">
          <button
            onClick={() => setPanel("phone")}
            className={`w-full rounded-full py-2 text-xs font-semibold ${panel === "phone" ? "bg-foreground text-background" : "bg-secondary text-foreground"}`}
          >
            <Phone className="mr-1 inline h-3 w-3" /> Use phone number
          </button>
        </div>
        {panel === "phone" && (
          <div className="px-5 pb-6 pt-2 space-y-3">
            <PinkInput icon={<Phone className="h-4 w-4" />} type="tel" placeholder="+14155552671" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={otpSent} />
            {otpSent && <PinkInput icon={<Lock className="h-4 w-4" />} type="text" inputMode="numeric" placeholder="6-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} />}
            <PrimaryButton loading={loading} onClick={otpSent ? verifyOtp : sendOtp}>
              {otpSent ? "Verify code" : "Send SMS code"}
            </PrimaryButton>
            {otpSent && <button onClick={() => { setOtpSent(false); setOtp(""); }} className="w-full text-xs text-muted-foreground">Use a different number</button>}
          </div>
        )}
        {panel !== "phone" && (

        {/* Slide track */}
        <div className="overflow-hidden">
          <div
            className="flex w-[200%] transition-transform duration-[600ms] ease-in-out"
            style={{ transform: panel === "login" ? "translateX(0%)" : "translateX(-50%)" }}
          >
            {/* Login Panel */}
            <div className="w-1/2 px-5 pb-6 pt-2">
              <form onSubmit={handleLogin} className="space-y-3">
                <PinkInput
                  icon={<Mail className="h-4 w-4" />}
                  type="email"
                  placeholder="Email"
                  value={liEmail}
                  onChange={(e) => setLiEmail(e.target.value)}
                  autoComplete="email"
                />
                <PinkInput
                  icon={<Lock className="h-4 w-4" />}
                  type="password"
                  placeholder="Password"
                  value={liPassword}
                  onChange={(e) => setLiPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <PrimaryButton loading={loading} type="submit">
                  Sign in
                </PrimaryButton>
              </form>

              <Divider />

              <SocialButtons onGoogle={handleGoogle} onFacebook={handleFacebook} loading={loading} />
            </div>

            {/* Register Panel */}
            <div className="w-1/2 px-5 pb-6 pt-2">
              <form onSubmit={handleRegister} className="space-y-3">
                <PinkInput
                  icon={<Mail className="h-4 w-4" />}
                  type="email"
                  placeholder="Email"
                  value={rEmail}
                  onChange={(e) => setREmail(e.target.value)}
                  autoComplete="email"
                />
                <PinkInput
                  icon={<Lock className="h-4 w-4" />}
                  type="password"
                  placeholder="Password (6+ chars)"
                  value={rPassword}
                  onChange={(e) => setRPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <PinkInput
                  icon={<UserIcon className="h-4 w-4" />}
                  type="password"
                  placeholder="Confirm password"
                  value={rConfirm}
                  onChange={(e) => setRConfirm(e.target.value)}
                  autoComplete="new-password"
                />
                <PrimaryButton loading={loading} type="submit">
                  Create account
                </PrimaryButton>
              </form>

              <Divider />

              <SocialButtons onGoogle={handleGoogle} onFacebook={handleFacebook} loading={loading} />
            </div>
          </div>
        </div>
        )}
      </div>

      <p className="z-10 mt-6 max-w-xs text-center text-[11px] text-muted-foreground">
        By continuing you agree to our Terms & Privacy Policy.
      </p>
    </div>
  );
}

function PinkInput({
  icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) {
  return (
    <div className="group relative flex items-center">
      <span className="absolute left-3.5 text-muted-foreground transition-colors group-focus-within:text-foreground">
        {icon}
      </span>
      <input
        {...props}
        className="w-full rounded-full border-2 border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-foreground focus:outline-none focus:ring-4 focus:ring-pink-soft"
      />
    </div>
  );
}

function PrimaryButton({
  children,
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-semibold text-background shadow-card transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div className="my-4 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        or
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function SocialButtons({
  onGoogle,
  onFacebook,
  loading,
}: {
  onGoogle: () => void;
  onFacebook: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-2">
      <button
        onClick={onGoogle}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-border bg-card py-3 text-sm font-semibold text-foreground transition-all hover:border-foreground hover:bg-secondary active:scale-[0.98] disabled:opacity-60"
      >
        <GoogleIcon />
        Continue with Google
      </button>
      <button
        onClick={onFacebook}
        className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-border bg-card py-3 text-sm font-semibold text-foreground transition-all hover:border-foreground hover:bg-secondary active:scale-[0.98]"
      >
        <FacebookIcon />
        Continue with Facebook
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8a12 12 0 1 1 7.9-21l5.7-5.7A20 20 0 1 0 44 24c0-1.2-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.7 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.5 5A20 20 0 0 0 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C41 35 44 30 44 24c0-1.2-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2" aria-hidden>
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z" />
    </svg>
  );
}
