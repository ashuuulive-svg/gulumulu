import { Search as SearchIcon, X } from "lucide-react";
import { useState } from "react";
import { explore } from "@/lib/mock-data";

export function SearchExplore() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2 rounded-full bg-pink-soft px-4 py-2.5">
          <SearchIcon className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </header>

      <div className="grid grid-cols-3 gap-1 p-1">
        {explore.map((src, i) => (
          <button
            key={i}
            onClick={() => setActive(src)}
            className="aspect-square overflow-hidden bg-pink-soft"
          >
            <img
              src={src}
              alt={`Explore ${i + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActive(null)}
        >
          <button
            onClick={() => setActive(null)}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-card p-2"
          >
            <X className="h-5 w-5 text-foreground" />
          </button>
          <img src={active} alt="" className="max-h-full max-w-full rounded-2xl object-contain" />
        </div>
      )}
    </div>
  );
}
