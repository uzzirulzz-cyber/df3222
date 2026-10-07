"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tv,
  Home as HomeIcon,
  Film,
  MonitorPlay,
  Trophy,
  Music,
  Baby,
  Grid2x2,
  Search,
  Bell,
  Heart,
  User,
  Settings2,
  LogOut,
  Server,
  Menu,
  X,
  Sparkles,
  Activity,
} from "lucide-react";

export type NavTab =
  | "home"
  | "live"
  | "vod"
  | "series"
  | "sports"
  | "music"
  | "kids"
  | "genres";

interface TopNavProps {
  active: NavTab;
  onNavigate: (tab: NavTab) => void;
  search: string;
  onSearchChange: (v: string) => void;
  serverName: string;
  liveFormat: string;
  onOpenSettings: () => void;
  onLogout: () => void;
  vipUser?: string;
  renewalDate?: string;
  ping?: string;
  bitrate?: string;
}

const NAV_ITEMS: { id: NavTab; label: string; icon: React.ReactNode }[] = [
  { id: "home", label: "Home", icon: <HomeIcon className="w-4 h-4" /> },
  { id: "live", label: "Live TV", icon: <Tv className="w-4 h-4" /> },
  { id: "vod", label: "Movies", icon: <Film className="w-4 h-4" /> },
  { id: "series", label: "Series", icon: <MonitorPlay className="w-4 h-4" /> },
  { id: "sports", label: "Sports", icon: <Trophy className="w-4 h-4" /> },
  { id: "music", label: "Music", icon: <Music className="w-4 h-4" /> },
  { id: "kids", label: "Kids", icon: <Baby className="w-4 h-4" /> },
  { id: "genres", label: "Genres", icon: <Grid2x2 className="w-4 h-4" /> },
];

export function TopNav({
  active,
  onNavigate,
  search,
  onSearchChange,
  serverName,
  liveFormat,
  onOpenSettings,
  onLogout,
  vipUser,
  renewalDate,
  ping,
  bitrate,
}: TopNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 iptv-glass border-b border-[var(--iptv-border)]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <button
            onClick={() => onNavigate("home")}
            className="flex items-center gap-2.5 flex-shrink-0 group"
          >
            <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--iptv-gold-bright)] to-[var(--iptv-gold-dim)] flex items-center justify-center shadow-[0_0_20px_rgba(245,184,0,0.4)] group-hover:shadow-[0_0_28px_rgba(245,184,0,0.7)] transition-shadow">
              <Tv className="w-5 h-5 text-[#0a0a14]" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--iptv-green)] iptv-pulse border border-[var(--iptv-bg)]" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-baseline gap-1.5">
                <p className="text-base font-bold tracking-tight leading-none">
                  <span className="text-[var(--iptv-gold)]">.</span>
                  <span className="text-white">live</span>
                </p>
                <span className="text-[9px] uppercase tracking-widest text-[var(--iptv-neon)] font-bold flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> AI CineMatch
                </span>
              </div>
              <p className="text-[10px] text-[var(--iptv-text-dim)] mt-0.5 flex items-center gap-1.5">
                <span className="flex items-center gap-0.5">
                  <Server className="w-2.5 h-2.5" />
                  {serverName.replace(/^https?:\/\//, "").slice(0, 20)}
                </span>
                {ping && (
                  <span className="flex items-center gap-0.5 text-[var(--iptv-green)]">
                    <Activity className="w-2.5 h-2.5" />{ping}
                  </span>
                )}
                {bitrate && (
                  <span className="text-[var(--iptv-neon)]">{bitrate}</span>
                )}
                <span className="px-1 py-0.5 rounded bg-[var(--iptv-surface)] text-[var(--iptv-gold)] font-semibold uppercase text-[9px]">
                  {liveFormat}
                </span>
              </p>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5 ml-4">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  active === item.id
                    ? "bg-gradient-to-r from-[var(--iptv-gold)] to-[var(--iptv-gold-dim)] text-[#0a0a14] shadow-[0_0_12px_rgba(245,184,0,0.5)]"
                    : "text-[var(--iptv-text-muted)] hover:text-white hover:bg-white/5"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right cluster: search + actions */}
          <div className="flex items-center gap-1.5">
            {/* Search (expandable on desktop) */}
            <div className="hidden md:flex items-center">
              {searchOpen ? (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--iptv-text-dim)]" />
                  <Input
                    autoFocus
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onBlur={() => !search && setSearchOpen(false)}
                    placeholder="Search…"
                    className="pl-8 w-48 h-9 bg-[var(--iptv-surface)] border-[var(--iptv-border)] text-white placeholder:text-[var(--iptv-text-dim)] text-sm"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 rounded-md text-[var(--iptv-text-muted)] hover:text-white hover:bg-white/5 transition"
                  aria-label="Search"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Mobile search */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 rounded-md text-[var(--iptv-text-muted)] hover:text-white hover:bg-white/5"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <button
              className="hidden sm:block p-2 rounded-md text-[var(--iptv-text-muted)] hover:text-white hover:bg-white/5 transition relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--iptv-red)] iptv-pulse" />
            </button>

            <button
              onClick={() => onNavigate("home")}
              className="hidden sm:block p-2 rounded-md text-[var(--iptv-text-muted)] hover:text-[var(--iptv-gold)] hover:bg-white/5 transition"
              aria-label="Favorites"
            >
              <Heart className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 rounded-md text-[var(--iptv-text-muted)] hover:text-white hover:bg-white/5 transition"
              aria-label="Settings"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            <button
              className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[var(--iptv-neon)] to-[var(--iptv-neon-dim)] text-[#0a0a14] font-bold text-sm shadow-[0_0_12px_rgba(0,217,255,0.4)]"
              aria-label="Profile"
            >
              <User className="w-4 h-4" />
            </button>

            <button
              onClick={onLogout}
              className="hidden sm:block p-2 rounded-md text-[var(--iptv-text-muted)] hover:text-[var(--iptv-red)] hover:bg-white/5 transition"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden pb-4 border-t border-[var(--iptv-border)] -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3">
            <div className="md:hidden mb-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--iptv-text-dim)]" />
                <Input
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search…"
                  className="pl-8 h-10 bg-[var(--iptv-surface)] border-[var(--iptv-border)] text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileOpen(false);
                  }}
                  className={`flex flex-col items-center gap-1 px-2 py-3 rounded-md text-xs font-medium transition ${
                    active === item.id
                      ? "bg-gradient-to-br from-[var(--iptv-gold)] to-[var(--iptv-gold-dim)] text-[#0a0a14]"
                      : "text-[var(--iptv-text-muted)] hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenSettings}
                className="flex-1 bg-[var(--iptv-surface)] border-[var(--iptv-border)] text-white"
              >
                <Settings2 className="w-4 h-4 mr-2" /> Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="flex-1 bg-[var(--iptv-surface)] border-[var(--iptv-border)] text-[var(--iptv-red)]"
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
