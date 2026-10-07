"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tv, Loader2, AlertCircle, ShieldCheck, Eye, EyeOff, Lock } from "lucide-react";
import { Xtream, type XtreamCredentials } from "@/lib/xtream";
import { saveCreds, saveAuthInfo, type StoredAuthInfo } from "@/lib/storage";

interface LoginScreenProps {
  onLoggedIn: (creds: XtreamCredentials, serverName: string) => void;
}

export function LoginScreen({ onLoggedIn }: LoginScreenProps) {
  const router = useRouter();
  const [host, setHost] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!host.trim() || !username.trim() || !password.trim()) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    try {
      const creds: XtreamCredentials = {
        host: host.trim(),
        username: username.trim(),
        password: password.trim(),
      };

      const auth = await Xtream.authenticate(creds);
      if (!auth?.user_info || auth.user_info.auth !== 1) {
        setError(
          auth?.user_info?.message || "Authentication failed. Check your credentials."
        );
        return;
      }

      saveCreds(creds);

      // Save auth info for display in the dashboard (VIP user, renewal date, etc.)
      const authInfo: StoredAuthInfo = {
        username: auth.user_info.username || username,
        expDate: auth.user_info.exp_date,
        status: auth.user_info.status || "Active",
        maxConnections: auth.user_info.max_connections || "1",
        activeCons: auth.user_info.active_cons || "0",
        createdAt: auth.user_info.created_at || "",
        isTrial: auth.user_info.is_trial || "0",
        serverUrl: auth.server_info?.url || host,
        serverProtocol: auth.server_info?.server_protocol || "http",
        timezone: auth.server_info?.timezone || "UTC",
        storedAt: Date.now(),
      };
      saveAuthInfo(authInfo);

      onLoggedIn(creds, auth.server_info?.url || host);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(`Could not connect: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--iptv-bg)" }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <button
            onClick={() => router.push("/")}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--iptv-gold-bright)] to-[var(--iptv-gold-dim)] flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(245,184,0,0.4)] hover:shadow-[0_0_40px_rgba(245,184,0,0.7)] transition-shadow"
            aria-label="Back to home"
          >
            <Tv className="w-8 h-8 text-[#0a0a14]" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-[var(--iptv-gold)]">.</span>
              <span className="text-white">live</span>
            </h1>
            <span className="text-[9px] uppercase tracking-widest text-[var(--iptv-neon)] font-bold">
              NovaStream IPTV
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--iptv-gold)]/15 border border-[var(--iptv-gold)]/30 text-[var(--iptv-gold)] text-[10px] font-bold uppercase tracking-widest">
              <Lock className="w-2.5 h-2.5" /> Admin
            </span>
          </div>
          <p className="text-sm text-[var(--iptv-text-muted)] mt-1">
            Connect to your Xtream Codes gateway
          </p>
        </div>

        <div className="rounded-xl border border-[var(--iptv-border)] bg-[var(--iptv-surface)] overflow-hidden">
          <div className="p-6 border-b border-[var(--iptv-border)]">
            <h2 className="text-white text-lg font-semibold">Connect to Provider</h2>
            <p className="text-xs text-[var(--iptv-text-muted)] mt-1">
              Enter your Xtream Codes credentials. Stored only in this browser.
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="host" className="text-[var(--iptv-text)]">
                  Server URL
                </Label>
                <Input
                  id="host"
                  type="text"
                  placeholder="http://your-provider.example:8080"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  autoComplete="url"
                  className="bg-[var(--iptv-bg-elevated)] border-[var(--iptv-border)] text-white placeholder:text-[var(--iptv-text-dim)] focus-visible:border-[var(--iptv-gold)]"
                />
                <p className="text-xs text-[var(--iptv-text-dim)]">
                  Include the protocol and port. No trailing slash.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-[var(--iptv-text)]">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="your-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  className="bg-[var(--iptv-bg-elevated)] border-[var(--iptv-border)] text-white placeholder:text-[var(--iptv-text-dim)] focus-visible:border-[var(--iptv-gold)]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[var(--iptv-text)]">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="your-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="bg-[var(--iptv-bg-elevated)] border-[var(--iptv-border)] text-white placeholder:text-[var(--iptv-text-dim)] focus-visible:border-[var(--iptv-gold)] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--iptv-text-muted)] hover:text-white"
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-red-950/50 border border-red-900 text-red-200 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full iptv-btn-gold border-0 h-11"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting…
                  </>
                ) : (
                  "Connect"
                )}
              </Button>
            </form>

            <div className="mt-6 flex items-start gap-2 p-3 rounded-md bg-[var(--iptv-bg-elevated)] border border-[var(--iptv-border)] text-xs text-[var(--iptv-text-muted)]">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--iptv-green)]" />
              <span>
                Your credentials stay on this device. They are only sent to your
                IPTV provider&apos;s server — never logged, never stored on any
                other server.
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => router.push("/")}
            className="text-xs text-[var(--iptv-text-dim)] hover:text-[var(--iptv-gold)] transition"
          >
            ← Back to home
          </button>
          <p className="text-xs text-[var(--iptv-text-dim)]">
            For personal use only.
          </p>
        </div>
      </div>
    </div>
  );
}
