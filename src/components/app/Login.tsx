import { Sparkles } from "lucide-react";

export function Login({ onLogin }: { onLogin: () => void }) {
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
        <button
          onClick={onLogin}
          className="flex w-full items-center justify-center gap-3 rounded-full bg-card py-3.5 text-sm font-semibold text-foreground shadow-card transition-transform active:scale-[0.98]"
        >
          <GoogleIcon />
          Continue with Google
        </button>
        <button
          onClick={onLogin}
          className="flex w-full items-center justify-center gap-3 rounded-full bg-[#1877F2] py-3.5 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
        >
          <FacebookIcon />
          Continue with Facebook
        </button>
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
