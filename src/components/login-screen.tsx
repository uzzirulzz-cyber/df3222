"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tv, Loader2, AlertCircle, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Xtream, type XtreamCredentials } from "@/lib/xtream";
import { saveCreds } from "@/lib/storage";

interface LoginScreenProps {
  onLoggedIn: (creds: XtreamCredentials, serverName: string) => void;
}

export function LoginScreen({ onLoggedIn }: LoginScreenProps) {
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
      onLoggedIn(creds, auth.server_info?.url || host);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(`Could not connect: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-rose-500/20">
            <Tv className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Personal IPTV</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Self-hosted Xtream Codes player
          </p>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Sign in</CardTitle>
            <CardDescription className="text-zinc-400">
              Enter your Xtream Codes credentials. They are stored only in this browser.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="host" className="text-zinc-200">
                  Server URL
                </Label>
                <Input
                  id="host"
                  type="text"
                  placeholder="http://your-provider.example:8080"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  autoComplete="url"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
                />
                <p className="text-xs text-zinc-500">
                  Include the protocol and port. No trailing slash.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-zinc-200">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="your-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-200">
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
                    className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
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
                className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white"
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

            <div className="mt-6 flex items-start gap-2 p-3 rounded-md bg-zinc-800/50 border border-zinc-700/50 text-xs text-zinc-400">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
              <span>
                Your credentials stay on this device. They are only sent to your
                IPTV provider&apos;s server — never logged, never stored on any
                other server.
              </span>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-zinc-600 mt-6">
          For personal use only. Respect your provider&apos;s terms of service.
        </p>
      </div>
    </div>
  );
}
