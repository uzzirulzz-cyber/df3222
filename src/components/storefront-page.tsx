"use client";

import { useRouter } from "next/navigation";
import {
  Tv,
  Play,
  Plus,
  Star,
  Calendar,
  Clock,
  Server,
  Activity,
  Wifi,
  Crown,
  Radio,
  Film,
  MonitorPlay,
  Grid2x2,
  Smartphone,
  Lock,
  ArrowRight,
  Check,
  Sparkles,
  Trophy,
  Music,
  Baby,
  Flame,
  TrendingUp,
} from "lucide-react";
import { PremiumShowcase, DeviceCompatibility } from "./showcase-sections";
import { AppFooter } from "./app-footer";

/**
 * Public storefront landing page.
 *
 * This page is OPEN TO EVERYONE — no login required, no Xtream credentials
 * needed. It shows marketing content only (branding, features, device
 * compatibility, CTAs). No real IPTV channel names, no streams, no posters.
 *
 * The actual IPTV player with real content lives at /admin behind the Xtream
 * login.
 */
export function StorefrontPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--iptv-bg)", color: "var(--iptv-text)" }}>
      {/* Top nav (simplified — no settings/logout, just a Sign In CTA) */}
      <header className="sticky top-0 z-40 iptv-glass border-b border-[var(--iptv-border)]">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center h-16 gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--iptv-gold-bright)] to-[var(--iptv-gold-dim)] flex items-center justify-center shadow-[0_0_20px_rgba(245,184,0,0.4)]">
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
                    <Server className="w-2.5 h-2.5" /> NovaStream IPTV
                  </span>
                  <span className="flex items-center gap-0.5 text-[var(--iptv-green)]">
                    <Activity className="w-2.5 h-2.5" /> Online
                  </span>
                </p>
              </div>
            </div>

            {/* Nav links (decorative — scroll to sections) */}
            <nav className="hidden lg:flex items-center gap-0.5 ml-4">
              {["Home", "Live TV", "Movies", "Series", "Sports", "Music", "Kids", "Genres"].map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-[var(--iptv-text-muted)]"
                >
                  {item}
                </span>
              ))}
            </nav>

            <div className="flex-1" />

            {/* Sign in CTA */}
            <button
              onClick={() => router.push("/admin")}
              className="iptv-btn-gold flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold"
            >
              <Lock className="w-4 h-4" /> Sign In
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-12">
          {/* HERO — marketing message, no real content */}
          <section className="relative w-full aspect-[21/9] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-[var(--iptv-border)]">
            {/* Animated gradient background (no real image) */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--iptv-bg-elevated)] via-[var(--iptv-surface)] to-[var(--iptv-bg-elevated)]" />
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background:
                  "radial-gradient(circle at 20% 50%, rgba(245,184,0,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(0,217,255,0.15) 0%, transparent 50%)",
              }}
            />

            {/* Top server info bar */}
            <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-[10px] sm:text-xs">
                <span className="px-2 py-1 rounded-md bg-[var(--iptv-gold)]/15 border border-[var(--iptv-gold)]/30 text-[var(--iptv-gold)] font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Server className="w-3 h-3" /> Playbeat Gateway
                </span>
                <span className="text-[var(--iptv-text-muted)] hidden sm:inline">
                  · advance.playbeat.live:8880
                </span>
                <span className="flex items-center gap-1 text-[var(--iptv-green)] font-medium">
                  <Activity className="w-3 h-3" /> 24ms
                </span>
                <span className="text-[var(--iptv-neon)] font-medium">18.4 Mbps</span>
                <span className="text-[var(--iptv-gold)] font-semibold uppercase text-[9px]">4K</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-md bg-[var(--iptv-neon)]/15 border border-[var(--iptv-neon)]/30 text-[var(--iptv-neon)] text-[10px] sm:text-xs font-semibold flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Premium
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="relative h-full flex flex-col justify-end p-6 sm:p-10 lg:p-14 max-w-2xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-widest text-[var(--iptv-gold)] font-bold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> Featured Premiere
                </span>
                <span className="text-[10px] text-[var(--iptv-text-dim)]">·</span>
                <span className="text-[10px] uppercase tracking-widest text-[var(--iptv-neon)] font-semibold">
                  4K HDR · Dolby Atmos
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3 drop-shadow-lg">
                Stream the extraordinary
              </h1>

              <p className="text-sm sm:text-base text-[var(--iptv-text-muted)] line-clamp-3 mb-4 max-w-xl">
                Your world of entertainment. Over 18,000+ live satellite channels,
                80,000+ VOD movies and series, and live stadium sports feeds in
                native 4K HDR at 60fps with zero buffering.
              </p>

              <div className="flex items-center gap-4 text-xs text-[var(--iptv-text-muted)] mb-5">
                <span className="flex items-center gap-1 text-[var(--iptv-gold)] font-semibold">
                  <Star className="w-3.5 h-3.5 fill-current" /> 9.8 / 10
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> 2026
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> 2h 45m
                </span>
                <span className="text-[var(--iptv-neon)]">Sci-Fi · Cosmic Adventure</span>
              </div>

              {/* CTAs */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => router.push("/admin")}
                  className="iptv-btn-gold flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Sign In to Watch
                </button>
                <button
                  onClick={() => router.push("/admin")}
                  className="iptv-btn-ghost flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4" /> Add to List
                </button>
              </div>
            </div>
          </section>

          {/* Stats bar */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "18,000+", label: "Live Channels", icon: <Tv className="w-5 h-5" />, accent: "gold" },
              { value: "80,000+", label: "Movies & Series", icon: <Film className="w-5 h-5" />, accent: "neon" },
              { value: "4K HDR", label: "60fps Streaming", icon: <Sparkles className="w-5 h-5" />, accent: "gold" },
              { value: "Zero", label: "Buffering", icon: <Activity className="w-5 h-5" />, accent: "green" },
            ].map((stat, i) => (
              <div
                key={i}
                className="iptv-glass rounded-xl p-4 sm:p-5 text-center"
              >
                <div
                  className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center mb-2 ${
                    stat.accent === "gold"
                      ? "bg-[var(--iptv-gold)]/15 text-[var(--iptv-gold)]"
                      : stat.accent === "neon"
                      ? "bg-[var(--iptv-neon)]/15 text-[var(--iptv-neon)]"
                      : "bg-[var(--iptv-green)]/15 text-[var(--iptv-green)]"
                  }`}
                >
                  {stat.icon}
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-[var(--iptv-text-muted)] mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </section>

          {/* Content categories preview */}
          <section>
            <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold text-white mb-4">
              <Grid2x2 className="w-5 h-5 text-[var(--iptv-gold)]" />
              Explore the Catalog
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { icon: <Flame className="w-6 h-6" />, label: "Popular Now", desc: "Most-watched 4K titles", accent: "red" },
                { icon: <TrendingUp className="w-6 h-6" />, label: "Trending", desc: "Blockbuster hits trending today", accent: "gold" },
                { icon: <Film className="w-6 h-6" />, label: "Movies", desc: "Action, thriller, sci-fi & adventure", accent: "gold" },
                { icon: <MonitorPlay className="w-6 h-6" />, label: "TV Series", desc: "Bingeable episodic storytelling", accent: "neon" },
                { icon: <Trophy className="w-6 h-6" />, label: "Live Sports", desc: "Football, cricket, F1 & more", accent: "red" },
                { icon: <Music className="w-6 h-6" />, label: "Music", desc: "Concerts & live performances", accent: "neon" },
                { icon: <Baby className="w-6 h-6" />, label: "Kids", desc: "Family animation & adventures", accent: "gold" },
                { icon: <Radio className="w-6 h-6" />, label: "EPG Guide", desc: "Real-time program guide", accent: "neon" },
              ].map((cat, i) => (
                <button
                  key={i}
                  onClick={() => router.push("/admin")}
                  className="group p-4 rounded-xl bg-[var(--iptv-surface)] border border-[var(--iptv-border)] hover:border-[var(--iptv-gold)] hover:bg-[var(--iptv-surface-hover)] transition text-left"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                      cat.accent === "gold"
                        ? "bg-[var(--iptv-gold)]/15 text-[var(--iptv-gold)]"
                        : cat.accent === "neon"
                        ? "bg-[var(--iptv-neon)]/15 text-[var(--iptv-neon)]"
                        : "bg-[var(--iptv-red)]/15 text-[var(--iptv-red)]"
                    } group-hover:scale-110 transition`}
                  >
                    {cat.icon}
                  </div>
                  <p className="text-sm font-bold text-white">{cat.label}</p>
                  <p className="text-[10px] text-[var(--iptv-text-muted)] mt-0.5">{cat.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Premium Showcase */}
          <PremiumShowcase />

          {/* Sign in CTA banner */}
          <section className="relative rounded-2xl overflow-hidden border border-[var(--iptv-border)] p-8 sm:p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--iptv-bg-elevated)] via-[var(--iptv-surface)] to-[var(--iptv-bg-elevated)]" />
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(245,184,0,0.2) 0%, transparent 60%)",
              }}
            />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Ready to stream?
              </h2>
              <p className="text-sm text-[var(--iptv-text-muted)] max-w-md mx-auto mb-6">
                Sign in with your Xtream Codes credentials to access the full
                dashboard, live channels, movies, series, and sports feeds.
              </p>
              <button
                onClick={() => router.push("/admin")}
                className="iptv-btn-gold inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-lg text-sm sm:text-base font-semibold"
              >
                <Lock className="w-4 h-4" /> Go to Admin Login
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="flex items-center justify-center gap-4 mt-6 text-[10px] text-[var(--iptv-text-dim)]">
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-[var(--iptv-green)]" /> Personal use
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-[var(--iptv-green)]" /> Credentials stay on your device
                </span>
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-[var(--iptv-green)]" /> No server-side storage
                </span>
              </div>
            </div>
          </section>

          {/* Device Compatibility */}
          <DeviceCompatibility />
        </div>
      </main>

      <AppFooter serverName="advance.playbeat.live:8880" />
    </div>
  );
}
