/**
 * Stream proxy helper.
 *
 * If `NEXT_PUBLIC_STREAM_PROXY_URL` is set (e.g. to your deployed Cloudflare
 * Worker URL), all video stream URLs are routed through it. The proxy:
 *   - Solves mixed content (HTTPS app → HTTP upstream)
 *   - Solves CORS (proxy adds Access-Control-Allow-Origin: *)
 *   - Rewrites HLS playlists so segment URLs route back through the proxy
 *   - Pipes binary segments through with Range support for VOD seeking
 *
 * If not set, stream URLs are returned unchanged (direct fetch from provider).
 * This will FAIL in production if your provider is HTTP-only and your app is HTTPS,
 * due to mixed content blocking.
 *
 * Usage:
 *   import { proxyStreamUrl } from "@/lib/stream-proxy";
 *   <VideoPlayer src={proxyStreamUrl(Xtream.liveStreamUrl(creds, id))} />
 *
 * To enable:
 *   1. Deploy the worker at /worker/stream-proxy
 *   2. Set NEXT_PUBLIC_STREAM_PROXY_URL in Vercel (or .env.local) to the worker URL
 *   3. Redeploy
 */

const PROXY_BASE = process.env.NEXT_PUBLIC_STREAM_PROXY_URL;

/**
 * Route a stream URL through the proxy if configured.
 * Falls back to the original URL if the proxy isn't set or the URL is empty.
 */
export function proxyStreamUrl(upstreamUrl: string | undefined | null): string {
  if (!upstreamUrl) return "";

  // Don't proxy relative URLs
  if (upstreamUrl.startsWith("/")) return upstreamUrl;

  // Don't proxy URLs that already point at our proxy (avoid double-wrapping)
  if (PROXY_BASE && upstreamUrl.startsWith(PROXY_BASE)) return upstreamUrl;

  if (!PROXY_BASE) return upstreamUrl;

  return `${PROXY_BASE}/stream?url=${encodeURIComponent(upstreamUrl)}`;
}
