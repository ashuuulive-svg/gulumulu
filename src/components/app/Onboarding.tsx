import { useState } from "react";
import { Sparkles, ShieldCheck, Lock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const cards = [
  {
    icon: Sparkles,
    title: "Welcome to GuluMulu",
    body: "A soft, kind space to share moments, stories and conversations with people you love.",
    accent: "from-pink-200 to-pink-100",
  },
  {
    icon: ShieldCheck,
    title: "Community Guidelines",
    body: "Be respectful. No hate, harassment, or harmful content. Help us keep GuluMulu safe for everyone.",
    accent: "from-rose-200 to-pink-100",
  },
  {
    icon: Lock,
    title: "Privacy First",
    body: "Your data is encrypted and never sold. You control who sees your profile, posts and stories.",
    accent: "from-pink-200 to-rose-100",
  },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const last = i === cards.length - 1;
  const next = () => (last ? onDone() : setI(i + 1));
  const Card = cards[i];
  const Icon = Card.icon;

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 py-10">
      <div className="flex justify-end">
        {!last && (
          <button onClick={onDone} className="text-sm font-medium text-muted-foreground">
            Skip
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div
          key={i}
          className="w-full max-w-sm rounded-3xl bg-card p-8 text-center shadow-card animate-in fade-in slide-in-from-right-4 duration-300"
        >
          <div className={cn("mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br", Card.accent)}>
            <Icon className="h-10 w-10 text-foreground" strokeWidth={1.8} />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-foreground">{Card.title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{Card.body}</p>
        </div>

        <div className="mt-6 flex items-center gap-2">
          {cards.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              aria-label={`Go to card ${idx + 1}`}
              className={cn(
                "h-2 rounded-full transition-all",
                idx === i ? "w-8 bg-foreground" : "w-2 bg-pink-soft"
              )}
            />
          ))}
        </div>
      </div>

      <button
        onClick={next}
        className="mx-auto flex w-full max-w-sm items-center justify-center gap-2 rounded-full bg-foreground py-4 text-base font-semibold text-background transition-transform active:scale-[0.98]"
      >
        {last ? "Get Started" : "Next"}
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
