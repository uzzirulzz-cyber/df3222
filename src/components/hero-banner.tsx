"use client";

import { useState, useEffect } from "react";
import { Play, Plus, Check, Star, Calendar, Clock, Info, Server, Activity, Wifi, Crown, Radio, Settings2, CalendarDays } from "lucide-react";
import { proxyImageUrl } from "@/lib/image-proxy";

export interface HeroSlide {
  id: string;
  kind: "live" | "vod" | "series";
  title: string;
  description: string;
  genre?: string;
  rating?: number;
  year?: string;
  duration?: string;
  backdrop?: string;
  logo?: string;
}

interface HeroBannerProps {
  slides: HeroSlide[];
  onWatch: (slide: HeroSlide) => void;
  onAddToList: (slide: HeroSlide) => void;
  isAdded: (slide: HeroSlide) => boolean;
  vipUser?: string;
  renewalDate?: string;
  serverName?: string;
  ping?: string;
  bitrate?: string;
  onOpenSettings?: () => void;
  onOpenEpg?: () => void;
}

export function HeroBanner({
  slides,
  onWatch,
  onAddToList,
  isAdded,
  vipUser,
  renewalDate,
  serverName,
  ping,
  bitrate,
  onOpenSettings,
  onOpenEpg,
}: HeroBannerProps) {
  const [index, setIndex] = useState(0);

  // Auto-rotate every 10s
  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 10000);
    return () => clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <div className="relative w-full aspect-[21/9] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--iptv-bg-elevated)] via-[var(--iptv-surface)] to-[var(--iptv-bg-elevated)] border border-[var(--iptv-border)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-[var(--iptv-gold)] to-[var(--iptv-gold-dim)] flex items-center justify-center shadow-[0_0_30px_rgba(245,184,0,0.4)]">
            <Play className="w-7 h-7 text-[#0a0a14] fill-current ml-0.5" />
          </div>
          <p className="text-white text-lg font-semibold">Welcome to .live</p>
          <p className="text-[var(--iptv-text-muted)] text-sm mt-1">
            Loading featured content…
          </p>
        </div>
      </div>
    );
  }

  const slide = slides[index];

  return (
    <div className="relative w-full aspect-[21/9] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-[var(--iptv-border)] group">
      {/* Backdrop */}
      {slide.backdrop ? (
        <img
          key={slide.id}
          src={proxyImageUrl(slide.backdrop)}
          alt={slide.title}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--iptv-bg-elevated)] via-[var(--iptv-surface)] to-[var(--iptv-bg-elevated)]" />
      )}

      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 iptv-hero-overlay" />

      {/* Top server info bar */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-[10px] sm:text-xs">
          <span className="px-2 py-1 rounded-md bg-[var(--iptv-gold)]/15 border border-[var(--iptv-gold)]/30 text-[var(--iptv-gold)] font-semibold uppercase tracking-wider flex items-center gap-1">
            <Server className="w-3 h-3" /> Playbeat Gateway
          </span>
          {serverName && (
            <span className="text-[var(--iptv-text-muted)] hidden sm:inline">
              · {serverName.replace(/^https?:\/\//, "")}
            </span>
          )}
          {ping && (
            <span className="flex items-center gap-1 text-[var(--iptv-green)] font-medium">
              <Activity className="w-3 h-3" />{ping}
            </span>
          )}
          {bitrate && (
            <span className="text-[var(--iptv-neon)] font-medium">{bitrate}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {vipUser && (
            <span className="px-2 py-1 rounded-md bg-[var(--iptv-neon)]/15 border border-[var(--iptv-neon)]/30 text-[var(--iptv-neon)] text-[10px] sm:text-xs font-semibold flex items-center gap-1">
              <Crown className="w-3 h-3" /> VIP: {vipUser}
            </span>
          )}
          {renewalDate && (
            <span className="text-[10px] sm:text-xs text-[var(--iptv-text-muted)] flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />Renewal: {renewalDate}
            </span>
          )}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="px-2.5 py-1 rounded-md bg-white/10 border border-white/20 text-white text-[10px] sm:text-xs font-medium hover:bg-white/20 transition flex items-center gap-1"
            >
              <Settings2 className="w-3 h-3" /> Proxy
            </button>
          )}
          {onOpenEpg && (
            <button
              onClick={onOpenEpg}
              className="px-2.5 py-1 rounded-md bg-white/10 border border-white/20 text-white text-[10px] sm:text-xs font-medium hover:bg-white/20 transition flex items-center gap-1"
            >
              <Radio className="w-3 h-3" /> EPG Guide
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-6 sm:p-10 lg:p-14 max-w-2xl">
        {/* Featured premiere tag */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-widest text-[var(--iptv-gold)] font-bold flex items-center gap-1">
            <Star className="w-3 h-3 fill-current" /> Featured Premiere
          </span>
          <span className="text-[10px] text-[var(--iptv-text-dim)]">·</span>
          <span className="text-[10px] uppercase tracking-widest text-[var(--iptv-neon)] font-semibold">
            4K HDR · Dolby Atmos
          </span>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          {slide.kind === "live" && (
            <span className="iptv-badge-live text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white iptv-pulse" />
              LIVE NOW
            </span>
          )}
          {slide.genre && (
            <span className="text-[10px] uppercase tracking-widest text-[var(--iptv-text-muted)] font-medium">
              {slide.genre}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3 drop-shadow-lg">
          {slide.title}
        </h1>

        {/* Description */}
        {slide.description && (
          <p className="text-sm sm:text-base text-[var(--iptv-text-muted)] line-clamp-2 mb-4 max-w-xl">
            {slide.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-[var(--iptv-text-muted)] mb-5">
          {slide.rating && slide.rating > 0 && (
            <span className="flex items-center gap-1 text-[var(--iptv-gold)] font-semibold">
              <Star className="w-3.5 h-3.5 fill-current" />
              {slide.rating.toFixed(1)} / 10
            </span>
          )}
          {slide.year && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {slide.year}
            </span>
          )}
          {slide.duration && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {slide.duration}
            </span>
          )}
          {slide.genre && (
            <span className="text-[var(--iptv-neon)]">{slide.genre}</span>
          )}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => onWatch(slide)}
            className="iptv-btn-gold flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold"
          >
            <Play className="w-4 h-4 fill-current" />
            Watch Now
          </button>
          <button
            onClick={() => onAddToList(slide)}
            className="iptv-btn-ghost flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base"
          >
            {isAdded(slide) ? (
              <>
                <Check className="w-4 h-4 text-[var(--iptv-green)]" /> In My List
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Add to List
              </>
            )}
          </button>
          <button
            className="hidden sm:flex iptv-btn-ghost items-center gap-2 px-4 py-2.5 rounded-lg text-sm"
            aria-label="More info"
          >
            <Info className="w-4 h-4" /> More Info
          </button>
        </div>
      </div>

      {/* Dot indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 right-6 flex items-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index
                  ? "w-6 bg-[var(--iptv-gold)] shadow-[0_0_8px_rgba(245,184,0,0.7)]"
                  : "w-1.5 bg-white/30 hover:bg-white/60"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
