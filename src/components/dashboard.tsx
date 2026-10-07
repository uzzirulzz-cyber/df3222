"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tv,
  Film,
  MonitorPlay,
  Search,
  LogOut,
  Star,
  Server,
  Heart,
  Home as HomeIcon,
  Settings2,
  Calendar,
} from "lucide-react";
import type {
  XtreamCredentials,
  Category,
  LiveStream,
  VodStream,
  SeriesItem,
} from "@/lib/xtream";
import { Xtream } from "@/lib/xtream";
import { favorites, loadSettings, saveSettings, type IptvSettings } from "@/lib/storage";
import { VideoPlayer } from "./video-player";
import { SeriesDetail } from "./series-detail";
import { SettingsDialog } from "./settings-dialog";
import { EpgModal } from "./epg-modal";
import { HomeTab } from "./home-tab";

interface DashboardProps {
  creds: XtreamCredentials;
  serverName: string;
  onLogout: () => void;
}

type ContentType = "home" | "live" | "vod" | "series";
type PlayingItem =
  | { kind: "live"; streamId: number; title: string; icon?: string }
  | { kind: "vod"; streamId: number; title: string; container: string; icon?: string }
  | null;

export function Dashboard({ creds, serverName, onLogout }: DashboardProps) {
  const [tab, setTab] = useState<ContentType>("home");

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
  const [favTick, setFavTick] = useState(0); // bump to re-render after fav toggle

  // Settings
  const [settings, setSettings] = useState<IptvSettings>(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Initial load: live categories + streams
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

  // VOD load — eager when on Home, lazy otherwise
  useEffect(() => {
    if (vodCategories.length > 0) return;
    // Load on Home or VOD tab
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

  // Series load — eager when on Home, lazy otherwise
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

  // Reset filters when switching tabs (not on Home)
  useEffect(() => {
    if (tab === "home") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearch("");
    setShowFavsOnly(false);
  }, [tab]);

  // Filter + search
  const visibleLive = useMemo(() => {
    let list = liveStreams;
    if (activeLiveCat !== "all") {
      list = list.filter((s) => String(s.category_id) === activeLiveCat);
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
  }, [liveStreams, activeLiveCat, showFavsOnly, search, favTick]);

  const visibleVod = useMemo(() => {
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

  const handleSaveSettings = (s: IptvSettings) => {
    setSettings(s);
    saveSettings(s);
  };

  // Common handlers for playing from Home or grid
  const playLive = (s: LiveStream) =>
    setPlaying({
      kind: "live",
      streamId: s.stream_id,
      title: s.name,
      icon: s.stream_icon,
    });
  const playVod = (s: VodStream) =>
    setPlaying({
      kind: "vod",
      streamId: s.stream_id,
      title: s.name,
      container: s.container_extension,
      icon: s.stream_icon,
    });

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center flex-shrink-0">
            <Tv className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold truncate">Personal IPTV</h1>
            <p className="text-xs text-zinc-500 flex items-center gap-1 truncate">
              <Server className="w-3 h-3" /> {serverName}
              <span className="mx-1.5 text-zinc-700">·</span>
              <span className="uppercase">{settings.liveFormat}</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            aria-label="Settings"
          >
            <Settings2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <Tabs value={tab} onValueChange={(v) => setTab(v as ContentType)} className="flex-1 flex flex-col">
          <div className="border-b border-zinc-800 bg-zinc-950">
            <TabsList className="bg-transparent h-auto p-0 rounded-none">
              <TabsTrigger
                value="home"
                className="data-[state=active]:bg-zinc-900 data-[state=active]:text-white text-zinc-400 rounded-none border-b-2 border-transparent data-[state=active]:border-rose-500 px-4 py-3"
              >
                <HomeIcon className="w-4 h-4 mr-2" /> Home
              </TabsTrigger>
              <TabsTrigger
                value="live"
                className="data-[state=active]:bg-zinc-900 data-[state=active]:text-white text-zinc-400 rounded-none border-b-2 border-transparent data-[state=active]:border-rose-500 px-4 py-3"
              >
                <Tv className="w-4 h-4 mr-2" /> Live TV
              </TabsTrigger>
              <TabsTrigger
                value="vod"
                className="data-[state=active]:bg-zinc-900 data-[state=active]:text-white text-zinc-400 rounded-none border-b-2 border-transparent data-[state=active]:border-rose-500 px-4 py-3"
              >
                <Film className="w-4 h-4 mr-2" /> Movies
              </TabsTrigger>
              <TabsTrigger
                value="series"
                className="data-[state=active]:bg-zinc-900 data-[state=active]:text-white text-zinc-400 rounded-none border-b-2 border-transparent data-[state=active]:border-rose-500 px-4 py-3"
              >
                <MonitorPlay className="w-4 h-4 mr-2" /> Series
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Search + favorites toggle (hidden on Home) */}
          {tab !== "home" && (
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-950">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500"
                />
              </div>
              <Button
                variant={showFavsOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFavsOnly((v) => !v)}
                className={
                  showFavsOnly
                    ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-500"
                    : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
                }
              >
                <Heart className={`w-4 h-4 mr-1 ${showFavsOnly ? "fill-current" : ""}`} />
                Favorites
              </Button>
            </div>
          )}

          <div className="flex-1 flex min-h-0">
            {/* Sidebar: categories (hidden on Home) */}
            {tab !== "home" && (
              <aside className="hidden md:block w-60 flex-shrink-0 border-r border-zinc-800 bg-zinc-950">
                <ScrollArea className="h-[calc(100vh-10rem)]">
                  <div className="p-2">
                    <p className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
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

            {/* Mobile category dropdown (hidden on Home) */}
            {tab !== "home" && (
              <div className="md:hidden border-b border-zinc-800 bg-zinc-950 px-4 py-2 w-full">
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

            {/* Content area */}
            <div className="flex-1 min-w-0 overflow-y-auto">
              <TabsContent value="home" className="m-0 p-4">
                <HomeTab
                  creds={creds}
                  liveStreams={liveStreams}
                  vodStreams={vodStreams}
                  seriesItems={seriesItems}
                  liveCategories={liveCategories}
                  vodCategories={vodCategories}
                  seriesCategories={seriesCategories}
                  favTick={favTick}
                  onPlayLive={playLive}
                  onPlayVod={playVod}
                  onOpenSeries={(s) => setSelectedSeries(s)}
                  onGoToTab={(t) => setTab(t)}
                />
              </TabsContent>

              <TabsContent value="live" className="m-0 p-4">
                {liveLoading ? (
                  <GridSkeleton />
                ) : visibleLive.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {visibleLive.map((s) => (
                      <LiveCard
                        key={s.stream_id}
                        stream={s}
                        onPlay={() => playLive(s)}
                        onShowEpg={() => setEpgStream(s)}
                        isFav={favorites.live.has(String(s.stream_id))}
                        onToggleFav={() => toggleFavLive(s.stream_id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="vod" className="m-0 p-4">
                {vodLoading ? (
                  <GridSkeleton />
                ) : visibleVod.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {visibleVod.map((s) => (
                      <VodCard
                        key={s.stream_id}
                        stream={s}
                        onPlay={() => playVod(s)}
                        isFav={favorites.vod.has(String(s.stream_id))}
                        onToggleFav={() => toggleFavVod(s.stream_id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="series" className="m-0 p-4">
                {seriesLoading ? (
                  <GridSkeleton />
                ) : visibleSeries.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {visibleSeries.map((s) => (
                      <SeriesCard
                        key={s.series_id}
                        item={s}
                        onClick={() => setSelectedSeries(s)}
                        isFav={favorites.series.has(String(s.series_id))}
                        onToggleFav={() => toggleFavSeries(s.series_id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </main>

      {/* Player modal */}
      {playing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-5xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white text-sm font-medium truncate">{playing.title}</h2>
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

      {/* Series detail modal */}
      {selectedSeries && (
        <SeriesDetail
          creds={creds}
          series={selectedSeries}
          onClose={() => setSelectedSeries(null)}
        />
      )}

      {/* EPG modal */}
      {epgStream && (
        <EpgModal
          creds={creds}
          stream={epgStream}
          onClose={() => setEpgStream(null)}
        />
      )}

      {/* Settings dialog */}
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
      <div className="space-y-1 p-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-full bg-zinc-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      <button
        onClick={() => onSelect("all")}
        className={`w-full text-left px-2 py-1.5 rounded text-sm ${
          active === "all"
            ? "bg-zinc-800 text-white"
            : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
        }`}
      >
        All
      </button>
      {categories.map((c) => (
        <button
          key={c.category_id}
          onClick={() => onSelect(c.category_id)}
          className={`w-full text-left px-2 py-1.5 rounded text-sm truncate ${
            active === c.category_id
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
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
      className="w-full bg-zinc-900 border border-zinc-800 text-white text-sm rounded px-3 py-2"
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

function LiveCard({
  stream,
  onPlay,
  onShowEpg,
  isFav,
  onToggleFav,
}: {
  stream: LiveStream;
  onPlay: () => void;
  onShowEpg: () => void;
  isFav: boolean;
  onToggleFav: () => void;
}) {
  return (
    <div className="group relative text-left bg-zinc-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-rose-500 transition">
      <button onClick={onPlay} className="block w-full text-left">
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

      {/* Action buttons (top-right) */}
      <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={onShowEpg}
          aria-label="Show program guide"
          title="Program guide"
          className="p-1 rounded-full bg-black/60 backdrop-blur text-white/80 hover:text-white cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onToggleFav}
          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
          title="Favorites"
          className={`p-1 rounded-full bg-black/60 backdrop-blur cursor-pointer ${
            isFav ? "text-rose-500" : "text-white/80 hover:text-white"
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Always-visible star if favorited */}
      {isFav && (
        <span className="absolute top-1.5 right-1.5 group-hover:opacity-0 transition pointer-events-none">
          <span className="block p-1 rounded-full bg-black/60 backdrop-blur text-rose-500">
            <Star className="w-3.5 h-3.5 fill-current" />
          </span>
        </span>
      )}
    </div>
  );
}

function VodCard({
  stream,
  onPlay,
  isFav,
  onToggleFav,
}: {
  stream: VodStream;
  onPlay: () => void;
  isFav: boolean;
  onToggleFav: () => void;
}) {
  return (
    <button
      onClick={onPlay}
      className="group relative text-left bg-zinc-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-rose-500 transition"
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
          <Film className="w-8 h-8 text-zinc-600" />
        )}
      </div>
      <div className="p-2">
        <p className="text-xs text-white line-clamp-2 leading-tight">{stream.name}</p>
        {stream.rating && parseFloat(stream.rating) > 0 && (
          <p className="text-[10px] text-zinc-500 mt-0.5">
            ★ {parseFloat(stream.rating).toFixed(1)}
          </p>
        )}
      </div>
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFav();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            onToggleFav();
          }
        }}
        className={`absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 backdrop-blur cursor-pointer ${
          isFav ? "text-rose-500" : "text-white/60 opacity-0 group-hover:opacity-100"
        }`}
      >
        <Star className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
      </span>
    </button>
  );
}

function SeriesCard({
  item,
  onClick,
  isFav,
  onToggleFav,
}: {
  item: SeriesItem;
  onClick: () => void;
  isFav: boolean;
  onToggleFav: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative text-left bg-zinc-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-rose-500 transition"
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
          <MonitorPlay className="w-8 h-8 text-zinc-600" />
        )}
      </div>
      <div className="p-2">
        <p className="text-xs text-white line-clamp-2 leading-tight">{item.name}</p>
        {item.rating && parseFloat(item.rating) > 0 && (
          <p className="text-[10px] text-zinc-500 mt-0.5">
            ★ {parseFloat(item.rating).toFixed(1)}
          </p>
        )}
      </div>
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFav();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            onToggleFav();
          }
        }}
        className={`absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 backdrop-blur cursor-pointer ${
          isFav ? "text-rose-500" : "text-white/60 opacity-0 group-hover:opacity-100"
        }`}
      >
        <Star className={`w-3.5 h-3.5 ${isFav ? "fill-current" : ""}`} />
      </span>
    </button>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="bg-zinc-900 rounded-lg overflow-hidden">
          <Skeleton className="aspect-square w-full bg-zinc-800" />
          <div className="p-2">
            <Skeleton className="h-3 w-3/4 bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
      <Search className="w-12 h-12 mb-3 opacity-50" />
      <p className="text-sm">No results found</p>
    </div>
  );
}
