/**
 * Image proxy helper.
 *
 * If `NEXT_PUBLIC_R2_IMAGE_PROXY_URL` is set (e.g. to your deployed Cloudflare
 * Worker URL), all IPTV provider image URLs are routed through it for caching.
 * If not set, image URLs are returned unchanged (direct fetch from provider).
 *
 * Usage:
 *   import { proxyImageUrl } from "@/lib/image-proxy";
 *   <img src={proxyImageUrl(stream.stream_icon)} />
 *
 * To enable:
 *   1. Deploy the worker at /worker/r2-image-cache
 *   2. Set NEXT_PUBLIC_R2_IMAGE_PROXY_URL in Vercel (or .env.local) to the worker URL
 *   3. Redeploy
 */

const PROXY_BASE = process.env.NEXT_PUBLIC_R2_IMAGE_PROXY_URL;

/**
 * Route an image URL through the R2 cache proxy if configured.
 * Falls back to the original URL if the proxy isn't set or the URL is empty.
 */
export function proxyImageUrl(upstreamUrl: string | undefined | null): string {
  if (!upstreamUrl) return "";

  // Don't proxy data: URIs (they're already inline)
  if (upstreamUrl.startsWith("data:")) return upstreamUrl;

  // Don't proxy URLs that already point at our proxy (avoid double-wrapping)
  if (PROXY_BASE && upstreamUrl.startsWith(PROXY_BASE)) return upstreamUrl;

  // Don't proxy relative URLs
  if (upstreamUrl.startsWith("/")) return upstreamUrl;

  if (!PROXY_BASE) return upstreamUrl;

  return `${PROXY_BASE}/img?url=${encodeURIComponent(upstreamUrl)}`;
}
