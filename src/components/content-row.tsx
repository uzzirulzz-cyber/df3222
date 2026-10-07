"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ContentRowProps {
  title: string;
  icon?: React.ReactNode;
  accent?: "gold" | "neon" | "red" | "green";
  children: React.ReactNode;
  /** When empty, hide the row entirely */
  isEmpty?: boolean;
  /** Optional badge text (e.g. "TOP 10", "TRENDING", "NEW") */
  badge?: string;
  badgeAccent?: "gold" | "neon" | "red" | "green";
  /** Optional subtitle */
  subtitle?: string;
}

const ACCENT_MAP: Record<string, string> = {
  gold: "text-[var(--iptv-gold)]",
  neon: "text-[var(--iptv-neon)]",
  red: "text-[var(--iptv-red)]",
  green: "text-[var(--iptv-green)]",
};

const BADGE_STYLES: Record<string, string> = {
  gold: "bg-[var(--iptv-gold)]/15 border-[var(--iptv-gold)]/30 text-[var(--iptv-gold)]",
  neon: "bg-[var(--iptv-neon)]/15 border-[var(--iptv-neon)]/30 text-[var(--iptv-neon)]",
  red: "bg-[var(--iptv-red)]/15 border-[var(--iptv-red)]/30 text-[var(--iptv-red)]",
  green: "bg-[var(--iptv-green)]/15 border-[var(--iptv-green)]/30 text-[var(--iptv-green)]",
};

export function ContentRow({
  title,
  icon,
  accent = "gold",
  children,
  isEmpty,
  badge,
  badgeAccent = "gold",
  subtitle,
}: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (isEmpty) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 800), behavior: "smooth" });
  };

  return (
    <section className="group/row">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="flex items-center gap-2 text-base sm:text-lg font-bold text-white">
            {icon && <span className={ACCENT_MAP[accent]}>{icon}</span>}
            {title}
          </h2>
          {badge && (
            <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-widest ${BADGE_STYLES[badgeAccent]}`}>
              {badge}
            </span>
          )}
          {subtitle && (
            <span className="hidden sm:block text-xs text-[var(--iptv-text-dim)] ml-2">
              {subtitle}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition">
          <button
            onClick={() => scrollBy(-1)}
            className="w-7 h-7 rounded-full bg-[var(--iptv-surface)] border border-[var(--iptv-border)] flex items-center justify-center text-[var(--iptv-text-muted)] hover:text-white hover:border-[var(--iptv-gold)] transition"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollBy(1)}
            className="w-7 h-7 rounded-full bg-[var(--iptv-surface)] border border-[var(--iptv-border)] flex items-center justify-center text-[var(--iptv-text-muted)] hover:text-white hover:border-[var(--iptv-gold)] transition"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="iptv-scroll-x flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory"
      >
        {children}
      </div>
    </section>
  );
}

export function RowItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 snap-start">
      {children}
    </div>
  );
}
