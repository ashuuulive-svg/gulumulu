import { Home, Search, MessageCircle, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tab = "home" | "search" | "create" | "chat" | "profile";

const items: { key: Tab; icon: typeof Home; label: string }[] = [
  { key: "home", icon: Home, label: "Home" },
  { key: "search", icon: Search, label: "Search" },
  { key: "create", icon: Plus, label: "Create" },
  { key: "chat", icon: MessageCircle, label: "Chat" },
  { key: "profile", icon: User, label: "Profile" },
];

export function BottomNav({
  active,
  onChange,
  onCreate,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  onCreate: () => void;
}) {
  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-30 mt-auto w-full border-t border-border bg-card/95 backdrop-blur-md"
    >
      <ul className="mx-auto flex max-w-md items-center justify-around px-2 py-2.5">
        {items.map(({ key, icon: Icon, label }) => {
          const isCreate = key === "create";
          const isActive = active === key;

          if (isCreate) {
            return (
              <li key={key}>
                <button
                  onClick={onCreate}
                  aria-label="Create post"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-ring to-destructive text-white shadow-card transition-transform active:scale-95"
                >
                  <Plus className="h-7 w-7" strokeWidth={2.5} />
                </button>
              </li>
            );
          }

          return (
            <li key={key}>
              <button
                onClick={() => onChange(key)}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full transition-all",
                  isActive ? "bg-pink-soft scale-110" : "hover:bg-pink-soft/60",
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
