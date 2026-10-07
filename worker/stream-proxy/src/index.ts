/**
 * IPTV Stream Proxy — Cloudflare Worker
 *
 * Purpose:
 *   Solve two problems with browser-direct IPTV streaming:
 *     1. Mixed content — Vercel app is HTTPS, providers are often HTTP-only.
 *     2. CORS — providers don't send Access-Control-Allow-Origin.
 *
 *   This worker accepts HTTPS requests from the browser and proxies them to
 *   the upstream provider, adding CORS headers and (for HLS) rewriting the
 *   playlist so segment URLs route back through the proxy.
 *
 * Routes:
 *   GET /stream?url=<encoded-upstream-url>
 *   GET /healthz
 *   GET /
 *
 * Security:
 *   - Only http/https upstream URLs
 *   - Optional UPSTREAM_ALLOWLIST (comma-separated host substrings) — strongly
 *     recommended to prevent the worker being used as an open proxy
 *   - Optional UPSTREAM_USERNAME / UPSTREAM_PASSWORD — if set, sent to upstream
 *     as HTTP basic auth (some providers require this for stream URLs)
 *
 * Personal use only:
 *   This proxy is intended for personal IPTV viewing through your own deployment.
 *   Do NOT use it to redistribute content to others — that violates provider
 *   terms of service and is what this whole project declines to help with.
 */

export interface Env {
  /** Optional: comma-separated list of allowed upstream host substrings */
  UPSTREAM_ALLOWLIST?: string;
  /** Optional: username for upstream HTTP basic auth */
  UPSTREAM_USERNAME?: string;
  /** Optional: password for upstream HTTP basic auth */
  UPSTREAM_PASSWORD?: string;
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, Range",
    "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
    "Access-Control-Max-Age": "86400",
  };
}

function isAllowedHost(hostname: string, allowlist?: string): boolean {
  if (!allowlist) return true;
  const parts = allowlist
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (parts.length === 0) return true;
  const h = hostname.toLowerCase();
  return parts.some((p) => h.includes(p));
}

/**
 * Resolve a possibly-relative URL against a base URL.
 * Returns the absolute URL string, or undefined if invalid.
 */
function resolveUrl(base: string, ref: string): string | undefined {
  // Already absolute?
  if (/^https?:\/\//i.test(ref)) return ref;
  try {
    return new URL(ref, base).toString();
  } catch {
    return undefined;
  }
}

/**
 * Wrap a single URL through the proxy.
 */
function proxyWrap(proxyBase: string, url: string): string {
  return `${proxyBase}/stream?url=${encodeURIComponent(url)}`;
}

/**
 * Rewrite an HLS playlist so every URL reference (variants, segments, keys,
 * maps, alternative renditions) routes back through this proxy.
 *
 * Handles:
 *   - Plain segment URLs (one per line, not starting with #)
 *   - #EXT-X-KEY:URI="..."
 *   - #EXT-X-MAP:URI="..."
 *   - #EXT-X-MEDIA:URI="..."
 *   - #EXT-X-STREAM-INF:... followed by a variant playlist URL
 *   - Relative and absolute URLs
 */
function rewriteHlsPlaylist(playlist: string, baseUrl: string, proxyBase: string): string {
  const lines = playlist.split(/\r?\n/);
  const out: string[] = [];

  let pendingVariant = false; // true if previous line was #EXT-X-STREAM-INF (or its attributes)

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Empty line — keep as-is
    if (line === "") {
      out.push(rawLine);
      continue;
    }

    // Comment line
    if (line.startsWith("#")) {
      // Replace URI="..." attributes inside tag lines
      const rewritten = line.replace(/URI="([^"]+)"/g, (full, rawUrl) => {
        const abs = resolveUrl(baseUrl, rawUrl);
        if (!abs) return full;
        return `URI="${proxyWrap(proxyBase, abs)}"`;
      });
      out.push(rewritten);

      if (line.startsWith("#EXT-X-STREAM-INF") || line.startsWith("#EXT-X-I-FRAME-STREAM-INF")) {
        pendingVariant = true;
      } else {
        pendingVariant = false;
      }
      continue;
    }

    // Non-comment, non-empty line — this is a URL (segment or variant playlist)
    const abs = resolveUrl(baseUrl, line);
    if (abs) {
      out.push(proxyWrap(proxyBase, abs));
    } else {
      out.push(line);
    }
    pendingVariant = false;
  }

  return out.join("\n");
}

const HLS_CONTENT_TYPES = [
  "application/vnd.apple.mpegurl",
  "application/x-mpegurl",
  "audio/mpegurl",
  "text/vnd.apple.mpegurl",
];

function isHlsContentType(contentType: string): boolean {
  const ct = contentType.toLowerCase().split(";")[0].trim();
  return HLS_CONTENT_TYPES.some((h) => ct === h);
}

function isHlsUrl(url: string): boolean {
  return /\.m3u8(\?|$|#)/i.test(url);
}

const streamWorker = {
  async fetch(req: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
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
<h1 style="color:#f5b800">IPTV Stream Proxy</h1>
<p>Cloudflare Worker that proxies HLS + binary streams from IPTV providers.</p>
<p>Usage: <code style="color:#00d9ff">/stream?url=&lt;encoded-upstream-url&gt;</code></p>
<p><a href="/healthz" style="color:#f5b800">Health check</a></p>
</body></html>`,
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8", ...corsHeaders() },
        }
      );
    }

    // Main stream route
    if (url.pathname !== "/stream") {
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

    // Build the upstream request headers
    const upstreamHeaders: Record<string, string> = {
      Accept: "*/*",
      "User-Agent": "Mozilla/5.0 (compatible; IPTVStreamProxy/1.0)",
    };

    // Forward Range header for VOD seeking
    const range = req.headers.get("range");
    if (range) {
      upstreamHeaders["Range"] = range;
    }

    // Optional HTTP basic auth to upstream
    if (env.UPSTREAM_USERNAME && env.UPSTREAM_PASSWORD) {
      const creds = btoa(`${env.UPSTREAM_USERNAME}:${env.UPSTREAM_PASSWORD}`);
      upstreamHeaders["Authorization"] = `Basic ${creds}`;
    }

    // Fetch upstream
    let upstreamRes: Response;
    try {
      upstreamRes = await fetch(upstreamUrl.toString(), {
        method: req.method, // GET or HEAD
        headers: upstreamHeaders,
        cf: { cacheEverything: false }, // streams should not be cached at edge
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "fetch failed";
      return new Response(`Upstream fetch failed: ${msg}`, {
        status: 502,
        headers: corsHeaders(),
      });
    }

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      // 206 = Partial Content (Range response) — that's fine
      return new Response(`Upstream returned ${upstreamRes.status}`, {
        status: upstreamRes.status,
        headers: corsHeaders(),
      });
    }

    const contentType = upstreamRes.headers.get("content-type") || "";
    const proxyBase = `${url.protocol}//${url.host}`;

    // ---------- HLS playlist ----------
    if (isHlsContentType(contentType) || isHlsUrl(upstreamUrl.toString())) {
      const playlistText = await upstreamRes.text();
      const rewritten = rewriteHlsPlaylist(playlistText, upstreamUrl.toString(), proxyBase);

      const headers = new Headers();
      headers.set("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
      headers.set("X-Stream-Proxy", "hls");
      Object.entries(corsHeaders()).forEach(([k, v]) => headers.set(k, v));

      return new Response(rewritten, { status: 200, headers });
    }

    // ---------- Binary stream (.ts segments, .mp4 VOD, etc.) ----------
    const headers = new Headers();

    // Pass through content-type, or infer from URL
    if (contentType) {
      headers.set("Content-Type", contentType);
    } else if (/\.ts(\?|$|#)/i.test(upstreamUrl.toString())) {
      headers.set("Content-Type", "video/mp2t");
    } else if (/\.mp4(\?|$|#)/i.test(upstreamUrl.toString())) {
      headers.set("Content-Type", "video/mp4");
    } else if (/\.m4s(\?|$|#)/i.test(upstreamUrl.toString())) {
      headers.set("Content-Type", "video/iso.segment");
    } else if (/\.mkv(\?|$|#)/i.test(upstreamUrl.toString())) {
      headers.set("Content-Type", "video/x-matroska");
    } else {
      headers.set("Content-Type", "application/octet-stream");
    }

    // Pass through Content-Length, Content-Range, Accept-Ranges for seeking
    const contentLength = upstreamRes.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    const contentRange = upstreamRes.headers.get("content-range");
    if (contentRange) {
      headers.set("Content-Range", contentRange);
      headers.set("Accept-Ranges", "bytes");
    } else if (range) {
      // We requested a range but upstream didn't honor it
      headers.set("Accept-Ranges", "bytes");
    } else {
      headers.set("Accept-Ranges", "bytes");
    }

    // Cache control — segments are immutable (cache for a day at the browser)
    // VOD content can be cached longer
    if (upstreamRes.status === 206) {
      headers.set("Cache-Control", "public, max-age=86400");
    } else {
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    }

    headers.set("X-Stream-Proxy", "binary");
    Object.entries(corsHeaders()).forEach(([k, v]) => headers.set(k, v));

    // Stream the body through — Workers can stream response bodies without
    // buffering the entire content in memory.
    return new Response(upstreamRes.body, {
      status: upstreamRes.status,
      headers,
    });
  },
};

export default streamWorker;
