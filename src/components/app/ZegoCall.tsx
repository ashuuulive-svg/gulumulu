import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const ZEGO_APP_ID = 280341621;
// Using AppSign (kept here per user instruction; for production move to a token server).
const ZEGO_APP_SIGN = "7cd0481dd5eb7bdc5b9195ffad8c938bb8b858";

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

  useEffect(() => {
    let cancelled = false;
    let zp: { destroy?: () => void } | null = null;
    (async () => {
      const mod = await import("@zegocloud/zego-uikit-prebuilt");
      if (cancelled || !containerRef.current) return;
      const ZegoUIKitPrebuilt = mod.ZegoUIKitPrebuilt;
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        ZEGO_APP_ID,
        ZEGO_APP_SIGN,
        roomId,
        userId,
        userName,
      );
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
      onLeave();
    });
    return () => {
      cancelled = true;
      try {
        zp?.destroy?.();
      } catch {
        /* noop */
      }
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
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
