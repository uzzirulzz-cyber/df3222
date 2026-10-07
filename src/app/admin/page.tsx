"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginScreen } from "@/components/login-screen";
import { Dashboard } from "@/components/dashboard";
import { loadCreds, loadAuthInfo, clearCreds, type StoredAuthInfo } from "@/lib/storage";
import type { XtreamCredentials } from "@/lib/xtream";

export default function AdminPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [creds, setCreds] = useState<XtreamCredentials | null>(null);
  const [authInfo, setAuthInfo] = useState<StoredAuthInfo | null>(null);

  useEffect(() => {
    const saved = loadCreds();
    const auth = loadAuthInfo();
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCreds(saved);
      setAuthInfo(auth);
    }
    setHydrated(true);
  }, []);

  // Loading state
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--iptv-bg)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--iptv-gold-bright)] to-[var(--iptv-gold-dim)] flex items-center justify-center shadow-[0_0_24px_rgba(245,184,0,0.5)]">
            <svg className="w-5 h-5 text-[#0a0a14]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/>
            </svg>
          </div>
          <div className="w-6 h-6 border-2 border-[var(--iptv-border-strong)] border-t-[var(--iptv-gold)] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // If already logged in, show the full Dashboard (the actual IPTV player)
  if (creds) {
    return (
      <Dashboard
        creds={creds}
        serverName={authInfo?.serverUrl || creds.host}
        onLogout={() => {
          clearCreds();
          setCreds(null);
          setAuthInfo(null);
          // Stay on /admin, show the login form again
          window.location.reload();
        }}
      />
    );
  }

  // Not logged in — show the login form.
  // After successful login, LoginScreen calls onLoggedIn which redirects to "/" —
  // but we want to stay on /admin and show the dashboard. So we use a full page
  // reload to re-run the effect above.
  return (
    <LoginScreen
      onLoggedIn={() => {
        // Reload the page so the effect picks up the newly-saved credentials
        window.location.reload();
      }}
    />
  );
}
