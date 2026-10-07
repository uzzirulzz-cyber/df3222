"use client";

import { Tv, Server, Clock, Globe } from "lucide-react";

interface AppFooterProps {
  serverName: string;
  vipUser?: string;
  renewalDate?: string;
  latency?: string;
}

export function AppFooter({ serverName, vipUser, renewalDate, latency }: AppFooterProps) {
  return (
    <footer className="mt-12 border-t border-[var(--iptv-border)] bg-[var(--iptv-bg-elevated)]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-10">
        {/* Top: brand + 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--iptv-gold-bright)] to-[var(--iptv-gold-dim)] flex items-center justify-center">
                <Tv className="w-4 h-4 text-[#0a0a14]" />
              </div>
              <div>
                <p className="font-bold text-white leading-none">
                  <span className="text-[var(--iptv-gold)]">.</span>live
                </p>
                <p className="text-[9px] uppercase tracking-widest text-[var(--iptv-neon)] font-bold mt-0.5">
                  NovaStream IPTV
                </p>
              </div>
            </div>
            <p className="text-xs text-[var(--iptv-text-dim)] leading-relaxed">
              Official playbeat.live IPTV streaming portal delivering over 18,000+ live satellite channels, 80,000+ VOD movies and series, and live stadium sports feeds in native 4K HDR at 60fps with zero buffering.
            </p>
            <p className="text-[10px] text-[var(--iptv-text-dim)] mt-3 flex items-center gap-1">
              <Server className="w-3 h-3" />
              Xtream Codes Gateway: {serverName.replace(/^https?:\/\//, "")}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--iptv-gold)] font-bold mb-3">
              Navigation
            </p>
            <ul className="space-y-2 text-xs text-[var(--iptv-text-dim)]">
              <li><a className="hover:text-[var(--iptv-gold)] transition cursor-pointer">Popular Now</a></li>
              <li><a className="hover:text-[var(--iptv-gold)] transition cursor-pointer">Trending Movies</a></li>
              <li><a className="hover:text-[var(--iptv-gold)] transition cursor-pointer">Live Sports Arena</a></li>
              <li><a className="hover:text-[var(--iptv-gold)] transition cursor-pointer">Electronic Program Guide</a></li>
              <li><a className="hover:text-[var(--iptv-gold)] transition cursor-pointer">Music & Concerts</a></li>
            </ul>
          </div>

          {/* Support & Tools */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--iptv-neon)] font-bold mb-3">
              Support & Tools
            </p>
            <ul className="space-y-2 text-xs text-[var(--iptv-text-dim)]">
              <li><a className="hover:text-[var(--iptv-neon)] transition cursor-pointer">Server Status Check</a></li>
              <li><a className="hover:text-[var(--iptv-neon)] transition cursor-pointer">EPG XMLTV Guide</a></li>
              <li><a className="hover:text-[var(--iptv-neon)] transition cursor-pointer">Network Speed Test</a></li>
              <li><a className="hover:text-[var(--iptv-neon)] transition cursor-pointer">Audio Passthrough Setup</a></li>
              <li><a className="hover:text-[var(--iptv-neon)] transition cursor-pointer">Troubleshooting FAQ</a></li>
            </ul>
          </div>

          {/* Legal & Info */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--iptv-text-muted)] font-bold mb-3">
              Legal & Info
            </p>
            <ul className="space-y-2 text-xs text-[var(--iptv-text-dim)]">
              <li><a className="hover:text-white transition cursor-pointer">Terms of Service</a></li>
              <li><a className="hover:text-white transition cursor-pointer">Privacy Policy</a></li>
              <li><a className="hover:text-white transition cursor-pointer">DMCA Compliance</a></li>
              <li><a className="hover:text-white transition cursor-pointer">Acceptable Use</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-[var(--iptv-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-[var(--iptv-text-dim)]">
            © 2026 NovaStream IPTV Entertainment. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-[10px] text-[var(--iptv-text-dim)]">
            {vipUser && (
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />VIP: {vipUser}
              </span>
            )}
            {renewalDate && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />Next Renewal: {renewalDate}
              </span>
            )}
            {latency && (
              <span className="text-[var(--iptv-green)]">Latency: {latency}</span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
