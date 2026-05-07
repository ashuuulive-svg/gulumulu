// iTunes Search API (no key required) — 30s preview clips
export type Track = {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string;
  previewUrl: string;
};

export async function searchTracks(query: string): Promise<Track[]> {
  const q = query.trim();
  if (!q) return [];
  const url = `https://itunes.apple.com/search?media=music&limit=25&term=${encodeURIComponent(q)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("Music search failed");
  const j = (await r.json()) as {
    results: Array<{
      trackId: number;
      trackName: string;
      artistName: string;
      artworkUrl100: string;
      previewUrl: string;
    }>;
  };
  return (j.results ?? [])
    .filter((t) => !!t.previewUrl)
    .map((t) => ({
      id: String(t.trackId),
      title: t.trackName,
      artist: t.artistName,
      artworkUrl: t.artworkUrl100,
      previewUrl: t.previewUrl,
    }));
}
