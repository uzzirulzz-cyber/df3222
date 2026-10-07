"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { X, Calendar, Radio, AlertCircle } from "lucide-react";
import type { XtreamCredentials, LiveStream, EpgProgram } from "@/lib/xtream";
import { Xtream } from "@/lib/xtream";

interface EpgModalProps {
  creds: XtreamCredentials;
  stream: LiveStream;
  onClose: () => void;
}

function parseEpgTime(raw: string): Date | null {
  if (!raw) return null;
  // Xtream returns epoch seconds as a string in `start`/`end` for some panels,
  // and ISO 8601 for others. Try both.
  const n = Number(raw);
  if (!Number.isNaN(n) && n > 0) {
    // epoch seconds (10 digits) vs epoch ms (13 digits)
    return new Date(n * (raw.length === 10 ? 1000 : 1));
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatTime(d: Date): string {
  return d.toLocaleString(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isActiveNow(prog: EpgProgram): boolean {
  const now = Date.now();
  const start = parseEpgTime(prog.start)?.getTime();
  const end = parseEpgTime(prog.end)?.getTime();
  if (!start || !end) return false;
  return now >= start && now < end;
}

export function EpgModal({ creds, stream, onClose }: EpgModalProps) {
  const [programs, setPrograms] = useState<EpgProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    Xtream.getShortEpg(creds, stream.stream_id, 20)
      .then((res) => {
        if (cancelled) return;
        setPrograms(res?.epg_listings || []);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Unknown error";
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [creds, stream.stream_id]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[85vh] bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-md bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {stream.stream_icon ? (
                <img
                  src={stream.stream_icon}
                  alt=""
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <Radio className="w-5 h-5 text-zinc-500" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-white text-sm font-semibold truncate">{stream.name}</h2>
              <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" /> Program Guide
              </p>
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
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full bg-zinc-800" />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <AlertCircle className="w-10 h-10 mb-2 text-amber-500" />
                <p className="text-sm">Could not load EPG</p>
                <p className="text-xs mt-1 text-zinc-600">{error}</p>
                <p className="text-xs mt-3 text-zinc-600 max-w-sm text-center">
                  Some providers don&apos;t expose EPG data. Try another channel.
                </p>
              </div>
            ) : programs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <Calendar className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">No program data available</p>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {programs.map((p, i) => {
                  const start = parseEpgTime(p.start);
                  const end = parseEpgTime(p.end);
                  const now = isActiveNow(p);
                  return (
                    <li
                      key={i}
                      className={`p-3 rounded-md border ${
                        now
                          ? "bg-rose-950/30 border-rose-800"
                          : "bg-zinc-800/40 border-zinc-800"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {now && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500 text-white text-[10px] font-semibold">
                            <Radio className="w-2.5 h-2.5" /> LIVE
                          </span>
                        )}
                        <span className="text-xs text-zinc-400">
                          {start ? formatTime(start) : "—"} → {end ? formatTime(end) : "—"}
                        </span>
                      </div>
                      <p className="text-sm text-white font-medium">{p.title || "Untitled"}</p>
                      {p.description && (
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                          {p.description}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
