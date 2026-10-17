# MAGXTV Fresh

This separate Cloudflare Pages site uses `magxtv-fresh/index.html` and `player.js`.

It supports importing an authorized M3U playlist from a local file or a CORS-enabled URL, or opening an authorized HLS URL. Unlike the source repo's browser-authenticated Xtream client, this static application does not include an IPTV subscription or any stream credentials. Channels appear only after the user imports a playlist. Playback availability is dependent on the provider and browser.

Cloudflare Pages project: `magxtv-fresh`, production branch `main`, root `/magxtv-fresh`, build command `mkdir -p dist && cp index.html player.js dist/`, output `dist`.
