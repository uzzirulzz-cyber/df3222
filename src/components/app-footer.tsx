"use client";

import { Tv, Smartphone, Monitor, Tablet, Github, Globe } from "lucide-react";

interface AppFooterProps {
  serverName: string;
}

export function AppFooter({ serverName }: AppFooterProps) {
  return (
    <footer className="mt-12 border-t border-[var(--iptv-border)] bg-[var(--iptv-bg-elevated)]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[var(--iptv-gold-bright)] to-[var(--iptv-gold-dim)] flex items-center justify-center">
                <Tv className="w-4 h-4 text-[#0a0a14]" />
              </div>
              <p className="font-bold text-white">
                <span className="iptv-text-gold">IPTV</span> PRO
              </p>
            </div>
            <p className="text-xs text-[var(--iptv-text-dim)] leading-relaxed">
              Self-hosted personal IPTV player. Your credentials stay on your device.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--iptv-text-muted)] font-semibold mb-3">
              Company
            </p>
            <ul className="space-y-2 text-xs text-[var(--iptv-text-dim)]">
              <li><a className="hover:text-[var(--iptv-gold)] transition cursor-pointer">About</a></li>
              <li><a className="hover:text-[var(--iptv-gold)] transition cursor-pointer">Support</a></li>
              <li><a className="hover:text-[var(--iptv-gold)] transition cursor-pointer">Careers</a></li>
              <li><a className="hover:text-[var(--iptv-gold)] transition cursor-pointer">Press</a></li>
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--iptv-text-muted)] font-semibold mb-3">
              Legal
            </p>
            <ul className="space-y-2 text-xs text-[var(--iptv-text-dim)]">
              <li><a className="hover:text-[var(--iptv-gold)] transition cursor-pointer">Terms of Service</a></li>
              <li><a className="hover:text-[var(--iptv-gold)] transition cursor-pointer">Privacy Policy</a></li>
              <li><a className="hover:text-[var(--iptv-gold)] transition cursor-pointer">Cookie Policy</a></li>
              <li><a className="hover:text-[var(--iptv-gold)] transition cursor-pointer">DMCA</a></li>
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--iptv-text-muted)] font-semibold mb-3">
              Compatible Devices
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { icon: <Tv className="w-3.5 h-3.5" />, label: "Smart TV" },
                { icon: <Monitor className="w-3.5 h-3.5" />, label: "Desktop" },
                { icon: <Smartphone className="w-3.5 h-3.5" />, label: "Mobile" },
                { icon: <Tablet className="w-3.5 h-3.5" />, label: "Tablet" },
              ].map((d) => (
                <span
                  key={d.label}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--iptv-surface)] border border-[var(--iptv-border)] text-[10px] text-[var(--iptv-text-muted)]"
                >
                  {d.icon} {d.label}
                </span>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <a className="text-[var(--iptv-text-dim)] hover:text-[var(--iptv-gold)] transition cursor-pointer">
                <Globe className="w-4 h-4" />
              </a>
              <a className="text-[var(--iptv-text-dim)] hover:text-[var(--iptv-gold)] transition cursor-pointer">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--iptv-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-[var(--iptv-text-dim)]">
            © {new Date().getFullYear()} IPTV Pro · Personal use only · Connected to{" "}
            <span className="text-[var(--iptv-text-muted)]">
              {serverName.replace(/^https?:\/\//, "")}
            </span>
          </p>
          <p className="text-[10px] text-[var(--iptv-text-dim)] italic">
            Respect your provider&apos;s terms of service.
          </p>
        </div>
      </div>
    </footer>
  );
}
