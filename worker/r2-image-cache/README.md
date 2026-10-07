# IPTV Image Cache Worker

A Cloudflare Worker that caches IPTV provider images (channel logos, movie posters, series covers) in R2.

## Why

- **Faster image loads** — R2 is CDN-backed, much faster than hitting the IPTV provider for every image
- **Less upstream load** — provider only gets hit once per image, ever
- **Provider outages don't break thumbnails** — once cached, images keep loading from R2

## How it works

```
Browser → /img?url=<encoded-upstream-url> → Worker
                                            ↓
                                  R2 cache hit?  ──── yes ──→ return cached bytes (Cache: HIT)
                                            ↓
                                            no
                                            ↓
                                  fetch upstream → store in R2 → return (Cache: MISS)
```

- Cache key: `v1/<sha256(url)>` (versioned prefix lets you invalidate later)
- Cache TTL: 1 year, `immutable`
- Only `image/*` content-types are cached (no HTML, no JSON, no video)
- Optional allow-list of upstream hosts to prevent open-proxy abuse
- CORS: `*` (worker can be called from any origin)

## Deploy

### Prerequisites

- A Cloudflare account (free tier works)
- Wrangler CLI: `npm install -g wrangler` (or use `npx wrangler`)
- Logged in: `wrangler login`

### Steps

```bash
cd worker/r2-image-cache

# 1. Install deps
npm install

# 2. Create the R2 bucket (one-time)
npx wrangler r2 bucket create iptv-image-cache

# 3. Copy the config template and fill in your account_id
cp wrangler.toml.example wrangler.toml
# Edit wrangler.toml — replace <YOUR_ACCOUNT_ID> with your account ID
# (find it at https://dash.cloudflare.com → any domain → right sidebar)

# 4. (Recommended) Set UPSTREAM_ALLOWLIST to restrict which hosts the worker will fetch from
# Uncomment the [vars] block in wrangler.toml and put your IPTV provider's domain(s)

# 5. Deploy
npx wrangler deploy

# 6. Note the URL — something like:
#    https://iptv-image-cache.<your-subdomain>.workers.dev
```

### Optional: custom domain

Instead of the `*.workers.dev` URL, you can serve the worker from your own subdomain (e.g. `img.playbeat.digital`):

1. Make sure your domain is on Cloudflare DNS
2. Uncomment the `[[routes]]` block in `wrangler.toml`
3. Set `pattern = "img.yourdomain.com/*"` and `custom_domain = true`
4. `npx wrangler deploy`

## Use it from the Next.js app

The IPTV app reads `NEXT_PUBLIC_R2_IMAGE_PROXY_URL` and automatically routes all images through the worker if it's set.

### On Vercel

1. Vercel dashboard → your project → Settings → Environment Variables
2. Add:
   - Key: `NEXT_PUBLIC_R2_IMAGE_PROXY_URL`
   - Value: `https://iptv-image-cache.<your-subdomain>.workers.dev` (no trailing slash)
   - Environment: Production (and Preview if you want)
3. Redeploy

### Locally

Add to `.env.local`:
```
NEXT_PUBLIC_R2_IMAGE_PROXY_URL=https://iptv-image-cache.<your-subdomain>.workers.dev
```

## Verify

```bash
# Health check
curl https://iptv-image-cache.<your-subdomain>.workers.dev/healthz
# → ok

# Test image fetch (replace with a real IPTV logo URL)
curl -I "https://iptv-image-cache.<your-subdomain>.workers.dev/img?url=https%3A%2F%2Fexample.com%2Flogo.png"
# First call:  X-Cache: MISS
# Second call: X-Cache: HIT
```

## Inspect the cache

```bash
# List objects in the bucket
npx wrangler r2 object list iptv-image-cache

# Get a specific object's metadata
npx wrangler r2 object get iptv-image-cache/v1/<sha256> --remote
```

## Clear the cache

There's no built-in purge endpoint (intentional — images are immutable). To wipe the cache:

```bash
# Delete and recreate the bucket (nuclear option)
npx wrangler r2 bucket delete iptv-image-cache
npx wrangler r2 bucket create iptv-image-cache

# OR bump the cache key version in src/index.ts:
#   const cacheKey = `v2/${await sha256hex(upstream)}`;
# and redeploy — old objects become orphaned but new requests get fresh fetches
```

## Cost

R2 free tier: 10 GB storage + 1 million Class A operations + 10 million Class B operations per month. Image cache for a typical IPTV library (tens of thousands of channels × ~5KB logo each) is well under 1 GB.

## Security notes

- The worker only fetches URLs that you pass via `?url=`. Without an allow-list, anyone could use your worker as a generic image proxy. **Set `UPSTREAM_ALLOWLIST` in production.**
- The worker refuses to cache anything that isn't `image/*` content-type.
- Maximum image size is 10 MB by default (configurable via `MAX_IMAGE_SIZE`).
- Credentials are never stored — the worker only sees image URLs, which are typically public.
