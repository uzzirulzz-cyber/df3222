"use client";

import type { XtreamCredentials } from "./xtream";

/**
 * Browser-only storage for credentials & favorites.
 *
 * IMPORTANT: Credentials live in `localStorage` on THIS device only.
 * They are never sent to our own server (only to the IPTV host through
 * the /api/xtream proxy, which does not log them).
 */

const CREDS_KEY = "iptv:creds";
const FAV_LIVE_KEY = "iptv:fav:live";
const FAV_VOD_KEY = "iptv:fav:vod";
const FAV_SERIES_KEY = "iptv:fav:series";

export function loadCreds(): XtreamCredentials | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.host || !parsed?.username || !parsed?.password) return null;
    return parsed as XtreamCredentials;
  } catch {
    return null;
  }
}

export function saveCreds(creds: XtreamCredentials) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
}

export function clearCreds() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CREDS_KEY);
}

function loadSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveSet(key: string, set: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify([...set]));
}

export const favorites = {
  live: {
    list: () => loadSet(FAV_LIVE_KEY),
    has: (id: string) => loadSet(FAV_LIVE_KEY).has(id),
    toggle: (id: string) => {
      const s = loadSet(FAV_LIVE_KEY);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      saveSet(FAV_LIVE_KEY, s);
      return s.has(id);
    },
  },
  vod: {
    list: () => loadSet(FAV_VOD_KEY),
    has: (id: string) => loadSet(FAV_VOD_KEY).has(id),
    toggle: (id: string) => {
      const s = loadSet(FAV_VOD_KEY);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      saveSet(FAV_VOD_KEY, s);
      return s.has(id);
    },
  },
  series: {
    list: () => loadSet(FAV_SERIES_KEY),
    has: (id: string) => loadSet(FAV_SERIES_KEY).has(id),
    toggle: (id: string) => {
      const s = loadSet(FAV_SERIES_KEY);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      saveSet(FAV_SERIES_KEY, s);
      return s.has(id);
    },
  },
};
