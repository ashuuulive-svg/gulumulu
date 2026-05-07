import { useEffect, useRef, useState } from "react";
import { X, Search, Music2, Play, Pause, Loader2, Check } from "lucide-react";
import { searchTracks, type Track } from "@/lib/music";

export function MusicPicker({
  onPick,
  onClose,
}: {
  onPick: (t: Track) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        setResults(await searchTracks(query));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const togglePreview = (t: Track) => {
    if (playing === t.id) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }
    audioRef.current?.pause();
    const a = new Audio(t.previewUrl);
    audioRef.current = a;
    a.play().catch(() => {});
    a.onended = () => setPlaying(null);
    setPlaying(t.id);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-background sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Music2 className="h-4 w-4" /> Add music
          </h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-pink-soft">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="px-4 py-3">
          <div className="flex items-center gap-2 rounded-full bg-pink-soft px-4 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search songs, artists…"
              className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {loading && (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          )}
          {!loading && results.length === 0 && (
            <p className="py-12 text-center text-xs text-muted-foreground">
              {query.trim() ? "No tracks found" : "Type to search music"}
            </p>
          )}
          <ul className="space-y-1">
            {results.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-pink-soft/60">
                <button onClick={() => togglePreview(t)} className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-pink-soft">
                  <img src={t.artworkUrl} alt="" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                    {playing === t.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{t.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.artist}</p>
                </div>
                <button
                  onClick={() => { audioRef.current?.pause(); onPick(t); }}
                  className="flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
                >
                  <Check className="h-3.5 w-3.5" /> Use
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
