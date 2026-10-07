"use client";

import { Trophy, Radio, ChevronRight } from "lucide-react";
import type { LiveStream } from "@/lib/xtream";

interface LiveSportsPanelProps {
  /** Live channels filtered to sports categories */
  liveNow: LiveStream[];
  onPlay: (s: LiveStream) => void;
  onShowAll: () => void;
}

/**
 * Heuristic to extract "team names" or descriptive parts from a sports
 * channel name. Channel names are often like "Sky Sports Premier League"
 * or "beIN Sports 1 HD" — we just show them as cards.
 */
export function LiveSportsPanel({ liveNow, onPlay, onShowAll }: LiveSportsPanelProps) {
  if (liveNow.length === 0) return null;

  const items = liveNow.slice(0, 6);

  return (
    <section className="iptv-glass rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-base sm:text-lg font-bold text-white">
          <span className="text-[var(--iptv-red)]">
            <Trophy className="w-5 h-5" />
          </span>
          Live Sports
          <span className="ml-1 text-[10px] uppercase tracking-widest text-[var(--iptv-red)] font-bold flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--iptv-red)]/15 border border-[var(--iptv-red)]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--iptv-red)] iptv-pulse" />
            LIVE NOW
          </span>
        </h2>
        <button
          onClick={onShowAll}
          className="text-xs text-[var(--iptv-text-muted)] hover:text-[var(--iptv-gold)] flex items-center gap-1 transition"
        >
          View all <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {items.map((s) => (
          <button
            key={s.stream_id}
            onClick={() => onPlay(s)}
            className="group relative bg-[var(--iptv-surface)] border border-[var(--iptv-border)] rounded-lg p-3 hover:border-[var(--iptv-red)] hover:bg-[var(--iptv-surface-hover)] transition text-left"
          >
            <div className="flex items-start gap-2">
              <div className="w-10 h-10 rounded-md bg-[var(--iptv-bg-elevated)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                {s.stream_icon ? (
                  <img
                    src={s.stream_icon}
                    alt=""
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <Radio className="w-4 h-4 text-[var(--iptv-text-dim)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white font-medium line-clamp-2 leading-tight">
                  {s.name}
                </p>
                <p className="text-[10px] text-[var(--iptv-red)] mt-1 flex items-center gap-1 font-semibold uppercase tracking-wider">
                  <span className="w-1 h-1 rounded-full bg-[var(--iptv-red)] iptv-pulse" />
                  On Air
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
