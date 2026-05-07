import { useEffect, useRef, useState } from "react";
import { X, Camera, Video, RefreshCcw, Circle, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

const MAX_VIDEO_SECONDS = 60;

export function CameraCapture({
  onCapture,
  onClose,
}: {
  onCapture: (file: File, kind: "image" | "video") => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [mode, setMode] = useState<"image" | "video">("image");
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [recording, setRecording] = useState(false);
  const [secs, setSecs] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const start = async () => {
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: mode === "video",
      });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play().catch(() => {});
      }
    } catch (e) {
      toast.error("Camera permission denied");
      onClose();
    }
  };

  useEffect(() => {
    if (!previewUrl) start();
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing, mode]);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => setSecs((x) => {
      if (x + 1 >= MAX_VIDEO_SECONDS) { stopRecord(); return MAX_VIDEO_SECONDS; }
      return x + 1;
    }), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  const snapPhoto = () => {
    const v = videoRef.current; if (!v) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    c.toBlob((blob) => {
      if (!blob) return;
      const f = new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" });
      setPreviewFile(f);
      setPreviewUrl(URL.createObjectURL(blob));
      streamRef.current?.getTracks().forEach((t) => t.stop());
    }, "image/jpeg", 0.9);
  };

  const startRecord = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";
    const mr = new MediaRecorder(streamRef.current, { mimeType: mime });
    mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const f = new File([blob], `video-${Date.now()}.webm`, { type: "video/webm" });
      setPreviewFile(f);
      setPreviewUrl(URL.createObjectURL(blob));
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    recRef.current = mr;
    mr.start();
    setSecs(0);
    setRecording(true);
  };

  const stopRecord = () => {
    recRef.current?.stop();
    setRecording(false);
  };

  const confirmShot = () => {
    if (!previewFile) return;
    setBusy(true);
    onCapture(previewFile, mode);
  };

  const retake = () => {
    setPreviewUrl(null);
    setPreviewFile(null);
    setSecs(0);
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black">
      <header className="flex items-center justify-between p-3 text-white">
        <button onClick={onClose} aria-label="Close" className="rounded-full bg-white/10 p-2"><X className="h-5 w-5" /></button>
        {!previewUrl && (
          <div className="flex items-center gap-1 rounded-full bg-white/10 p-1">
            {(["image", "video"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${mode === m ? "bg-white text-black" : "text-white"}`}>
                {m === "image" ? <Camera className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
                {m === "image" ? "Photo" : "Video"}
              </button>
            ))}
          </div>
        )}
        <button onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))} aria-label="Switch camera"
          className="rounded-full bg-white/10 p-2"><RefreshCcw className="h-5 w-5" /></button>
      </header>

      <div className="relative flex-1 overflow-hidden bg-black">
        {previewUrl ? (
          mode === "video" ? (
            <video src={previewUrl} className="h-full w-full object-contain" controls autoPlay playsInline />
          ) : (
            <img src={previewUrl} alt="" className="h-full w-full object-contain" />
          )
        ) : (
          <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
        )}
        {recording && (
          <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-destructive px-3 py-1 text-xs font-bold text-white">
            ● {secs}s / {MAX_VIDEO_SECONDS}s
          </div>
        )}
      </div>

      <footer className="flex items-center justify-center gap-8 px-6 py-6 text-white">
        {previewUrl ? (
          <>
            <button onClick={retake} className="rounded-full bg-white/10 px-5 py-3 text-sm font-semibold">Retake</button>
            <button disabled={busy} onClick={confirmShot}
              className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Use
            </button>
          </>
        ) : mode === "image" ? (
          <button onClick={snapPhoto} aria-label="Take photo" className="h-16 w-16 rounded-full border-4 border-white bg-white" />
        ) : recording ? (
          <button onClick={stopRecord} aria-label="Stop"
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-destructive">
            <span className="h-5 w-5 rounded-sm bg-white" />
          </button>
        ) : (
          <button onClick={startRecord} aria-label="Record"
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white">
            <Circle className="h-10 w-10 fill-destructive text-destructive" />
          </button>
        )}
      </footer>
    </div>
  );
}
