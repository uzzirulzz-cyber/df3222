"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Loader2, AlertCircle } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  /** "hls" | "mp4" | "auto" — auto detects by URL extension */
  mode?: "hls" | "mp4" | "auto";
  poster?: string;
  title?: string;
  onClose?: () => void;
}

export function VideoPlayer({
  src,
  mode = "auto",
  poster,
  title,
  onClose,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);

    const isHls =
      mode === "hls" || (mode === "auto" && /\.m3u8(\?|$)/i.test(src));

    let cleanup = () => {};

    if (isHls) {
      // Safari has native HLS
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        cleanup = () => {
          video.removeAttribute("src");
          video.load();
        };
      } else if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 60,
        });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                setError(`Playback error: ${data.details}`);
                hls.destroy();
                break;
            }
          }
        });
        cleanup = () => {
          hls.destroy();
          hlsRef.current = null;
        };
      } else {
        setError("HLS not supported in this browser");
      }
    } else {
      video.src = src;
      cleanup = () => {
        video.removeAttribute("src");
        video.load();
      };
    }

    const onLoaded = () => setLoading(false);
    const onError = () => {
      setLoading(false);
      setError("Failed to load stream");
    };
    const onPlaying = () => setLoading(false);

    video.addEventListener("loadeddata", onLoaded);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("error", onError);

    return () => {
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", onError);
      cleanup();
    };
  }, [src, mode]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        poster={poster}
        controls
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 text-white p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-sm">{error}</p>
          {onClose && (
            <button
              onClick={onClose}
              className="mt-2 px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 text-sm"
            >
              Close
            </button>
          )}
        </div>
      )}
      {title && !error && (
        <div className="absolute top-0 left-0 right-0 px-4 py-2 bg-gradient-to-b from-black/70 to-transparent text-white text-sm font-medium pointer-events-none">
          {title}
        </div>
      )}
    </div>
  );
}
