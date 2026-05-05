import { useEffect, useRef, useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchActiveStories,
  probeVideoDuration,
  uploadStory,
  STORY_FILE_MAX_BYTES,
  STORY_VIDEO_MAX_SECONDS,
  type StoryGroup,
} from "@/lib/stories";
import { toast } from "sonner";

export function StoryRail({ onOpenUser }: { onOpenUser?: (id: string) => void }) {
  const { user, profile } = useAuth();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [viewing, setViewing] = useState<{ group: StoryGroup; index: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = async () => {
    try {
      setGroups(await fetchActiveStories());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    reload();
    const ch = supabase
      .channel("stories-rail")
      .on("postgres_changes", { event: "*", schema: "public", table: "stories" }, () => reload())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const onPick = async (f?: File) => {
    if (!f || !user) return;
    if (f.size > STORY_FILE_MAX_BYTES) {
      toast.error("File must be under 50 MB");
      return;
    }
    let dur: number | null = null;
    if (f.type.startsWith("video")) {
      try {
        dur = await probeVideoDuration(f);
        if (dur > STORY_VIDEO_MAX_SECONDS + 0.5) {
          toast.error(`Video must be ${STORY_VIDEO_MAX_SECONDS}s or less`);
          return;
        }
      } catch {
        toast.error("Could not read video");
        return;
      }
    }
    setUploading(true);
    try {
      await uploadStory(f, user.id, dur);
      toast.success("Story posted");
      reload();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to post story");
    } finally {
      setUploading(false);
    }
  };

  const myAvatar =
    profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.username ?? "u"}`;

  return (
    <section aria-label="Stories" className="border-b border-border bg-card">
      <div className="flex gap-3 overflow-x-auto px-4 py-3">
        {/* Your story / uploader */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex w-16 flex-col items-center gap-1 disabled:opacity-50"
        >
          <div className="relative h-16 w-16 rounded-full bg-pink-soft p-[2px]">
            <img
              src={myAvatar}
              alt=""
              className="h-full w-full rounded-full border-2 border-card object-cover"
            />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-foreground text-background">
              {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            </span>
          </div>
          <span className="truncate text-[11px] text-foreground">Your story</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0])}
        />

        {groups.map((g) => {
          const av = g.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${g.username}`;
          return (
            <button
              key={g.user_id}
              onClick={() => setViewing({ group: g, index: 0 })}
              className="flex w-16 flex-col items-center gap-1"
            >
              <div className="story-ring h-16 w-16 rounded-full p-[2.5px]">
                <img
                  src={av}
                  alt=""
                  className="h-full w-full rounded-full border-2 border-card object-cover"
                />
              </div>
              <span className="w-full truncate text-center text-[11px] text-foreground">
                {g.username}
              </span>
            </button>
          );
        })}

        {groups.length === 0 && (
          <div className="flex flex-1 items-center pl-1 text-xs text-muted-foreground">
            No stories yet — tap + to share
          </div>
        )}
      </div>

      {viewing && (
        <StoryViewer
          group={viewing.group}
          index={viewing.index}
          onClose={() => setViewing(null)}
          onOpenUser={onOpenUser}
        />
      )}
    </section>
  );
}

function StoryViewer({
  group,
  index,
  onClose,
  onOpenUser,
}: {
  group: StoryGroup;
  index: number;
  onClose: () => void;
  onOpenUser?: (id: string) => void;
}) {
  const [i, setI] = useState(index);
  const item = group.stories[i];

  useEffect(() => {
    if (!item || item.media_type === "video") return;
    const t = setTimeout(() => {
      if (i + 1 < group.stories.length) setI(i + 1);
      else onClose();
    }, 5000);
    return () => clearTimeout(t);
  }, [i, item, group.stories.length, onClose]);

  if (!item) return null;
  const av = group.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${group.username}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="relative flex h-full w-full max-w-md flex-col">
        <div className="flex items-center gap-2 px-3 pt-3">
          {group.stories.map((_, idx) => (
            <div key={idx} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <div className={idx <= i ? "h-full w-full bg-white" : "h-full w-0 bg-white"} />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-3 py-3">
          <button onClick={() => onOpenUser?.(group.user_id)} className="flex items-center gap-2">
            <img src={av} alt="" className="h-8 w-8 rounded-full object-cover" />
            <span className="text-sm font-semibold text-white">{group.username}</span>
          </button>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div
          className="flex flex-1 items-center justify-center"
          onClick={() => {
            if (i + 1 < group.stories.length) setI(i + 1);
            else onClose();
          }}
        >
          {item.media_type === "video" ? (
            <video
              key={item.id}
              src={item.media_url}
              autoPlay
              playsInline
              controls={false}
              onEnded={() => {
                if (i + 1 < group.stories.length) setI(i + 1);
                else onClose();
              }}
              className="max-h-full max-w-full"
            />
          ) : (
            <img src={item.media_url} alt="" className="max-h-full max-w-full object-contain" />
          )}
        </div>
      </div>
    </div>
  );
}
