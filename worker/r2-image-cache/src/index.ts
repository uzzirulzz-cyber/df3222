/**
 * IPTV Image Cache — Cloudflare Worker
 *
 * Purpose:
 *   Cache IPTV provider images (channel logos, movie posters, series covers)
 *   in Cloudflare R2 so that:
 *     - The browser fetches from R2 (fast, CDN-backed, no upstream load)
 *     - First request fetches upstream, stores in R2, returns to client
 *     - Subsequent requests for the same image hit R2 directly
 *
 * Route:
 *   GET /img?url=<encoded-upstream-url>
 *   GET /healthz  → liveness probe
 *   GET /         → tiny landing page
 *
 * Security:
 *   - Only http/https upstream URLs are allowed
 *   - Only `image/*` content-types are cached and served
 *   - Optional allow-list of upstream hosts via UPSTREAM_ALLOWLIST env var
 *     (comma-separated; if unset, any host is allowed)
 *
 * Deployment:
 *   See README.md in this folder.
 */

export interface Env {
  /** R2 bucket binding (set in wrangler.toml) */
  IMAGE_CACHE: R2Bucket;
  /** Optional: comma-separated list of allowed upstream host substrings */
  UPSTREAM_ALLOWLIST?: string;
  /** Optional: max upstream fetch size in bytes (default 10 MB) */
  MAX_IMAGE_SIZE?: string;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year — images are immutable

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
  };
}

function isAllowedHost(hostname: string, allowlist?: string): boolean {
  if (!allowlist) return true; // no allow-list = allow all
  const parts = allowlist
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (parts.length === 0) return true;
  const h = hostname.toLowerCase();
  return parts.some((p) => h.includes(p));
}

async function sha256hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const imageCacheWorker = {
  async fetch(req: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // Only GET is allowed
    if (req.method !== "GET") {
      return new Response("Method not allowed", {
        status: 405,
        headers: corsHeaders(),
      });
    }

    // Health probe
    if (url.pathname === "/healthz") {
      return new Response("ok", {
        status: 200,
        headers: { "Content-Type": "text/plain", ...corsHeaders() },
      });
    }

    // Landing page
    if (url.pathname === "/" || url.pathname === "") {
      return new Response(
        `<!doctype html><html><body style="font-family:system-ui;background:#07070d;color:#9a9aae;padding:2rem">
<h1 style="color:#f5b800">IPTV Image Cache</h1>
<p>Cloudflare Worker + R2 image proxy for IPTV provider artwork.</p>
<p>Usage: <code style="color:#00d9ff">/img?url=&lt;encoded-upstream-url&gt;</code></p>
<p><a href="/healthz" style="color:#f5b800">Health check</a></p>
</body></html>`,
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders() },
        }
      );
    }

    // Main image route
    if (url.pathname !== "/img") {
      return new Response("Not found", {
        status: 404,
        headers: corsHeaders(),
      });
    }

    const upstream = url.searchParams.get("url");
    if (!upstream) {
      return new Response("Missing url parameter", {
        status: 400,
        headers: corsHeaders(),
      });
    }

    let upstreamUrl: URL;
    try {
      upstreamUrl = new URL(upstream);
    } catch {
      return new Response("Invalid url", {
        status: 400,
        headers: corsHeaders(),
      });
    }

    if (upstreamUrl.protocol !== "http:" && upstreamUrl.protocol !== "https:") {
      return new Response("Only http/https URLs allowed", {
        status: 403,
        headers: corsHeaders(),
      });
    }

    if (!isAllowedHost(upstreamUrl.hostname, env.UPSTREAM_ALLOWLIST)) {
      return new Response(`Host not allowed: ${upstreamUrl.hostname}`, {
        status: 403,
        headers: corsHeaders(),
      });
    }

    const maxSize = env.MAX_IMAGE_SIZE
      ? parseInt(env.MAX_IMAGE_SIZE, 10)
      : DEFAULT_MAX_SIZE;

    // R2 key — versioned prefix lets us invalidate the cache later by bumping v
    const cacheKey = `v1/${await sha256hex(upstream)}`;

    // ---- Cache hit ----
    try {
      const cached = await env.IMAGE_CACHE.get(cacheKey);
      if (cached) {
        const headers = new Headers();
        headers.set(
          "Content-Type",
          cached.httpMetadata?.contentType || "image/jpeg"
        );
        headers.set("Cache-Control", `public, max-age=${CACHE_TTL_SECONDS}, immutable`);
        headers.set("X-Cache", "HIT");
        Object.entries(corsHeaders()).forEach(([k, v]) => headers.set(k, v));
        return new Response(cached.body, { status: 200, headers });
      }
    } catch (err) {
      // R2 read errors shouldn't kill the request — fall through to upstream
      console.error("R2 read error:", err);
    }

    // ---- Cache miss — fetch upstream ----
    let upstreamRes: Response;
    try {
      upstreamRes = await fetch(upstreamUrl.toString(), {
        method: "GET",
        headers: {
          Accept: "image/*",
          "User-Agent": "Mozilla/5.0 (compatible; IPTVImageCache/1.0)",
        },
        cf: { cacheTtl: 60, cacheEverything: true },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "fetch failed";
      return new Response(`Upstream fetch failed: ${msg}`, {
        status: 502,
        headers: corsHeaders(),
      });
    }

    if (!upstreamRes.ok) {
      return new Response(`Upstream returned ${upstreamRes.status}`, {
        status: upstreamRes.status,
        headers: corsHeaders(),
      });
    }

    const contentType = upstreamRes.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/")) {
      return new Response(`Refusing to cache non-image content-type: ${contentType}`, {
        status: 415,
        headers: corsHeaders(),
      });
    }

    // Buffer the body (we need its length and to write it to R2)
    const bodyBuffer = await upstreamRes.arrayBuffer();
    if (bodyBuffer.byteLength > maxSize) {
      return new Response(
        `Image too large: ${bodyBuffer.byteLength} bytes (max ${maxSize})`,
        { status: 413, headers: corsHeaders() }
      );
    }

    // Store in R2 (fire-and-forget — return to client immediately)
    try {
      await env.IMAGE_CACHE.put(cacheKey, bodyBuffer, {
        httpMetadata: { contentType },
        // R2 custom metadata — useful for debugging
        customMetadata: {
          sourceUrl: upstreamUrl.toString().slice(0, 500), // R2 has a 2KB limit per metadata value
          cachedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      // If R2 write fails, we still return the image — just no caching
      console.error("R2 write error:", err);
    }

    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Length", String(bodyBuffer.byteLength));
    headers.set("Cache-Control", `public, max-age=${CACHE_TTL_SECONDS}, immutable`);
    headers.set("X-Cache", "MISS");
    Object.entries(corsHeaders()).forEach(([k, v]) => headers.set(k, v));

    return new Response(bodyBuffer, { status: 200, headers });
  },
};

export default imageCacheWorker;
