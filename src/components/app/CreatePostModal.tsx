import { useRef, useState } from "react";
import { X, ImagePlus } from "lucide-react";

export function CreatePostModal({
  onClose,
  onShare,
}: {
  onClose: () => void;
  onShare: (data: { image: string; caption: string }) => void;
}) {
  const [image, setImage] = useState<string | undefined>();
  const [caption, setCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = (f?: File) => {
    if (!f) return;
    setImage(URL.createObjectURL(f));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-background sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-pink-soft">
            <X className="h-5 w-5 text-foreground" />
          </button>
          <h2 className="text-base font-semibold text-foreground">New Post</h2>
          <button
            disabled={!image}
            onClick={() => image && onShare({ image, caption })}
            className="rounded-full bg-foreground px-4 py-1.5 text-sm font-semibold text-background disabled:opacity-40"
          >
            Share
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-pink-soft"
          >
            {image ? (
              <img src={image} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImagePlus className="h-10 w-10" />
                <span className="text-sm font-medium">Select from gallery</span>
              </div>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />

          <div className="mt-4 rounded-2xl bg-card p-4 shadow-card">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              rows={3}
              className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
