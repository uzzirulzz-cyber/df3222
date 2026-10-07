# Personal IPTV Player

A self-hosted Xtream Codes IPTV web client. Bring your own credentials — they stay in your browser, never on a server.

## What this is

- A Next.js 16 + TypeScript web app you deploy **for yourself** (e.g. on Vercel)
- A login screen where you enter your **own** Xtream Codes `host / username / password`
- A grid-based player for Live TV, Movies (VOD), and Series, with categories, search, and favorites
- Powered by `hls.js` for live `.m3u8` streams and native `<video>` for VOD `.mp4` files

## What this is NOT

- It is **not** a re-broadcasting service. You cannot share the URL with others and have them stream your content — they would need your credentials too.
- It does **not** embed any credentials in the source code. There are no `.env` files with usernames or passwords.
- It does **not** proxy or re-serve video streams. The browser connects directly to your IPTV provider for video.
- It does **not** log or store your credentials server-side. The only server-side route is `/api/xtream`, a thin CORS proxy that forwards JSON metadata calls to `player_api.php` and returns the body with CORS headers. It does not log anything.

## Privacy

| Where | What is stored |
|---|---|
| Browser `localStorage` | Your `host / username / password` (so you don't have to re-login every visit) |
| Browser `localStorage` | Favorite channel/movie/series IDs |
| Server (`/api/xtream`) | **Nothing.** The proxy is stateless and cache-free (`Cache-Control: no-store`). |
| Logs | No credentials are ever logged. |

To clear all stored data: open the app, click **Logout** in the top-right. This removes credentials from `localStorage`.

## Deploy to Vercel

1. Push this repo to your own GitHub.
2. Import the repo into Vercel.
3. No environment variables are required.
4. Deploy. You'll get a `https://your-project.vercel.app` URL.
5. Open the URL, enter **your own** Xtream Codes credentials, and start watching.

Optional: protect your deployment with [Vercel Password Protection](https://vercel.com/docs/security/deployment-protection) (Pro plan) so only you can reach it.

## Run locally

```bash
bun install
bun run dev
# open http://localhost:3000
```

## Why a CORS proxy?

Xtream Codes panels do not send `Access-Control-Allow-Origin` headers, so the browser cannot fetch JSON from them directly. The `/api/xtream` route forwards the request server-side and returns the body with `Access-Control-Allow-Origin: *`. The route is restricted to URLs ending in `/player_api.php` only — it cannot be used as an open proxy.

**Video streams** (`.m3u8`, `.mp4`) are loaded directly into `<video>`/HLS.js from your IPTV provider. Those don't need CORS for media playback.

## Tech stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS 4 + shadcn/ui
- `hls.js` for HLS playback
- Browser `localStorage` for credentials & favorites (no DB needed)

## Disclaimer

This is a personal-use client. You are responsible for complying with your IPTV provider's terms of service and the laws of your jurisdiction. The author does not condone piracy or unauthorized re-broadcasting.
