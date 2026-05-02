import { Home, Search, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tab = "home" | "search" | "chat" | "profile";

const items: { key: Tab; icon: typeof Home; label: string }[] = [
  { key: "home", icon: Home, label: "Home" },
  { key: "search", icon: Search, label: "Search" },
  { key: "chat", icon: MessageCircle, label: "Chat" },
  { key: "profile", icon: User, label: "Profile" },
];

export function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-30 mt-auto w-full border-t border-border bg-card/95 backdrop-blur-md"
    >
      <ul className="mx-auto flex max-w-md items-center justify-around px-2 py-3">
        {items.map(({ key, icon: Icon, label }) => {
          const isActive = active === key;
          return (
            <li key={key}>
              <button
                onClick={() => onChange(key)}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full transition-all",
                  isActive ? "bg-pink-soft scale-110" : "hover:bg-pink-soft/60"
                )}
              >
                <Icon
                  className={cn("h-6 w-6 text-foreground", isActive ? "fill-foreground/10" : "")}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
