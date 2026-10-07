"use client";

import { useEffect, useState } from "react";
import { LoginScreen } from "@/components/login-screen";
import { Dashboard } from "@/components/dashboard";
import { loadCreds, clearCreds } from "@/lib/storage";
import type { XtreamCredentials } from "@/lib/xtream";

export default function Home() {
  const [creds, setCreds] = useState<XtreamCredentials | null>(null);
  const [serverName, setServerName] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadCreds();
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCreds(saved);
      setServerName(saved.host);
    }
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-rose-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!creds) {
    return (
      <LoginScreen
        onLoggedIn={(c, server) => {
          setCreds(c);
          setServerName(server);
        }}
      />
    );
  }

  return (
    <Dashboard
      creds={creds}
      serverName={serverName}
      onLogout={() => {
        clearCreds();
        setCreds(null);
        setServerName("");
      }}
    />
  );
}
