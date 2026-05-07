import { useRef, useState } from "react";
import { X, ImagePlus, MapPin, Loader2, Film, Camera, Music2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { uploadPostMedia, createPost } from "@/lib/posts";
import { probeVideoDuration } from "@/lib/stories";
import { toast } from "sonner";
import { CameraCapture } from "./CameraCapture";
import { MusicPicker } from "./MusicPicker";
import type { Track } from "@/lib/music";

const POST_VIDEO_MAX_SECONDS = 60;
const POST_FILE_MAX_BYTES = 50 * 1024 * 1024;

export function CreatePostModal({
  onClose,
  onShared,
}: {
  onClose: () => void;
  onShared?: () => void;
}) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | undefined>();
  const [preview, setPreview] = useState<string | undefined>();
  const [isVideo, setIsVideo] = useState(false);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [music, setMusic] = useState<Track | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const acceptFile = async (f: File) => {
    if (f.size > POST_FILE_MAX_BYTES) { toast.error("File must be under 50 MB"); return; }
    const video = f.type.startsWith("video");
    if (video) {
      try {
        const dur = await probeVideoDuration(f);
        if (dur > POST_VIDEO_MAX_SECONDS + 0.5) { toast.error(`Video must be ${POST_VIDEO_MAX_SECONDS}s or less`); return; }
      } catch { toast.error("Could not read video"); return; }
    }
    setFile(f);
    setIsVideo(video);
    setPreview(URL.createObjectURL(f));
  };

  const onShare = async () => {
    if (!file || !user) return;
    setBusy(true);
    try {
      const url = await uploadPostMedia(file, user.id);
      await createPost({
        authorId: user.id,
        imageUrl: url,
        mediaType: isVideo ? "video" : "image",
        caption: caption.trim(),
        location: location.trim() || null,
        music: music
          ? { title: music.title, artist: music.artist, previewUrl: music.previewUrl, artworkUrl: music.artworkUrl }
          : null,
      });
      toast.success("Post shared");
      onShared?.();
      onClose();
    } catch (e: unknown) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to share post");
    } finally {
      setBusy(false);
    }
  };

  if (showCamera) {
    return (
      <CameraCapture
        onCapture={(f, kind) => { setShowCamera(false); setIsVideo(kind === "video"); setFile(f); setPreview(URL.createObjectURL(f)); }}
        onClose={() => setShowCamera(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-background sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <button onClick={onClose} aria-label="Close" disabled={busy} className="rounded-full p-1.5 hover:bg-pink-soft disabled:opacity-40">
            <X className="h-5 w-5 text-foreground" />
          </button>
          <h2 className="text-base font-semibold text-foreground">New Post</h2>
          <button
            disabled={!file || busy}
            onClick={onShare}
            className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 text-sm font-semibold text-background disabled:opacity-40"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Share
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="relative">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-pink-soft"
            >
              {preview ? (
                isVideo ? (
                  <video src={preview} className="h-full w-full object-cover" controls playsInline />
                ) : (
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                )
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <div className="flex gap-2"><ImagePlus className="h-10 w-10" /><Film className="h-10 w-10" /></div>
                  <span className="text-sm font-medium">Photo or video (max 60s)</span>
                </div>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              aria-label="Open camera"
              className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-foreground/90 px-3 py-2 text-xs font-semibold text-background shadow-card backdrop-blur"
            >
              <Camera className="h-4 w-4" /> Camera
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) acceptFile(f); }}
          />

          <button
            type="button"
            onClick={() => setShowMusic(true)}
            className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-card hover:bg-pink-soft/40"
          >
            {music ? (
              <>
                <img src={music.artworkUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{music.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{music.artist}</p>
                </div>
                <span onClick={(e) => { e.stopPropagation(); setMusic(null); }} className="text-xs text-destructive">Remove</span>
              </>
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-soft"><Music2 className="h-5 w-5" /></div>
                <div className="flex-1"><p className="text-sm font-semibold text-foreground">Add music</p>
                  <p className="text-xs text-muted-foreground">Pick a song to overlay your post</p></div>
              </>
            )}
          </button>

          <div className="mt-3 rounded-2xl bg-card p-4 shadow-card">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              rows={3}
              maxLength={2000}
              className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-card">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location"
              maxLength={120}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>
      </div>

      {showMusic && <MusicPicker onClose={() => setShowMusic(false)} onPick={(t) => { setMusic(t); setShowMusic(false); }} />}
    </div>
  );
}
