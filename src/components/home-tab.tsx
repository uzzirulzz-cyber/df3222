"use client";

import { useMemo } from "react";
import {
  Flame,
  TrendingUp,
  Sparkles,
  Star,
  Music,
  Film,
  MonitorPlay,
  Trophy,
  Heart,
  Tv,
  Grid2x2,
  History,
  ListPlus,
  Clock,
} from "lucide-react";
import type {
  Category,
  LiveStream,
  VodStream,
  SeriesItem,
  XtreamCredentials,
} from "@/lib/xtream";
import { favorites, history as watchHistory, myList } from "@/lib/storage";
import { proxyImageUrl } from "@/lib/image-proxy";
import { ContentRow, RowItem } from "./content-row";
import { ContentCard } from "./content-card";
import { HeroBanner, type HeroSlide } from "./hero-banner";
import { LiveSportsPanel } from "./live-sports-panel";

interface HomeTabProps {
  creds: XtreamCredentials;
  liveStreams: LiveStream[];
  vodStreams: VodStream[];
  seriesItems: SeriesItem[];
  liveCategories: Category[];
  vodCategories: Category[];
  seriesCategories: Category[];
  favTick: number;
  listTick: number;
  onPlayLive: (s: LiveStream) => void;
  onPlayVod: (s: VodStream) => void;
  onOpenSeries: (s: SeriesItem) => void;
  onShowEpg: (s: LiveStream) => void;
  onToggleFavLive: (id: number) => void;
  onToggleFavVod: (id: number) => void;
  onToggleFavSeries: (id: number) => void;
  onToggleList: (item: { id: string; kind: "live" | "vod" | "series"; title: string; icon?: string }) => void;
  onGoToTab: (tab: "live" | "vod" | "series" | "sports" | "music" | "kids" | "genres") => void;
}

const ROW_SIZE = 18;

/**
 * Find a category by keyword (case-insensitive substring match).
 */
function findCategory(categories: Category[], keywords: string[]): Category | null {
  if (!categories?.length) return null;
  for (const c of categories) {
    const name = c.category_name.toLowerCase();
    if (keywords.some((k) => name.includes(k))) return c;
  }
  return null;
}

const SPORTS_KEYWORDS = ["sport", "espn", "football", "cricket", "basketball", "tennis", "nba", "nfl", "mlb", "nhl", "ufc", "wwe", "golf", "boxing", "f1", "motor"];
const MUSIC_KEYWORDS = ["music", "musique", "musik", "mtv", "vh1", "concert"];
const KIDS_KEYWORDS = ["kid", "child", "baby", "cartoon", "disney", "nick", "junior", "boomerang"];
const NEWS_KEYWORDS = ["news", "cnn", "bbc", "sky news", "fox news", "al jazeera"];

export function HomeTab(props: HomeTabProps) {
  const {
    creds,
    liveStreams,
    vodStreams,
    seriesItems,
    liveCategories,
    vodCategories,
    seriesCategories,
    favTick,
    listTick,
    onPlayLive,
    onPlayVod,
    onOpenSeries,
    onShowEpg,
    onToggleFavLive,
    onToggleFavVod,
    onToggleFavSeries,
    onToggleList,
    onGoToTab,
  } = props;

  const data = useMemo(() => {
    void favTick;
    void listTick;

    const favsLive = favorites.live.list();
    const favsVod = favorites.vod.list();
    const favsSeries = favorites.series.list();

    const favoriteLive = liveStreams.filter((s) => favsLive.has(String(s.stream_id)));
    const favoriteVod = vodStreams.filter((s) => favsVod.has(String(s.stream_id)));
    const favoriteSeries = seriesItems.filter((s) => favsSeries.has(String(s.series_id)));

    // "Continue Watching" — from watch history
    const historyList = watchHistory.list();

    // "My List" — separate watch-later queue
    const myListItems = myList.list();

    // Popular Now — channels with archive support, fallback to first N
    const popularLive =
      liveStreams.filter((s) => s.tv_archive === 1).slice(0, ROW_SIZE).length > 0
        ? liveStreams.filter((s) => s.tv_archive === 1).slice(0, ROW_SIZE)
        : liveStreams.slice(0, ROW_SIZE);

    // Trending — top-rated movies
    const trending = [...vodStreams]
      .filter((s) => s.rating_5based && s.rating_5based >= 3.5)
      .sort((a, b) => (b.rating_5based || 0) - (a.rating_5based || 0))
      .slice(0, ROW_SIZE);

    // New Releases — recently added VOD
    const newReleases = [...vodStreams]
      .sort((a, b) => (Number(b.added) || 0) - (Number(a.added) || 0))
      .slice(0, ROW_SIZE);

    // All-Time Hits — top-rated movies overall
    const allTimeHits = [...vodStreams]
      .filter((s) => s.rating_5based && s.rating_5based >= 4)
      .sort((a, b) => (b.rating_5based || 0) - (a.rating_5based || 0))
      .slice(0, ROW_SIZE);

    // Music — auto-detected
    const musicLiveCat = findCategory(liveCategories, MUSIC_KEYWORDS);
    const musicVodCat = !musicLiveCat ? findCategory(vodCategories, MUSIC_KEYWORDS) : null;
    let musicLive: LiveStream[] = [];
    let musicVod: VodStream[] = [];
    if (musicLiveCat) {
      musicLive = liveStreams
        .filter((s) => String(s.category_id) === musicLiveCat.category_id)
        .slice(0, ROW_SIZE);
    }
    if (musicVodCat) {
      musicVod = vodStreams
        .filter((s) => String(s.category_id) === musicVodCat.category_id)
        .slice(0, ROW_SIZE);
    }

    // Sports — for the live panel + sports row
    const sportsCat = findCategory(liveCategories, SPORTS_KEYWORDS);
    const sportsLive = sportsCat
      ? liveStreams.filter((s) => String(s.category_id) === sportsCat.category_id)
      : [];

    // Kids — for kids row
    const kidsCat = findCategory(liveCategories, KIDS_KEYWORDS);
    const kidsLive = kidsCat
      ? liveStreams.filter((s) => String(s.category_id) === kidsCat.category_id).slice(0, ROW_SIZE)
      : [];

    // Drama — VOD in "drama" category or with "drama" in name
    const dramaCat = findCategory(vodCategories, ["drama"]);
    const dramaVod = dramaCat
      ? vodStreams.filter((s) => String(s.category_id) === dramaCat.category_id).slice(0, ROW_SIZE)
      : [];

    // TV Series — recently added series
    const tvSeries = [...seriesItems]
      .sort((a, b) => (Number(b.last_modified) || 0) - (Number(a.last_modified) || 0))
      .slice(0, ROW_SIZE);

    // Hero slides — pick top 5 from trending + popular live
    const heroSlides: HeroSlide[] = [];
    for (const v of trending.slice(0, 3)) {
      heroSlides.push({
        id: `vod-${v.stream_id}`,
        kind: "vod",
        title: v.name,
        description: "Top-rated movie streaming now. Watch in HD or 4K.",
        genre: "Movie",
        rating: v.rating_5based,
        year: v.added ? new Date(Number(v.added) * 1000).getFullYear().toString() : undefined,
        backdrop: v.stream_icon,
      });
    }
    for (const s of popularLive.slice(0, 2)) {
      heroSlides.push({
        id: `live-${s.stream_id}`,
        kind: "live",
        title: s.name,
        description: "Live channel with catch-up support.",
        genre: "Live TV",
        backdrop: s.stream_icon,
      });
    }

    return {
      favoriteLive,
      favoriteVod,
      favoriteSeries,
      historyList,
      myListItems,
      popularLive,
      trending,
      newReleases,
      allTimeHits,
      musicLive,
      musicVod,
      sportsLive,
      kidsLive,
      dramaVod,
      tvSeries,
      heroSlides,
      sportsCatName: sportsCat?.category_name,
      musicCatName: musicLiveCat?.category_name || musicVodCat?.category_name,
      kidsCatName: kidsCat?.category_name,
    };
  }, [liveStreams, vodStreams, seriesItems, liveCategories, vodCategories, favTick, listTick]);

  const isEmpty =
    liveStreams.length === 0 &&
    vodStreams.length === 0 &&
    seriesItems.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-[var(--iptv-gold)] to-[var(--iptv-gold-dim)] flex items-center justify-center shadow-[0_0_30px_rgba(245,184,0,0.4)]">
          <Sparkles className="w-7 h-7 text-[#0a0a14]" />
        </div>
        <p className="text-white text-lg font-semibold">Loading your content</p>
        <p className="text-[var(--iptv-text-muted)] text-sm mt-1">
          Pulling catalogs from your provider…
        </p>
      </div>
    );
  }

  const handleWatchHero = (slide: HeroSlide) => {
    if (slide.kind === "live") {
      const s = liveStreams.find((x) => `live-${x.stream_id}` === slide.id);
      if (s) onPlayLive(s);
    } else if (slide.kind === "vod") {
      const s = vodStreams.find((x) => `vod-${x.stream_id}` === slide.id);
      if (s) onPlayVod(s);
    }
  };

  const isHeroAdded = (slide: HeroSlide) =>
    myList.has(slide.id, slide.kind);

  return (
    <div className="space-y-8 pb-8">
      {/* HERO */}
      <HeroBanner
        slides={data.heroSlides}
        onWatch={handleWatchHero}
        onAddToList={(slide) =>
          onToggleList({ id: slide.id, kind: slide.kind, title: slide.title, icon: slide.backdrop })
        }
        isAdded={isHeroAdded}
      />

      {/* LIVE SPORTS PANEL (only if we have sports content) */}
      {data.sportsLive.length > 0 && (
        <LiveSportsPanel
          liveNow={data.sportsLive}
          onPlay={onPlayLive}
          onShowAll={() => onGoToTab("sports")}
        />
      )}

      {/* CONTINUE WATCHING */}
      {data.historyList.length > 0 && (
        <ContentRow
          title="Continue Watching"
          icon={<History className="w-5 h-5" />}
          accent="neon"
        >
          {data.historyList.slice(0, ROW_SIZE).map((h) => (
            <RowItem key={`${h.kind}-${h.id}`}>
              <div
                className="iptv-card group cursor-pointer w-full"
                onClick={() => {
                  if (h.kind === "live") {
                    const s = liveStreams.find((x) => String(x.stream_id) === h.id);
                    if (s) onPlayLive(s);
                  } else if (h.kind === "vod") {
                    const s = vodStreams.find((x) => String(x.stream_id) === h.id);
                    if (s) onPlayVod(s);
                  } else {
                    const s = seriesItems.find((x) => String(x.series_id) === h.id);
                    if (s) onOpenSeries(s);
                  }
                }}
              >
                <div className="relative aspect-[2/3] bg-[var(--iptv-bg-elevated)] overflow-hidden">
                  {h.icon ? (
                    <img
                      src={proxyImageUrl(h.icon)}
                      alt={h.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Tv className="w-6 h-6 text-[var(--iptv-text-dim)]" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 pt-6">
                    <p className="text-white text-xs font-medium line-clamp-2">{h.title}</p>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="h-1 rounded-full bg-white/20 overflow-hidden">
                      <div className="h-full bg-[var(--iptv-neon)] w-2/3" />
                    </div>
                    <p className="text-[9px] text-[var(--iptv-text-muted)] mt-1 flex items-center gap-0.5">
                      <Clock className="w-2 h-2" />
                      {new Date(h.watchedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </RowItem>
          ))}
        </ContentRow>
      )}

      {/* MY LIST */}
      {data.myListItems.length > 0 && (
        <ContentRow
          title="My List"
          icon={<ListPlus className="w-5 h-5" />}
          accent="gold"
        >
          {data.myListItems.slice(0, ROW_SIZE).map((h) => (
            <RowItem key={`mylist-${h.kind}-${h.id}`}>
              <div
                className="iptv-card group cursor-pointer w-full"
                onClick={() => {
                  if (h.kind === "live") {
                    const s = liveStreams.find((x) => String(x.stream_id) === h.id);
                    if (s) onPlayLive(s);
                  } else if (h.kind === "vod") {
                    const s = vodStreams.find((x) => String(x.stream_id) === h.id);
                    if (s) onPlayVod(s);
                  } else {
                    const s = seriesItems.find((x) => String(x.series_id) === h.id);
                    if (s) onOpenSeries(s);
                  }
                }}
              >
                <div className="relative aspect-[2/3] bg-[var(--iptv-bg-elevated)] overflow-hidden">
                  {h.icon ? (
                    <img
                      src={proxyImageUrl(h.icon)}
                      alt={h.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="w-6 h-6 text-[var(--iptv-text-dim)]" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 pt-6">
                    <p className="text-white text-xs font-medium line-clamp-2">{h.title}</p>
                  </div>
                </div>
              </div>
            </RowItem>
          ))}
        </ContentRow>
      )}

      {/* 1. POPULAR NOW (live) */}
      <ContentRow
        title="Popular Now"
        icon={<Flame className="w-5 h-5" />}
        accent="red"
        isEmpty={data.popularLive.length === 0}
      >
        {data.popularLive.map((s) => (
          <RowItem key={`pop-${s.stream_id}`}>
            <ContentCard
              kind="live"
              stream={s}
              onPlay={() => onPlayLive(s)}
              onShowEpg={() => onShowEpg(s)}
              isFav={favorites.live.has(String(s.stream_id))}
              onToggleFav={() => onToggleFavLive(s.stream_id)}
              onToggleList={() =>
                onToggleList({ id: String(s.stream_id), kind: "live", title: s.name, icon: s.stream_icon })
              }
              isAdded={myList.has(String(s.stream_id), "live")}
            />
          </RowItem>
        ))}
      </ContentRow>

      {/* 2. TRENDING */}
      <ContentRow
        title="Trending"
        icon={<TrendingUp className="w-5 h-5" />}
        accent="gold"
        isEmpty={data.trending.length === 0}
      >
        {data.trending.map((s) => (
          <RowItem key={`tr-${s.stream_id}`}>
            <ContentCard
              kind="vod"
              stream={s}
              onPlay={() => onPlayVod(s)}
              isFav={favorites.vod.has(String(s.stream_id))}
              onToggleFav={() => onToggleFavVod(s.stream_id)}
              onToggleList={() =>
                onToggleList({ id: String(s.stream_id), kind: "vod", title: s.name, icon: s.stream_icon })
              }
              isAdded={myList.has(String(s.stream_id), "vod")}
            />
          </RowItem>
        ))}
      </ContentRow>

      {/* 3. NEW RELEASES */}
      <ContentRow
        title="New Releases"
        icon={<Sparkles className="w-5 h-5" />}
        accent="neon"
        isEmpty={data.newReleases.length === 0}
      >
        {data.newReleases.map((s) => (
          <RowItem key={`nr-${s.stream_id}`}>
            <ContentCard
              kind="vod"
              stream={s}
              onPlay={() => onPlayVod(s)}
              isFav={favorites.vod.has(String(s.stream_id))}
              onToggleFav={() => onToggleFavVod(s.stream_id)}
              onToggleList={() =>
                onToggleList({ id: String(s.stream_id), kind: "vod", title: s.name, icon: s.stream_icon })
              }
              isAdded={myList.has(String(s.stream_id), "vod")}
            />
          </RowItem>
        ))}
      </ContentRow>

      {/* 4. ALL-TIME HITS */}
      <ContentRow
        title="All-Time Hits"
        icon={<Star className="w-5 h-5" />}
        accent="gold"
        isEmpty={data.allTimeHits.length === 0}
      >
        {data.allTimeHits.map((s) => (
          <RowItem key={`hit-${s.stream_id}`}>
            <ContentCard
              kind="vod"
              stream={s}
              onPlay={() => onPlayVod(s)}
              isFav={favorites.vod.has(String(s.stream_id))}
              onToggleFav={() => onToggleFavVod(s.stream_id)}
              onToggleList={() =>
                onToggleList({ id: String(s.stream_id), kind: "vod", title: s.name, icon: s.stream_icon })
              }
              isAdded={myList.has(String(s.stream_id), "vod")}
            />
          </RowItem>
        ))}
      </ContentRow>

      {/* 5. MUSIC */}
      {(data.musicLive.length > 0 || data.musicVod.length > 0) && (
        <ContentRow
          title={data.musicCatName || "Music"}
          icon={<Music className="w-5 h-5" />}
          accent="neon"
        >
          {data.musicLive.map((s) => (
            <RowItem key={`mus-l-${s.stream_id}`}>
              <ContentCard
                kind="live"
                stream={s}
                onPlay={() => onPlayLive(s)}
                onShowEpg={() => onShowEpg(s)}
                isFav={favorites.live.has(String(s.stream_id))}
                onToggleFav={() => onToggleFavLive(s.stream_id)}
              />
            </RowItem>
          ))}
          {data.musicVod.map((s) => (
            <RowItem key={`mus-v-${s.stream_id}`}>
              <ContentCard
                kind="vod"
                stream={s}
                onPlay={() => onPlayVod(s)}
                isFav={favorites.vod.has(String(s.stream_id))}
                onToggleFav={() => onToggleFavVod(s.stream_id)}
              />
            </RowItem>
          ))}
        </ContentRow>
      )}

      {/* 6. MOVIES (browse all) */}
      <ContentRow
        title="Movies"
        icon={<Film className="w-5 h-5" />}
        accent="gold"
        isEmpty={vodStreams.length === 0}
      >
        {vodStreams.slice(0, ROW_SIZE).map((s) => (
          <RowItem key={`mov-${s.stream_id}`}>
            <ContentCard
              kind="vod"
              stream={s}
              onPlay={() => onPlayVod(s)}
              isFav={favorites.vod.has(String(s.stream_id))}
              onToggleFav={() => onToggleFavVod(s.stream_id)}
              onToggleList={() =>
                onToggleList({ id: String(s.stream_id), kind: "vod", title: s.name, icon: s.stream_icon })
              }
              isAdded={myList.has(String(s.stream_id), "vod")}
            />
          </RowItem>
        ))}
      </ContentRow>

      {/* 7. TV SERIES */}
      <ContentRow
        title="TV Series"
        icon={<MonitorPlay className="w-5 h-5" />}
        accent="neon"
        isEmpty={data.tvSeries.length === 0}
      >
        {data.tvSeries.map((s) => (
          <RowItem key={`ser-${s.series_id}`}>
            <ContentCard
              kind="series"
              item={s}
              onClick={undefined as never}
              onPlay={() => onOpenSeries(s)}
              isFav={favorites.series.has(String(s.series_id))}
              onToggleFav={() => onToggleFavSeries(s.series_id)}
              onToggleList={() =>
                onToggleList({ id: String(s.series_id), kind: "series", title: s.name, icon: s.cover })
              }
              isAdded={myList.has(String(s.series_id), "series")}
            />
          </RowItem>
        ))}
      </ContentRow>

      {/* 8. SPORTS */}
      {data.sportsLive.length > 0 && (
        <ContentRow
          title={data.sportsCatName || "Sports"}
          icon={<Trophy className="w-5 h-5" />}
          accent="red"
        >
          {data.sportsLive.slice(0, ROW_SIZE).map((s) => (
            <RowItem key={`sprt-${s.stream_id}`}>
              <ContentCard
                kind="live"
                stream={s}
                onPlay={() => onPlayLive(s)}
                onShowEpg={() => onShowEpg(s)}
                isFav={favorites.live.has(String(s.stream_id))}
                onToggleFav={() => onToggleFavLive(s.stream_id)}
              />
            </RowItem>
          ))}
        </ContentRow>
      )}

      {/* 9. DRAMA */}
      {data.dramaVod.length > 0 && (
        <ContentRow
          title="Drama"
          icon={<Heart className="w-5 h-5" />}
          accent="red"
        >
          {data.dramaVod.map((s) => (
            <RowItem key={`drm-${s.stream_id}`}>
              <ContentCard
                kind="vod"
                stream={s}
                onPlay={() => onPlayVod(s)}
                isFav={favorites.vod.has(String(s.stream_id))}
                onToggleFav={() => onToggleFavVod(s.stream_id)}
              />
            </RowItem>
          ))}
        </ContentRow>
      )}

      {/* KIDS (bonus) */}
      {data.kidsLive.length > 0 && (
        <ContentRow
          title={data.kidsCatName || "Kids"}
          icon={<Sparkles className="w-5 h-5" />}
          accent="gold"
        >
          {data.kidsLive.map((s) => (
            <RowItem key={`kid-${s.stream_id}`}>
              <ContentCard
                kind="live"
                stream={s}
                onPlay={() => onPlayLive(s)}
                onShowEpg={() => onShowEpg(s)}
                isFav={favorites.live.has(String(s.stream_id))}
                onToggleFav={() => onToggleFavLive(s.stream_id)}
              />
            </RowItem>
          ))}
        </ContentRow>
      )}

      {/* 10. ALL GENRES — quick links grid */}
      <section>
        <h2 className="flex items-center gap-2 text-base sm:text-lg font-bold text-white mb-3">
          <Grid2x2 className="w-5 h-5 text-[var(--iptv-gold)]" />
          All Genres
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {liveCategories.slice(0, 24).map((c) => (
            <button
              key={c.category_id}
              onClick={() => onGoToTab("genres")}
              className="px-3 py-2.5 rounded-md bg-[var(--iptv-surface)] border border-[var(--iptv-border)] text-xs text-[var(--iptv-text-muted)] hover:text-white hover:border-[var(--iptv-gold)] hover:bg-[var(--iptv-surface-hover)] transition truncate"
              title={c.category_name}
            >
              {c.category_name}
            </button>
          ))}
        </div>
      </section>

      {/* Quick navigation cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickLinkCard
          icon={<Tv className="w-6 h-6" />}
          label="Browse all Live TV"
          count={liveStreams.length}
          accent="neon"
          onClick={() => onGoToTab("live")}
        />
        <QuickLinkCard
          icon={<Film className="w-6 h-6" />}
          label="Browse all Movies"
          count={vodStreams.length}
          accent="gold"
          onClick={() => onGoToTab("vod")}
        />
        <QuickLinkCard
          icon={<MonitorPlay className="w-6 h-6" />}
          label="Browse all Series"
          count={seriesItems.length}
          accent="neon"
          onClick={() => onGoToTab("series")}
        />
      </section>
    </div>
  );
}

function QuickLinkCard({
  icon,
  label,
  count,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  accent: "gold" | "neon";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 p-4 rounded-xl bg-[var(--iptv-surface)] border border-[var(--iptv-border)] hover:border-[var(--iptv-gold)] hover:bg-[var(--iptv-surface-hover)] transition text-left"
    >
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center transition ${
          accent === "gold"
            ? "bg-[var(--iptv-gold)]/15 text-[var(--iptv-gold)] group-hover:bg-[var(--iptv-gold)]/25"
            : "bg-[var(--iptv-neon)]/15 text-[var(--iptv-neon)] group-hover:bg-[var(--iptv-neon)]/25"
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{label}</p>
        <p className="text-xs text-[var(--iptv-text-muted)] mt-0.5">
          {count.toLocaleString()} items
        </p>
      </div>
    </button>
  );
}
