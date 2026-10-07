# IPTV Stream Proxy Worker

A Cloudflare Worker that proxies HLS (.m3u8) and binary (.ts, .mp4) streams from IPTV providers.

## Why you need this

If your IPTV provider is HTTP-only (like `http://advance.playbeat.live:8880`) and your web app is HTTPS (Vercel, Netlify, etc.), the browser will refuse to load streams due to **mixed content blocking**. IPTV providers also don't send CORS headers, which blocks HLS.js `fetch()` calls.

This worker solves both problems by:
- Accepting HTTPS requests from the browser
- Forwarding them to the HTTP upstream
- Returning the response with `Access-Control-Allow-Origin: *`
- For HLS playlists: rewriting every segment URL to route back through the proxy

## How it works

```
Browser ─── /stream?url=<encoded-upstream-url> ──→ Worker
                                                       ↓
                                  ┌────────────────────┴────────────────────┐
                                  ↓                                          ↓
                            HLS playlist?                              Binary segment?
                                  ↓                                          ↓
                       Parse + rewrite URLs                          Pipe bytes through
                       (segments → /stream?url=...)                  Forward Range header
                                  ↓                                          ↓
                       Return rewritten text                       Return stream body
```

## Deploy

### Prerequisites

- Cloudflare account (free tier works)
- Wrangler CLI: `npm install -g wrangler` (or use `npx wrangler`)
- Logged in: `wrangler login`

### Steps

```bash
cd worker/stream-proxy

# 1. Install deps
npm install

# 2. Copy the config template
cp wrangler.toml.example wrangler.toml

# 3. Edit wrangler.toml:
#    - Replace <YOUR_ACCOUNT_ID> with your account ID
#      (find it at https://dash.cloudflare.com → any domain → right sidebar)
#    - Set UPSTREAM_ALLOWLIST to your IPTV provider's hostname
#      (e.g. "advance.playbeat.live,playbeat.live")

# 4. Deploy
npx wrangler deploy

# 5. Note the URL — something like:
#    https://iptv-stream-proxy.<your-subdomain>.workers.dev
```

### Optional: custom domain

Instead of `*.workers.dev`, serve the worker from your own subdomain (e.g. `stream.yourdomain.com`):

1. Make sure your domain is on Cloudflare DNS
2. Uncomment the `[[routes]]` block in `wrangler.toml`
3. Set `pattern = "stream.yourdomain.com/*"` and `custom_domain = true`
4. `npx wrangler deploy`

## Use it from the Next.js app

The IPTV app reads `NEXT_PUBLIC_STREAM_PROXY_URL` and automatically routes all video stream URLs through the proxy if it's set.

### On Vercel

1. Vercel dashboard → your project → Settings → Environment Variables
2. Add:
   - Key: `NEXT_PUBLIC_STREAM_PROXY_URL`
   - Value: `https://iptv-stream-proxy.<your-subdomain>.workers.dev` (no trailing slash)
   - Environment: Production (and Preview if you want)
3. Redeploy

### Locally

Add to `.env.local`:
```
NEXT_PUBLIC_STREAM_PROXY_URL=https://iptv-stream-proxy.<your-subdomain>.workers.dev
```

## Verify

```bash
# Health check
curl https://iptv-stream-proxy.<your-subdomain>.workers.dev/healthz
# → ok

# Test HLS playlist fetch (replace with a real .m3u8 URL from your provider)
curl -s "https://iptv-stream-proxy.<your-subdomain>.workers.dev/stream?url=http%3A%2F%2Fadvance.playbeat.live%3A8880%2Flive%2Fuser%2Fpass%2F12345.m3u8"
# → Should return the playlist with every URL rewritten to /stream?url=...

# Test .ts segment fetch with Range request (for seeking)
curl -I -H "Range: bytes=0-1023" "https://iptv-stream-proxy.<your-subdomain>.workers.dev/stream?url=http%3A%2F%2Fadvance.playbeat.live%3A8880%2Flive%2Fuser%2Fpass%2F12345.ts"
# → HTTP/1.1 206 Partial Content
# → Content-Range: bytes 0-1023/...
```

## What the worker handles

### HLS playlists (`.m3u8`)
- Master playlists: rewrites `#EXT-X-STREAM-INF` variant URLs
- Media playlists: rewrites segment URLs (one per line)
- `#EXT-X-KEY:URI="..."` — encryption key URLs
- `#EXT-X-MAP:URI="..."` — init segment URLs
- `#EXT-X-MEDIA:URI="..."` — alternative rendition URLs
- Both relative and absolute URLs (relative resolved against the playlist URL)

### Binary segments (`.ts`, `.mp4`, `.m4s`, `.mkv`)
- Pipes bytes through without buffering (Worker streaming)
- Forwards `Range` request header for VOD seeking
- Returns `Content-Range`, `Accept-Ranges`, `Content-Length` headers
- Sets correct `Content-Type` based on URL extension
- Cache headers: 1 day for partial responses (segments are immutable), no-cache for full responses

## Cost

Cloudflare Workers free tier: 100,000 requests per day. Each HLS session uses roughly:
- 1 playlist request + N segment requests per minute
- ~60-120 requests per hour of viewing

For typical personal use (a few hours of viewing per day), you'll stay well within the free tier.

## Security notes

- **Set `UPSTREAM_ALLOWLIST` in production.** Without it, anyone can use your worker as a generic streaming proxy.
- The worker only proxies HTTP/HTTPS URLs.
- Optional `UPSTREAM_USERNAME` / `UPSTREAM_PASSWORD` for providers that require HTTP basic auth on stream URLs (most Xtream Codes providers don't — credentials are in the URL path).
- This proxy is for **personal use only**. Do NOT use it to redistribute content to others — that violates provider terms of service.

## Troubleshooting

**Stream still doesn't play after enabling proxy:**
1. Open browser DevTools → Network tab
2. Look for requests to your worker URL — check status codes
3. If 403: your `UPSTREAM_ALLOWLIST` doesn't include the provider's hostname
4. If 502: the upstream fetch failed — check the URL encoding
5. If 200 but video won't play: check the response Content-Type — should be `application/vnd.apple.mpegurl` for playlists, `video/mp2t` for segments

**VOD seeking doesn't work:**
- Verify Range header is being sent: DevTools → Network → click the .mp4 request → Request Headers should show `Range: bytes=...`
- Verify response: should have `Content-Range` header and status 206
