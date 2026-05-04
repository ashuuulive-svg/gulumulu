import { Search as SearchIcon, BadgeCheck, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { searchUsers, type UserSearchResult } from "@/lib/users";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function SearchExplore({ onOpenUser }: { onOpenUser: (userId: string) => void }) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [explore, setExplore] = useState<{ id: string; image_url: string; author_id: string }[]>([]);

  // Load recent posts as the explore grid
  useEffect(() => {
    supabase
      .from("posts")
      .select("id, image_url, author_id")
      .order("created_at", { ascending: false })
      .limit(60)
      .then(({ data }) => setExplore(data ?? []));
  }, []);

  // Debounced search
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchUsers(q, user?.id);
        setResults(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, user?.id]);

  const showingResults = query.trim().length > 0;

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2 rounded-full bg-pink-soft px-4 py-2.5">
          <SearchIcon className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by name or @username"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </header>

      {showingResults ? (
        <div className="flex-1">
          {!loading && results.length === 0 && (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">
              No users found for "{query}"
            </p>
          )}
          <ul className="divide-y divide-border">
            {results.map((u) => {
              const avatar =
                u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.username}`;
              return (
                <li key={u.id}>
                  <button
                    onClick={() => onOpenUser(u.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-pink-soft/50"
                  >
                    <img src={avatar} alt="" className="h-11 w-11 rounded-full bg-pink-soft object-cover" />
                    <div className="flex-1 leading-tight">
                      <p className="flex items-center gap-1 text-sm font-semibold text-foreground">
                        {u.username}
                        {u.is_verified && <BadgeCheck className="h-3.5 w-3.5 fill-sky-500 text-white" />}
                      </p>
                      {u.full_name && (
                        <p className="text-xs text-muted-foreground">{u.full_name}</p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5 p-0.5">
          {explore.length === 0 && (
            <p className="col-span-3 px-4 py-12 text-center text-sm text-muted-foreground">
              No posts to explore yet
            </p>
          )}
          {explore.map((p) => (
            <button
              key={p.id}
              onClick={() => onOpenUser(p.author_id)}
              className="aspect-square overflow-hidden bg-pink-soft"
            >
              <img
                src={p.image_url}
                alt=""
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
