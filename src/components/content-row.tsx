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
}

const ACCENT_MAP: Record<string, string> = {
  gold: "text-[var(--iptv-gold)]",
  neon: "text-[var(--iptv-neon)]",
  red: "text-[var(--iptv-red)]",
  green: "text-[var(--iptv-green)]",
};

export function ContentRow({
  title,
  icon,
  accent = "gold",
  children,
  isEmpty,
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
        <h2 className="flex items-center gap-2 text-base sm:text-lg font-bold text-white">
          {icon && <span className={ACCENT_MAP[accent]}>{icon}</span>}
          {title}
        </h2>
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
