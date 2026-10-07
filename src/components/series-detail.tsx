"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Play, Loader2 } from "lucide-react";
import type { XtreamCredentials, SeriesItem, SeriesInfo } from "@/lib/xtream";
import { Xtream } from "@/lib/xtream";
import { VideoPlayer } from "./video-player";

interface SeriesDetailProps {
  creds: XtreamCredentials;
  series: SeriesItem;
  onClose: () => void;
}

export function SeriesDetail({ creds, series, onClose }: SeriesDetailProps) {
  const [info, setInfo] = useState<SeriesInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSeason, setActiveSeason] = useState<string>("");
  const [playing, setPlaying] = useState<{
    episodeId: string;
    container: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Xtream.getSeriesInfo(creds, series.series_id)
      .then((data) => {
        if (cancelled) return;
        setInfo(data);
        const firstSeason = Object.keys(data?.episodes || {})[0];
        if (firstSeason) setActiveSeason(firstSeason);
      })
      .catch((err) => console.error("Series info error:", err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [creds, series.series_id]);

  const seasons = info ? Object.keys(info.episodes || {}) : [];
  const episodes = info && activeSeason ? info.episodes[activeSeason] || [] : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[90vh] bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-zinc-800">
          <div className="flex gap-4 min-w-0">
            {series.cover && (
              <img
                src={series.cover}
                alt={series.name}
                className="w-20 h-28 object-cover rounded-md flex-shrink-0 bg-zinc-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            )}
            <div className="min-w-0">
              <h2 className="text-white text-lg font-semibold truncate">{series.name}</h2>
              {series.genre && (
                <p className="text-xs text-zinc-400 mt-1">{series.genre}</p>
              )}
              {series.rating && parseFloat(series.rating) > 0 && (
                <p className="text-xs text-amber-500 mt-1">
                  ★ {parseFloat(series.rating).toFixed(1)}
                </p>
              )}
              {series.plot && (
                <p className="text-xs text-zinc-400 mt-2 line-clamp-3">{series.plot}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-zinc-400 hover:text-white flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 flex">
          {/* Seasons */}
          {seasons.length > 0 && (
            <div className="w-32 sm:w-40 border-r border-zinc-800 flex-shrink-0">
              <ScrollArea className="h-full max-h-[60vh]">
                <div className="p-2 space-y-0.5">
                  <p className="px-2 py-1 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                    Seasons
                  </p>
                  {seasons.map((s) => (
                    <button
                      key={s}
                      onClick={() => setActiveSeason(s)}
                      className={`w-full text-left px-2 py-1.5 rounded text-sm ${
                        activeSeason === s
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                      }`}
                    >
                      Season {s}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Episodes */}
          <div className="flex-1 min-w-0">
            <ScrollArea className="h-full max-h-[60vh]">
              <div className="p-4">
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full bg-zinc-800" />
                    ))}
                  </div>
                ) : episodes.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-10">
                    No episodes in this season.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {episodes.map((ep) => (
                      <li key={ep.id}>
                        <button
                          onClick={() =>
                            setPlaying({
                              episodeId: ep.id,
                              container: ep.container_extension || "mp4",
                              title: `S${activeSeason}E${ep.episode_num} — ${ep.title || series.name}`,
                            })
                          }
                          className="w-full text-left flex items-center gap-3 p-2 rounded-md hover:bg-zinc-800 transition group"
                        >
                          <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-500 group-hover:text-white transition">
                            <Play className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                              <span className="text-zinc-500 mr-1.5">
                                E{ep.episode_num}
                              </span>
                              {ep.title || `${series.name} - Episode ${ep.episode_num}`}
                            </p>
                            {ep.info?.plot && (
                              <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                                {ep.info.plot}
                              </p>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Inline player */}
        {playing && (
          <div className="border-t border-zinc-800 p-4 bg-black">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white text-sm font-medium truncate">{playing.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPlaying(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <VideoPlayer
              src={Xtream.seriesStreamUrl(creds, playing.episodeId, playing.container)}
              mode="auto"
              title={playing.title}
              onClose={() => setPlaying(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
