import { X, Pin } from "lucide-react";
import { useState } from "react";
import { profile } from "@/lib/mock-data";

export function ArchiveSheet({ onClose }: { onClose: () => void }) {
  const [pinned, setPinned] = useState<string[]>([]);
  const archives = profile.grid.slice(0, 6);

  const toggle = (src: string) =>
    setPinned((p) => (p.includes(src) ? p.filter((s) => s !== src) : [...p, src]));

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40">
      <div className="flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-3xl bg-background">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-pink-soft">
            <X className="h-5 w-5 text-foreground" />
          </button>
          <h2 className="text-base font-semibold text-foreground">Archives & Highlights</h2>
          <span className="w-7" />
        </header>

        <div className="overflow-y-auto p-4">
          <p className="mb-3 text-xs text-muted-foreground">
            Stories from the past 24h are saved here. Tap any to pin it as a Highlight on your profile.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {archives.map((src) => {
              const isPinned = pinned.includes(src);
              return (
                <button
                  key={src}
                  onClick={() => toggle(src)}
                  className="relative aspect-[3/4] overflow-hidden rounded-xl bg-pink-soft"
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <span
                    className={`absolute right-1.5 top-1.5 rounded-full p-1.5 ${isPinned ? "bg-foreground text-background" : "bg-card/80 text-foreground"}`}
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </span>
                </button>
              );
            })}
          </div>

          {pinned.length > 0 && (
            <p className="mt-4 text-center text-xs font-medium text-foreground">
              {pinned.length} pinned to Highlights
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
