"use client";

import { Film, MonitorPlay, Grid2x2, Tv, Smartphone } from "lucide-react";

/**
 * Mid-page "Premium Streaming Showcase" banner.
 * Matches the NovaStream PDF design: a horizontal strip with 5 feature pills.
 */
export function PremiumShowcase() {
  const items = [
    { icon: <Film className="w-5 h-5" />, label: "Blockbuster", sub: "Movies" },
    { icon: <MonitorPlay className="w-5 h-5" />, label: "Trending", sub: "Series" },
    { icon: <Grid2x2 className="w-5 h-5" />, label: "All Genres", sub: "Action · Drama · Sci-Fi" },
    { icon: <Tv className="w-5 h-5" />, label: "High Quality", sub: "Streaming 4K" },
    { icon: <Smartphone className="w-5 h-5" />, label: "Watch Anywhere", sub: "Any Device" },
  ];

  return (
    <section className="iptv-glass rounded-xl p-5 sm:p-6">
      <div className="text-center mb-5">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--iptv-gold)] font-bold mb-1">
          Premium Streaming Showcase
        </p>
        <p className="text-xs text-[var(--iptv-text-muted)]">
          Trending · New Releases · On Demand
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {items.map((item, i) => (
          <div
            key={i}
            className="group flex flex-col items-center text-center p-4 rounded-lg bg-[var(--iptv-surface)] border border-[var(--iptv-border)] hover:border-[var(--iptv-gold)] hover:bg-[var(--iptv-surface-hover)] transition cursor-default"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--iptv-gold)]/15 flex items-center justify-center text-[var(--iptv-gold)] mb-2 group-hover:bg-[var(--iptv-gold)]/25 transition">
              {item.icon}
            </div>
            <p className="text-sm font-bold text-white">{item.label}</p>
            <p className="text-[10px] text-[var(--iptv-text-muted)] mt-0.5">{item.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Universal Device Compatibility section.
 */
export function DeviceCompatibility() {
  const devices = [
    { label: "Apple TV & iOS", emoji: "" },
    { label: "Android TV & Google TV", emoji: "" },
    { label: "Amazon Fire TV", emoji: "" },
    { label: "Samsung & LG Smart TVs", emoji: "" },
    { label: "PC / Mac / Linux", emoji: "" },
    { label: "Smartphones & Tablets", emoji: "" },
  ];

  return (
    <section className="iptv-glass rounded-xl p-5 sm:p-6">
      <div className="text-center mb-5">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-1">
          Universal Device Compatibility
        </h2>
        <p className="text-xs text-[var(--iptv-text-muted)] max-w-2xl mx-auto">
          Stream seamlessly on 4K Smart TVs, TV Boxes, Apple TV, Firestick, PC, Mac, tablets, and mobile devices.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {devices.map((d, i) => (
          <div
            key={i}
            className="flex items-center justify-center text-center p-3 rounded-lg bg-[var(--iptv-surface)] border border-[var(--iptv-border)] hover:border-[var(--iptv-neon)] transition"
          >
            <span className="text-xs text-[var(--iptv-text-muted)]">{d.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
