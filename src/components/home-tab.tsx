"use client";

import { useMemo } from "react";
import { ChevronRight, Tv, Film, MonitorPlay, Heart, Flame, Star, Music, Sparkles, Calendar } from "lucide-react";
import type { Category, LiveStream, VodStream, SeriesItem, XtreamCredentials } from "@/lib/xtream";
import { favorites } from "@/lib/storage";

interface HomeTabProps {
  creds: XtreamCredentials;
  liveStreams: LiveStream[];
  vodStreams: VodStream[];
  seriesItems: SeriesItem[];
  liveCategories: Category[];
  vodCategories: Category[];
  seriesCategories: Category[];
  favTick: number; // bump to force re-render after fav toggle
  onPlayLive: (s: LiveStream) => void;
  onPlayVod: (s: VodStream) => void;
  onOpenSeries: (s: SeriesItem) => void;
  onGoToTab: (tab: "live" | "vod" | "series") => void;
}

interface RowSection<T> {
  id: string;
  title: string;
  icon: React.ReactNode;
  accent: string; // tailwind text color
  items: T[];
  kind: "live" | "vod" | "series";
}

const ROW_SIZE = 20; // max items per row

/**
 * Detect "music"-like categories by name. Different providers use different
 * conventions — match common substrings case-insensitively.
 */
function findMusicCategory(categories: Category[]): Category | null {
  if (!categories?.length) return null;
  const musicKeywords = ["music", "musique", "musik", "mtv", "radio", "fm"];
  for (const c of categories) {
    const name = c.category_name.toLowerCase();
    if (musicKeywords.some((k) => name.includes(k))) return c;
  }
  return null;
}

export function HomeTab({
  creds,
  liveStreams,
  vodStreams,
  seriesItems,
  liveCategories,
  vodCategories,
  seriesCategories,
  favTick,
  onPlayLive,
  onPlayVod,
  onOpenSeries,
  onGoToTab,
}: HomeTabProps) {
  // Build the sections. We use `favTick` indirectly via favorites.has() calls
  // inside child renders by passing favTick as a dep of useMemo.
  const sections = useMemo(() => {
    const favsLive = favorites.live.list();
    const favsVod = favorites.vod.list();
    const favsSeries = favorites.series.list();

    const favoriteLive = liveStreams.filter((s) => favsLive.has(String(s.stream_id)));
    const favoriteVod = vodStreams.filter((s) => favsVod.has(String(s.stream_id)));
    const favoriteSeries = seriesItems.filter((s) => favsSeries.has(String(s.series_id)));

    const recentVod = [...vodStreams]
      .sort((a, b) => (Number(b.added) || 0) - (Number(a.added) || 0))
      .slice(0, ROW_SIZE);

    const topRatedVod = [...vodStreams]
      .filter((s) => s.rating_5based && s.rating_5based >= 3)
      .sort((a, b) => (b.rating_5based || 0) - (a.rating_5based || 0))
      .slice(0, ROW_SIZE);

    const recentSeries = [...seriesItems]
      .sort((a, b) => (Number(b.last_modified) || 0) - (Number(a.last_modified) || 0))
      .slice(0, ROW_SIZE);

    // "Popular live" = channels with archive support, or just the first N
    const popularLive = liveStreams
      .filter((s) => s.tv_archive === 1)
      .slice(0, ROW_SIZE);
    const popularLiveFinal = popularLive.length > 0 ? popularLive : liveStreams.slice(0, ROW_SIZE);

    // Music: find a music category in live, fall back to vod, then series
    const musicLiveCat = findMusicCategory(liveCategories);
    const musicVodCat = !musicLiveCat ? findMusicCategory(vodCategories) : null;
    let musicItems: LiveStream[] | VodStream[] = [];
    let musicKind: "live" | "vod" = "live";
    if (musicLiveCat) {
      musicItems = liveStreams.filter((s) => String(s.category_id) === musicLiveCat.category_id).slice(0, ROW_SIZE);
      musicKind = "live";
    } else if (musicVodCat) {
      musicItems = vodStreams.filter((s) => String(s.category_id) === musicVodCat.category_id).slice(0, ROW_SIZE);
      musicKind = "vod";
    }

    const rows: RowSection<LiveStream | VodStream | SeriesItem>[] = [];

    // 1. Favorites (combined) — only show if there are any
    if (favoriteLive.length > 0) {
      rows.push({
        id: "fav-live",
        title: "My Favorites — Live",
        icon: <Heart className="w-4 h-4" />,
        accent: "text-rose-500",
        items: favoriteLive,
        kind: "live",
      });
    }
    if (favoriteVod.length > 0) {
      rows.push({
        id: "fav-vod",
        title: "My Favorites — Movies",
        icon: <Heart className="w-4 h-4" />,
        accent: "text-rose-500",
        items: favoriteVod,
        kind: "vod",
      });
    }
    if (favoriteSeries.length > 0) {
      rows.push({
        id: "fav-series",
        title: "My Favorites — Series",
        icon: <Heart className="w-4 h-4" />,
        accent: "text-rose-500",
        items: favoriteSeries,
        kind: "series",
      });
    }

    // 2. Trending — top rated movies
    if (topRatedVod.length > 0) {
      rows.push({
        id: "trending",
        title: "Trending Now",
        icon: <Flame className="w-4 h-4" />,
        accent: "text-orange-500",
        items: topRatedVod,
        kind: "vod",
      });
    }

    // 3. Recently Added Movies
    if (recentVod.length > 0) {
      rows.push({
        id: "recent-vod",
        title: "Recently Added Movies",
        icon: <Sparkles className="w-4 h-4" />,
        accent: "text-amber-400",
        items: recentVod,
        kind: "vod",
      });
    }

    // 4. Popular Live (with catchup / archive support)
    if (popularLiveFinal.length > 0) {
      rows.push({
        id: "popular-live",
        title: "Popular Live Channels",
        icon: <Tv className="w-4 h-4" />,
        accent: "text-emerald-400",
        items: popularLiveFinal,
        kind: "live",
      });
    }

    // 5. Music
    if (musicItems.length > 0) {
      rows.push({
        id: "music",
        title: musicLiveCat?.category_name || musicVodCat?.category_name || "Music",
        icon: <Music className="w-4 h-4" />,
        accent: "text-violet-400",
        items: musicItems,
        kind: musicKind,
      });
    }

    // 6. Recently Added Series
    if (recentSeries.length > 0) {
      rows.push({
        id: "recent-series",
        title: "Recently Added Series",
        icon: <MonitorPlay className="w-4 h-4" />,
        accent: "text-cyan-400",
        items: recentSeries,
        kind: "series",
      });
    }

    return rows;
  }, [
    liveStreams,
    vodStreams,
    seriesItems,
    liveCategories,
    vodCategories,
    favTick,
  ]);

  const isEmpty =
    liveStreams.length === 0 &&
    vodStreams.length === 0 &&
    seriesItems.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
        <Sparkles className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">Loading your content…</p>
        <p className="text-xs text-zinc-600 mt-1">Pulling catalogs from your provider</p>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
        <Sparkles className="w-12 h-12 mb-3 opacity-40" />
        <p className="text-sm">No content available yet</p>
        <p className="text-xs text-zinc-600 mt-1">Try the Live TV, Movies, or Series tabs above</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {sections.map((row) => (
        <SectionRow
          key={row.id}
          title={row.title}
          icon={row.icon}
          accent={row.accent}
          items={row.items}
          kind={row.kind}
          favTick={favTick}
          onPlayLive={onPlayLive}
          onPlayVod={onPlayVod}
          onOpenSeries={onOpenSeries}
        />
      ))}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
        <QuickLink
          icon={<Tv className="w-5 h-5" />}
          label="Browse all Live TV"
          count={liveStreams.length}
          onClick={() => onGoToTab("live")}
        />
        <QuickLink
          icon={<Film className="w-5 h-5" />}
          label="Browse all Movies"
          count={vodStreams.length}
          onClick={() => onGoToTab("vod")}
        />
        <QuickLink
          icon={<MonitorPlay className="w-5 h-5" />}
          label="Browse all Series"
          count={seriesItems.length}
          onClick={() => onGoToTab("series")}
        />
      </div>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function SectionRow({
  title,
  icon,
  accent,
  items,
  kind,
  favTick,
  onPlayLive,
  onPlayVod,
  onOpenSeries,
}: {
  title: string;
  icon: React.ReactNode;
  accent: string;
  items: Array<LiveStream | VodStream | SeriesItem>;
  kind: "live" | "vod" | "series";
  favTick: number;
  onPlayLive: (s: LiveStream) => void;
  onPlayVod: (s: VodStream) => void;
  onOpenSeries: (s: SeriesItem) => void;
}) {
  // touch favTick so React re-renders when favorites change
  void favTick;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <span className={accent}>{icon}</span>
          {title}
        </h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {items.map((item) => {
          if (kind === "live") {
            const s = item as LiveStream;
            return (
              <LiveRowCard
                key={`live-${s.stream_id}`}
                stream={s}
                onPlay={() => onPlayLive(s)}
              />
            );
          }
          if (kind === "vod") {
            const s = item as VodStream;
            return (
              <VodRowCard
                key={`vod-${s.stream_id}`}
                stream={s}
                onPlay={() => onPlayVod(s)}
              />
            );
          }
          const s = item as SeriesItem;
          return (
            <SeriesRowCard
              key={`series-${s.series_id}`}
              item={s}
              onClick={() => onOpenSeries(s)}
            />
          );
        })}
      </div>
    </section>
  );
}

function LiveRowCard({
  stream,
  onPlay,
}: {
  stream: LiveStream;
  onPlay: () => void;
}) {
  return (
    <button
      onClick={onPlay}
      className="group flex-shrink-0 w-40 sm:w-44 text-left bg-zinc-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-rose-500 transition"
    >
      <div className="aspect-square bg-zinc-800 flex items-center justify-center p-3">
        {stream.stream_icon ? (
          <img
            src={stream.stream_icon}
            alt={stream.name}
            className="max-w-full max-h-full object-contain"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <Tv className="w-8 h-8 text-zinc-600" />
        )}
      </div>
      <div className="p-2">
        <p className="text-xs text-white line-clamp-2 leading-tight">{stream.name}</p>
      </div>
    </button>
  );
}

function VodRowCard({
  stream,
  onPlay,
}: {
  stream: VodStream;
  onPlay: () => void;
}) {
  return (
    <button
      onClick={onPlay}
      className="group flex-shrink-0 w-28 sm:w-32 text-left bg-zinc-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-rose-500 transition"
    >
      <div className="aspect-[2/3] bg-zinc-800 flex items-center justify-center">
        {stream.stream_icon ? (
          <img
            src={stream.stream_icon}
            alt={stream.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <Film className="w-7 h-7 text-zinc-600" />
        )}
      </div>
      <div className="p-2">
        <p className="text-xs text-white line-clamp-2 leading-tight">{stream.name}</p>
        {stream.rating_5based > 0 && (
          <p className="text-[10px] text-amber-400 mt-0.5 flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 fill-current" />
            {stream.rating_5based.toFixed(1)}
          </p>
        )}
      </div>
    </button>
  );
}

function SeriesRowCard({
  item,
  onClick,
}: {
  item: SeriesItem;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex-shrink-0 w-28 sm:w-32 text-left bg-zinc-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-rose-500 transition"
    >
      <div className="aspect-[2/3] bg-zinc-800 flex items-center justify-center">
        {item.cover ? (
          <img
            src={item.cover}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <MonitorPlay className="w-7 h-7 text-zinc-600" />
        )}
      </div>
      <div className="p-2">
        <p className="text-xs text-white line-clamp-2 leading-tight">{item.name}</p>
        {item.rating_5based > 0 && (
          <p className="text-[10px] text-amber-400 mt-0.5 flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 fill-current" />
            {item.rating_5based.toFixed(1)}
          </p>
        )}
      </div>
    </button>
  );
}

function QuickLink({
  icon,
  label,
  count,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-rose-500 hover:bg-zinc-800 transition text-left group"
    >
      <div className="w-10 h-10 rounded-md bg-zinc-800 group-hover:bg-rose-500/20 flex items-center justify-center text-zinc-300 group-hover:text-rose-400 transition">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{label}</p>
        <p className="text-xs text-zinc-500 mt-0.5">
          {count.toLocaleString()} items
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition" />
    </button>
  );
}
