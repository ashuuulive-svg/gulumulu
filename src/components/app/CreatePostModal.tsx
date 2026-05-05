import { useRef, useState } from "react";
import { X, ImagePlus, MapPin, Loader2, Film } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { uploadPostMedia, createPost } from "@/lib/posts";
import { probeVideoDuration } from "@/lib/stories";
import { toast } from "sonner";

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
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = async (f?: File) => {
    if (!f) return;
    if (f.size > POST_FILE_MAX_BYTES) {
      toast.error("File must be under 50 MB");
      return;
    }
    const video = f.type.startsWith("video");
    if (video) {
      try {
        const dur = await probeVideoDuration(f);
        if (dur > POST_VIDEO_MAX_SECONDS + 0.5) {
          toast.error(`Video must be ${POST_VIDEO_MAX_SECONDS}s or less`);
          return;
        }
      } catch {
        toast.error("Could not read video");
        return;
      }
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
                <div className="flex gap-2">
                  <ImagePlus className="h-10 w-10" />
                  <Film className="h-10 w-10" />
                </div>
                <span className="text-sm font-medium">Photo or video (max 60s)</span>
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />

          <div className="mt-4 rounded-2xl bg-card p-4 shadow-card">
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
    </div>
  );
}
