import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function ZegoCall({
  roomId,
  userId,
  userName,
  mode,
  onLeave,
}: {
  roomId: string;
  userId: string;
  userName: string;
  mode: "voice" | "video";
  onLeave: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let zp: { destroy?: () => void } | null = null;
    (async () => {
      // 1) Get a server-issued token tied to this user
      const { data, error } = await supabase.functions.invoke("zego-token", {});
      if (cancelled) return;
      if (error || !data?.token || !data?.appId) {
        // Fallback: kit token for test (still works for two clients with the same room)
        console.warn("Zego token fallback", error);
      }

      const mod = await import("@zegocloud/zego-uikit-prebuilt");
      const zimMod = await import("zego-zim-web");
      if (cancelled || !containerRef.current) return;
      const ZegoUIKitPrebuilt = mod.ZegoUIKitPrebuilt;
      try { (ZegoUIKitPrebuilt as unknown as { addPlugins: (p: { ZIM: unknown }) => void }).addPlugins({ ZIM: (zimMod as { ZIM: unknown }).ZIM }); } catch (e) { console.warn("ZIM plugin add failed", e); }

      let kitToken: string;
      if (data?.token && data?.appId) {
        kitToken = ZegoUIKitPrebuilt.generateKitTokenForProduction(
          Number(data.appId),
          data.token,
          roomId,
          userId,
          userName,
        );
      } else {
        // Test fallback only — guarantees both peers join same room with public AppSign
        kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          280341621,
          "7cd0481dd5eb7bdc5b9195ffad8c938bb8b858",
          roomId,
          userId,
          userName,
        );
      }

      const instance = ZegoUIKitPrebuilt.create(kitToken);
      zp = instance as unknown as { destroy?: () => void };
      instance.joinRoom({
        container: containerRef.current,
        scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
        turnOnCameraWhenJoining: mode === "video",
        turnOnMicrophoneWhenJoining: true,
        showMyCameraToggleButton: mode === "video",
        showAudioVideoSettingsButton: true,
        showScreenSharingButton: false,
        showTextChat: false,
        showUserList: false,
        maxUsers: 2,
        layout: "Auto",
        showLayoutButton: false,
        onLeaveRoom: () => onLeave(),
      });
    })().catch((e) => {
      console.error("Zego init failed:", e);
      setError(String(e?.message ?? e));
    });
    return () => {
      cancelled = true;
      try { zp?.destroy?.(); } catch { /* noop */ }
    };
  }, [roomId, userId, userName, mode, onLeave]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <button
        onClick={onLeave}
        aria-label="End call"
        className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white"
      >
        <X className="h-5 w-5" />
      </button>
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <p className="text-sm">Call failed: {error}</p>
        </div>
      )}
      {!error && (
        <div ref={containerRef} className="h-full w-full">
          <div className="flex h-full items-center justify-center text-white">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
}
