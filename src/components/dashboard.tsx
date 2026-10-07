"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tv, Film, MonitorPlay, Search, Heart } from "lucide-react";
import type {
  XtreamCredentials,
  Category,
  LiveStream,
  VodStream,
  SeriesItem,
} from "@/lib/xtream";
import { Xtream } from "@/lib/xtream";
import {
  favorites,
  loadSettings,
  saveSettings,
  history as watchHistory,
  myList,
  type IptvSettings,
} from "@/lib/storage";
import { VideoPlayer } from "./video-player";
import { SeriesDetail } from "./series-detail";
import { SettingsDialog } from "./settings-dialog";
import { EpgModal } from "./epg-modal";
import { HomeTab } from "./home-tab";
import { TopNav, type NavTab } from "./top-nav";
import { ContentCard } from "./content-card";
import { AppFooter } from "./app-footer";

interface DashboardProps {
  creds: XtreamCredentials;
  serverName: string;
  onLogout: () => void;
}

type PlayingItem =
  | { kind: "live"; streamId: number; title: string; icon?: string }
  | { kind: "vod"; streamId: number; title: string; container: string; icon?: string }
  | null;

const SPORTS_KEYWORDS = ["sport", "espn", "football", "cricket", "basketball", "tennis", "nba", "nfl", "mlb", "nhl", "ufc", "wwe", "golf", "boxing", "f1", "motor"];
const MUSIC_KEYWORDS = ["music", "musique", "musik", "mtv", "vh1", "concert"];
const KIDS_KEYWORDS = ["kid", "child", "baby", "cartoon", "disney", "nick", "junior", "boomerang"];

export function Dashboard({ creds, serverName, onLogout }: DashboardProps) {
  const [tab, setTab] = useState<NavTab>("home");

  // Live state
  const [liveCategories, setLiveCategories] = useState<Category[]>([]);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [activeLiveCat, setActiveLiveCat] = useState<string>("all");
  const [liveLoading, setLiveLoading] = useState(true);

  // VOD state
  const [vodCategories, setVodCategories] = useState<Category[]>([]);
  const [vodStreams, setVodStreams] = useState<VodStream[]>([]);
  const [activeVodCat, setActiveVodCat] = useState<string>("all");
  const [vodLoading, setVodLoading] = useState(false);

  // Series state
  const [seriesCategories, setSeriesCategories] = useState<Category[]>([]);
  const [seriesItems, setSeriesItems] = useState<SeriesItem[]>([]);
  const [activeSeriesCat, setActiveSeriesCat] = useState<string>("all");
  const [seriesLoading, setSeriesLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [showFavsOnly, setShowFavsOnly] = useState(false);
  const [playing, setPlaying] = useState<PlayingItem>(null);
  const [selectedSeries, setSelectedSeries] = useState<SeriesItem | null>(null);
  const [epgStream, setEpgStream] = useState<LiveStream | null>(null);
  const [favTick, setFavTick] = useState(0);
  const [listTick, setListTick] = useState(0);

  const [settings, setSettings] = useState<IptvSettings>(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ----- Data loading -----
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLiveLoading(true);
    Promise.all([Xtream.getLiveCategories(creds), Xtream.getLiveStreams(creds)])
      .then(([cats, streams]) => {
        if (cancelled) return;
        setLiveCategories(cats || []);
        setLiveStreams(streams || []);
      })
      .catch((err) => console.error("Live load error:", err))
      .finally(() => !cancelled && setLiveLoading(false));
    return () => {
      cancelled = true;
    };
  }, [creds]);

  useEffect(() => {
    if (vodCategories.length > 0) return;
    if (tab !== "home" && tab !== "vod") return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVodLoading(true);
    Promise.all([Xtream.getVodCategories(creds), Xtream.getVodStreams(creds)])
      .then(([cats, streams]) => {
        if (cancelled) return;
        setVodCategories(cats || []);
        setVodStreams(streams || []);
      })
      .catch((err) => console.error("VOD load error:", err))
      .finally(() => !cancelled && setVodLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tab, creds, vodCategories.length]);

  useEffect(() => {
    if (seriesCategories.length > 0) return;
    if (tab !== "home" && tab !== "series") return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeriesLoading(true);
    Promise.all([Xtream.getSeriesCategories(creds), Xtream.getSeries(creds)])
      .then(([cats, items]) => {
        if (cancelled) return;
        setSeriesCategories(cats || []);
        setSeriesItems(items || []);
      })
      .catch((err) => console.error("Series load error:", err))
      .finally(() => !cancelled && setSeriesLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tab, creds, seriesCategories.length]);

  // Reset filters when leaving Home
  useEffect(() => {
    if (tab === "home") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearch("");
    setShowFavsOnly(false);
  }, [tab]);

  // ----- Derived: filtered streams for "pseudo tabs" (sports/music/kids/genres) -----
  const filteredLive = useMemo(() => {
    void favTick;
    let list = liveStreams;

    // Apply keyword filter for pseudo-tabs
    if (tab === "sports") {
      const sportCats = liveCategories
        .filter((c) => SPORTS_KEYWORDS.some((k) => c.category_name.toLowerCase().includes(k)))
        .map((c) => c.category_id);
      list = list.filter((s) => sportCats.includes(String(s.category_id)));
    } else if (tab === "music") {
      const musicCats = liveCategories
        .filter((c) => MUSIC_KEYWORDS.some((k) => c.category_name.toLowerCase().includes(k)))
        .map((c) => c.category_id);
      list = list.filter((s) => musicCats.includes(String(s.category_id)));
    } else if (tab === "kids") {
      const kidsCats = liveCategories
        .filter((c) => KIDS_KEYWORDS.some((k) => c.category_name.toLowerCase().includes(k)))
        .map((c) => c.category_id);
      list = list.filter((s) => kidsCats.includes(String(s.category_id)));
    } else if (tab === "live") {
      if (activeLiveCat !== "all") {
        list = list.filter((s) => String(s.category_id) === activeLiveCat);
      }
    }

    if (showFavsOnly) {
      const favs = favorites.live.list();
      list = list.filter((s) => favs.has(String(s.stream_id)));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    return list;
  }, [liveStreams, liveCategories, tab, activeLiveCat, showFavsOnly, search, favTick]);

  const visibleVod = useMemo(() => {
    void favTick;
    let list = vodStreams;
    if (activeVodCat !== "all") {
      list = list.filter((s) => String(s.category_id) === activeVodCat);
    }
    if (showFavsOnly) {
      const favs = favorites.vod.list();
      list = list.filter((s) => favs.has(String(s.stream_id)));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    return list;
  }, [vodStreams, activeVodCat, showFavsOnly, search, favTick]);

  const visibleSeries = useMemo(() => {
    void favTick;
    let list = seriesItems;
    if (activeSeriesCat !== "all") {
      list = list.filter((s) => String(s.category_id) === activeSeriesCat);
    }
    if (showFavsOnly) {
      const favs = favorites.series.list();
      list = list.filter((s) => favs.has(String(s.series_id)));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    return list;
  }, [seriesItems, activeSeriesCat, showFavsOnly, search, favTick]);

  // ----- Handlers -----
  const toggleFavLive = (id: number) => {
    favorites.live.toggle(String(id));
    setFavTick((t) => t + 1);
  };
  const toggleFavVod = (id: number) => {
    favorites.vod.toggle(String(id));
    setFavTick((t) => t + 1);
  };
  const toggleFavSeries = (id: number) => {
    favorites.series.toggle(String(id));
    setFavTick((t) => t + 1);
  };

  const handleToggleList = (item: {
    id: string;
    kind: "live" | "vod" | "series";
    title: string;
    icon?: string;
  }) => {
    myList.toggle(item);
    setListTick((t) => t + 1);
  };

  const handleSaveSettings = (s: IptvSettings) => {
    setSettings(s);
    saveSettings(s);
  };

  const playLive = (s: LiveStream) => {
    watchHistory.add({
      id: String(s.stream_id),
      kind: "live",
      title: s.name,
      icon: s.stream_icon,
    });
    setPlaying({
      kind: "live",
      streamId: s.stream_id,
      title: s.name,
      icon: s.stream_icon,
    });
  };
  const playVod = (s: VodStream) => {
    watchHistory.add({
      id: String(s.stream_id),
      kind: "vod",
      title: s.name,
      icon: s.stream_icon,
    });
    setPlaying({
      kind: "vod",
      streamId: s.stream_id,
      title: s.name,
      container: s.container_extension,
      icon: s.stream_icon,
    });
  };

  // When opening series, also log to history
  const openSeries = (s: SeriesItem) => {
    watchHistory.add({
      id: String(s.series_id),
      kind: "series",
      title: s.name,
      icon: s.cover,
    });
    setSelectedSeries(s);
  };

  // ----- Render -----
  const showBrowserUI = tab !== "home" && tab !== "genres";
  const showSidebar = tab === "live" || tab === "vod" || tab === "series";

  // For "genres" pseudo-tab, show all live categories as a grid
  const genresView = tab === "genres";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--iptv-bg)", color: "var(--iptv-text)" }}>
      <TopNav
        active={tab}
        onNavigate={setTab}
        search={search}
        onSearchChange={setSearch}
        serverName={serverName}
        liveFormat={settings.liveFormat}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={onLogout}
      />

      <main className="flex-1 flex flex-col">
        {/* Sub-bar: search + favorites toggle (only for browse tabs) */}
        {showBrowserUI && (
          <div className="border-b border-[var(--iptv-border)] bg-[var(--iptv-bg-elevated)]">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--iptv-text-dim)]" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${tab === "live" ? "live TV" : tab === "vod" ? "movies" : tab === "series" ? "series" : tab === "sports" ? "sports" : tab === "music" ? "music" : tab === "kids" ? "kids" : "content"}…`}
                  className="pl-9 bg-[var(--iptv-surface)] border-[var(--iptv-border)] text-white placeholder:text-[var(--iptv-text-dim)] h-9"
                />
              </div>
              <Button
                variant={showFavsOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFavsOnly((v) => !v)}
                className={
                  showFavsOnly
                    ? "bg-[var(--iptv-gold)] hover:bg-[var(--iptv-gold-dim)] text-[#0a0a14] border-[var(--iptv-gold)]"
                    : "bg-[var(--iptv-surface)] border-[var(--iptv-border)] text-[var(--iptv-text-muted)] hover:text-white"
                }
              >
                <Heart className={`w-4 h-4 mr-1.5 ${showFavsOnly ? "fill-current" : ""}`} />
                Favorites
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 flex max-w-[1600px] w-full mx-auto min-h-0">
          {/* Sidebar */}
          {showSidebar && (
            <aside className="hidden md:block w-56 flex-shrink-0 border-r border-[var(--iptv-border)]">
              <ScrollArea className="h-[calc(100vh-9rem)]">
                <div className="p-3">
                  <p className="px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--iptv-text-muted)]">
                    Categories
                  </p>
                  {tab === "live" && (
                    <CategoryList
                      categories={liveCategories}
                      active={activeLiveCat}
                      onSelect={setActiveLiveCat}
                      loading={liveLoading}
                    />
                  )}
                  {tab === "vod" && (
                    <CategoryList
                      categories={vodCategories}
                      active={activeVodCat}
                      onSelect={setActiveVodCat}
                      loading={vodLoading}
                    />
                  )}
                  {tab === "series" && (
                    <CategoryList
                      categories={seriesCategories}
                      active={activeSeriesCat}
                      onSelect={setActiveSeriesCat}
                      loading={seriesLoading}
                    />
                  )}
                </div>
              </ScrollArea>
            </aside>
          )}

          {/* Mobile category dropdown */}
          {showSidebar && (
            <div className="md:hidden border-b border-[var(--iptv-border)] bg-[var(--iptv-bg-elevated)] px-4 py-2 w-full">
              {tab === "live" && (
                <MobileCategorySelect
                  categories={liveCategories}
                  active={activeLiveCat}
                  onSelect={setActiveLiveCat}
                />
              )}
              {tab === "vod" && (
                <MobileCategorySelect
                  categories={vodCategories}
                  active={activeVodCat}
                  onSelect={setActiveVodCat}
                />
              )}
              {tab === "series" && (
                <MobileCategorySelect
                  categories={seriesCategories}
                  active={activeSeriesCat}
                  onSelect={setActiveSeriesCat}
                />
              )}
            </div>
          )}

          {/* Main content area */}
          <div className="flex-1 min-w-0 overflow-y-auto">
            <div className="p-4 sm:p-6">
              {/* HOME */}
              {tab === "home" && (
                <HomeTab
                  creds={creds}
                  liveStreams={liveStreams}
                  vodStreams={vodStreams}
                  seriesItems={seriesItems}
                  liveCategories={liveCategories}
                  vodCategories={vodCategories}
                  seriesCategories={seriesCategories}
                  favTick={favTick}
                  listTick={listTick}
                  onPlayLive={playLive}
                  onPlayVod={playVod}
                  onOpenSeries={openSeries}
                  onShowEpg={(s) => setEpgStream(s)}
                  onToggleFavLive={toggleFavLive}
                  onToggleFavVod={toggleFavVod}
                  onToggleFavSeries={toggleFavSeries}
                  onToggleList={handleToggleList}
                  onGoToTab={(t) => setTab(t as NavTab)}
                />
              )}

              {/* LIVE / SPORTS / MUSIC / KIDS — all use liveStreams grid */}
              {(tab === "live" || tab === "sports" || tab === "music" || tab === "kids") && (
                <>
                  {liveLoading ? (
                    <GridSkeleton />
                  ) : filteredLive.length === 0 ? (
                    <EmptyState label="channels" />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {filteredLive.map((s) => (
                        <ContentCard
                          key={s.stream_id}
                          kind="live"
                          stream={s}
                          onPlay={() => playLive(s)}
                          onShowEpg={() => setEpgStream(s)}
                          isFav={favorites.live.has(String(s.stream_id))}
                          onToggleFav={() => toggleFavLive(s.stream_id)}
                          onToggleList={() =>
                            handleToggleList({
                              id: String(s.stream_id),
                              kind: "live",
                              title: s.name,
                              icon: s.stream_icon,
                            })
                          }
                          isAdded={myList.has(String(s.stream_id), "live")}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* MOVIES */}
              {tab === "vod" && (
                <>
                  {vodLoading ? (
                    <GridSkeleton />
                  ) : visibleVod.length === 0 ? (
                    <EmptyState label="movies" />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {visibleVod.map((s) => (
                        <ContentCard
                          key={s.stream_id}
                          kind="vod"
                          stream={s}
                          onPlay={() => playVod(s)}
                          isFav={favorites.vod.has(String(s.stream_id))}
                          onToggleFav={() => toggleFavVod(s.stream_id)}
                          onToggleList={() =>
                            handleToggleList({
                              id: String(s.stream_id),
                              kind: "vod",
                              title: s.name,
                              icon: s.stream_icon,
                            })
                          }
                          isAdded={myList.has(String(s.stream_id), "vod")}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* SERIES */}
              {tab === "series" && (
                <>
                  {seriesLoading ? (
                    <GridSkeleton />
                  ) : visibleSeries.length === 0 ? (
                    <EmptyState label="series" />
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {visibleSeries.map((s) => (
                        <ContentCard
                          key={s.series_id}
                          kind="series"
                          item={s}
                          onPlay={() => openSeries(s)}
                          isFav={favorites.series.has(String(s.series_id))}
                          onToggleFav={() => toggleFavSeries(s.series_id)}
                          onToggleList={() =>
                            handleToggleList({
                              id: String(s.series_id),
                              kind: "series",
                              title: s.name,
                              icon: s.cover,
                            })
                          }
                          isAdded={myList.has(String(s.series_id), "series")}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* GENRES — show all categories */}
              {genresView && (
                <section>
                  <h2 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
                    <Tv className="w-5 h-5 text-[var(--iptv-gold)]" />
                    All Live TV Categories
                  </h2>
                  {liveLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {Array.from({ length: 15 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full bg-[var(--iptv-surface)]" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {liveCategories.map((c) => {
                        const count = liveStreams.filter(
                          (s) => String(s.category_id) === c.category_id
                        ).length;
                        return (
                          <button
                            key={c.category_id}
                            onClick={() => {
                              setActiveLiveCat(c.category_id);
                              setTab("live");
                            }}
                            className="group p-4 rounded-lg bg-[var(--iptv-surface)] border border-[var(--iptv-border)] hover:border-[var(--iptv-gold)] hover:bg-[var(--iptv-surface-hover)] transition text-left"
                          >
                            <p className="text-sm font-medium text-white truncate group-hover:text-[var(--iptv-gold)] transition">
                              {c.category_name}
                            </p>
                            <p className="text-xs text-[var(--iptv-text-dim)] mt-1">
                              {count.toLocaleString()} channels
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <h2 className="flex items-center gap-2 text-lg font-bold text-white mb-4 mt-10">
                    <Film className="w-5 h-5 text-[var(--iptv-gold)]" />
                    All Movie Categories
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {vodCategories.map((c) => {
                      const count = vodStreams.filter(
                        (s) => String(s.category_id) === c.category_id
                      ).length;
                      return (
                        <button
                          key={c.category_id}
                          onClick={() => {
                            setActiveVodCat(c.category_id);
                            setTab("vod");
                          }}
                          className="group p-4 rounded-lg bg-[var(--iptv-surface)] border border-[var(--iptv-border)] hover:border-[var(--iptv-gold)] hover:bg-[var(--iptv-surface-hover)] transition text-left"
                        >
                          <p className="text-sm font-medium text-white truncate group-hover:text-[var(--iptv-gold)] transition">
                            {c.category_name}
                          </p>
                          <p className="text-xs text-[var(--iptv-text-dim)] mt-1">
                            {count.toLocaleString()} movies
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <h2 className="flex items-center gap-2 text-lg font-bold text-white mb-4 mt-10">
                    <MonitorPlay className="w-5 h-5 text-[var(--iptv-neon)]" />
                    All Series Categories
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {seriesCategories.map((c) => {
                      const count = seriesItems.filter(
                        (s) => String(s.category_id) === c.category_id
                      ).length;
                      return (
                        <button
                          key={c.category_id}
                          onClick={() => {
                            setActiveSeriesCat(c.category_id);
                            setTab("series");
                          }}
                          className="group p-4 rounded-lg bg-[var(--iptv-surface)] border border-[var(--iptv-border)] hover:border-[var(--iptv-neon)] hover:bg-[var(--iptv-surface-hover)] transition text-left"
                        >
                          <p className="text-sm font-medium text-white truncate group-hover:text-[var(--iptv-neon)] transition">
                            {c.category_name}
                          </p>
                          <p className="text-xs text-[var(--iptv-text-dim)] mt-1">
                            {count.toLocaleString()} series
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </main>

      <AppFooter serverName={serverName} />

      {/* Player modal */}
      {playing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur">
          <div className="w-full max-w-5xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white text-base font-semibold truncate">{playing.title}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPlaying(null)}
                className="text-zinc-400 hover:text-white"
              >
                Close
              </Button>
            </div>
            <VideoPlayer
              src={
                playing.kind === "live"
                  ? Xtream.liveStreamUrl(creds, playing.streamId, settings.liveFormat)
                  : Xtream.vodStreamUrl(creds, playing.streamId, playing.container)
              }
              mode={playing.kind === "live" ? "hls" : "auto"}
              poster={playing.icon}
              title={playing.title}
              onClose={() => setPlaying(null)}
            />
          </div>
        </div>
      )}

      {selectedSeries && (
        <SeriesDetail
          creds={creds}
          series={selectedSeries}
          onClose={() => setSelectedSeries(null)}
        />
      )}

      {epgStream && (
        <EpgModal creds={creds} stream={epgStream} onClose={() => setEpgStream(null)} />
      )}

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}

/* ---------- Sub-components ---------- */

function CategoryList({
  categories,
  active,
  onSelect,
  loading,
}: {
  categories: Category[];
  active: string;
  onSelect: (id: string) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-full bg-[var(--iptv-surface)]" />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-0.5">
      <button
        onClick={() => onSelect("all")}
        className={`w-full text-left px-2.5 py-1.5 rounded text-sm transition ${
          active === "all"
            ? "bg-[var(--iptv-surface-hover)] text-white border-l-2 border-[var(--iptv-gold)]"
            : "text-[var(--iptv-text-muted)] hover:bg-[var(--iptv-surface)] hover:text-white"
        }`}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c.category_id}
          onClick={() => onSelect(c.category_id)}
          className={`w-full text-left px-2.5 py-1.5 rounded text-sm truncate transition ${
            active === c.category_id
              ? "bg-[var(--iptv-surface-hover)] text-white border-l-2 border-[var(--iptv-gold)]"
              : "text-[var(--iptv-text-muted)] hover:bg-[var(--iptv-surface)] hover:text-white"
          }`}
          title={c.category_name}
        >
          {c.category_name}
        </button>
      ))}
    </div>
  );
}

function MobileCategorySelect({
  categories,
  active,
  onSelect,
}: {
  categories: Category[];
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <select
      value={active}
      onChange={(e) => onSelect(e.target.value)}
      className="w-full bg-[var(--iptv-surface)] border border-[var(--iptv-border)] text-white text-sm rounded px-3 py-2"
    >
      <option value="all">All categories</option>
      {categories.map((c) => (
        <option key={c.category_id} value={c.category_id}>
          {c.category_name}
        </option>
      ))}
    </select>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="bg-[var(--iptv-surface)] rounded-lg overflow-hidden border border-[var(--iptv-border)]">
          <Skeleton className="aspect-[2/3] w-full bg-[var(--iptv-bg-elevated)]" />
          <div className="p-2">
            <Skeleton className="h-3 w-3/4 bg-[var(--iptv-bg-elevated)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-[var(--iptv-text-muted)]">
      <Search className="w-12 h-12 mb-3 opacity-50" />
      <p className="text-sm">No {label} found</p>
      <p className="text-xs text-[var(--iptv-text-dim)] mt-1">Try a different search or category</p>
    </div>
  );
}
