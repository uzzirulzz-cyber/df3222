"use client";

import { Tv, Film, MonitorPlay, Play, Star, Calendar, Clock } from "lucide-react";
import type { LiveStream, VodStream, SeriesItem } from "@/lib/xtream";
import { proxyImageUrl } from "@/lib/image-proxy";

export type CardKind = "live" | "vod" | "series";
export type CardAspectRatio = "portrait" | "square";

interface BaseCardProps {
  kind: CardKind;
  aspect?: CardAspectRatio;
  showPlayOverlay?: boolean;
  isFav?: boolean;
  isAdded?: boolean;
  onPlay?: () => void;
  onToggleFav?: () => void;
  onToggleList?: () => void;
  onShowEpg?: () => void;
  /** Optional "LIVE NOW" program title to show under a live card */
  nowPlaying?: string;
}

interface LiveCardProps extends BaseCardProps {
  kind: "live";
  stream: LiveStream;
}
interface VodCardProps extends BaseCardProps {
  kind: "vod";
  stream: VodStream;
}
interface SeriesCardProps extends BaseCardProps {
  kind: "series";
  item: SeriesItem;
}

type ContentCardProps = LiveCardProps | VodCardProps | SeriesCardProps;

function getTitle(p: ContentCardProps): string {
  if (p.kind === "live") return p.stream.name;
  if (p.kind === "vod") return p.stream.name;
  return p.item.name;
}

function getIcon(p: ContentCardProps): string | undefined {
  if (p.kind === "live") return p.stream.stream_icon;
  if (p.kind === "vod") return p.stream.stream_icon;
  return p.item.cover;
}

function getRating(p: ContentCardProps): number {
  if (p.kind === "live") return 0;
  if (p.kind === "vod") return p.stream.rating_5based || 0;
  return p.item.rating_5based || 0;
}

function getGenre(p: ContentCardProps): string {
  if (p.kind === "live") return "Live TV";
  if (p.kind === "vod") return "Movie";
  return "Series";
}

function getYear(p: ContentCardProps): string {
  if (p.kind === "series" && p.item.releaseDate) {
    return p.item.releaseDate.slice(0, 4);
  }
  if (p.kind === "vod" && p.stream.added) {
    // `added` is epoch; convert to year
    const d = new Date(Number(p.stream.added) * 1000);
    return String(d.getFullYear());
  }
  return "";
}

function Placeholder({ kind }: { kind: CardKind }) {
  const Icon = kind === "live" ? Tv : kind === "vod" ? Film : MonitorPlay;
  return <Icon className="w-8 h-8 text-[var(--iptv-text-dim)]" />;
}

export function ContentCard(props: ContentCardProps) {
  const {
    kind,
    aspect = kind === "live" ? "square" : "portrait",
    showPlayOverlay = true,
    isFav,
    isAdded,
    onPlay,
    onToggleFav,
    onToggleList,
    onShowEpg,
    nowPlaying,
  } = props;

  const title = getTitle(props);
  const icon = proxyImageUrl(getIcon(props));
  const rating = getRating(props);
  const genre = getGenre(props);
  const year = getYear(props);
  const isLive = kind === "live";

  const aspectClass = aspect === "square" ? "aspect-square" : "aspect-[2/3]";

  return (
    <div
      className={`iptv-card ${isLive ? "iptv-card-live" : ""} group cursor-pointer w-full`}
      onClick={onPlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPlay?.();
        }
      }}
    >
      {/* Poster area */}
      <div className={`relative ${aspectClass} bg-[var(--iptv-bg-elevated)] overflow-hidden`}>
        {icon ? (
          <img
            src={icon}
            alt={title}
            className={
              isLive
                ? "max-w-full max-h-full object-contain p-3 absolute inset-0 m-auto"
                : "w-full h-full object-cover"
            }
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Placeholder kind={kind} />
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isLive && (
            <span className="iptv-badge-live text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-white iptv-pulse" />
              LIVE
            </span>
          )}
          {!isLive && rating >= 4 && (
            <span className="iptv-badge-4k text-[9px] px-1.5 py-0.5 rounded">4K</span>
          )}
          {!isLive && rating > 0 && rating < 4 && (
            <span className="iptv-badge-hd text-[9px] px-1.5 py-0.5 rounded">HD</span>
          )}
        </div>

        {/* Top-right action buttons (visible on hover) */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
          {onToggleFav && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFav();
              }}
              className="w-7 h-7 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white hover:scale-110 transition"
              aria-label="Toggle favorite"
              title="Favorite"
            >
              <Star className={`w-3.5 h-3.5 ${isFav ? "fill-[var(--iptv-gold)] text-[var(--iptv-gold)]" : ""}`} />
            </button>
          )}
          {onToggleList && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleList();
              }}
              className="w-7 h-7 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white hover:scale-110 transition text-sm font-bold"
              aria-label="Add to my list"
              title="Add to List"
            >
              {isAdded ? "✓" : "+"}
            </button>
          )}
          {isLive && onShowEpg && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShowEpg();
              }}
              className="w-7 h-7 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white hover:scale-110 transition"
              aria-label="Program guide"
              title="EPG"
            >
              <Calendar className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Hover play overlay */}
        {showPlayOverlay && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isLive
                ? "bg-gradient-to-br from-[var(--iptv-neon)] to-[var(--iptv-neon-dim)] shadow-[0_0_20px_rgba(0,217,255,0.7)]"
                : "bg-gradient-to-br from-[var(--iptv-gold-bright)] to-[var(--iptv-gold-dim)] shadow-[0_0_20px_rgba(245,184,0,0.7)]"
            }`}>
              <Play className="w-5 h-5 text-[#0a0a14] fill-current ml-0.5" />
            </div>
          </div>
        )}

        {/* Bottom gradient with title (always visible) */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2.5 pt-6">
          <p className={`text-white text-xs font-medium leading-tight line-clamp-2 ${isLive ? "" : "min-h-[2rem]"}`}>
            {title}
          </p>
        </div>
      </div>

      {/* Meta row */}
      <div className="p-2 space-y-1">
        <div className="flex items-center gap-2 text-[10px] text-[var(--iptv-text-dim)]">
          <span className="uppercase tracking-wider font-medium text-[var(--iptv-text-muted)]">{genre}</span>
          {year && (
            <>
              <span>·</span>
              <span className="flex items-center gap-0.5">
                <Calendar className="w-2.5 h-2.5" />{year}
              </span>
            </>
          )}
          {rating > 0 && (
            <>
              <span>·</span>
              <span className="flex items-center gap-0.5 text-[var(--iptv-gold)]">
                <Star className="w-2.5 h-2.5 fill-current" />
                {rating.toFixed(1)}
              </span>
            </>
          )}
        </div>
        {isLive && nowPlaying && (
          <p className="text-[10px] text-[var(--iptv-neon)] flex items-center gap-1 truncate">
            <span className="w-1 h-1 rounded-full bg-[var(--iptv-neon)] iptv-pulse flex-shrink-0" />
            <span className="truncate">{nowPlaying}</span>
          </p>
        )}
      </div>
    </div>
  );
}
