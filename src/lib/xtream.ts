/**
 * Xtream Codes API client.
 *
 * All requests are made FROM THE BROWSER directly to the user's IPTV provider.
 * No credentials are ever sent to our own server. We use a server-side proxy
 * route (/api/xtream) only to set CORS headers, because Xtream panels do not
 * send Access-Control-Allow-Origin.
 *
 * Endpoints follow the standard `player_api.php` schema:
 *   - authenticate              -> user_info + server_info
 *   - get_live_categories
 *   - get_vod_categories
 *   - get_series_categories
 *   - get_live_streams
 *   - get_vod_streams
 *   - get_series
 *   - get_vod_info
 *   - get_series_info
 */

export interface XtreamCredentials {
  host: string;
  username: string;
  password: string;
}

export interface UserInfo {
  username: string;
  password: string;
  message: string;
  auth: number;
  status: string;
  exp_date: string | null;
  is_trial: string;
  active_cons: string;
  created_at: string;
  max_connections: string;
  allowed_output_formats: string[];
}

export interface ServerInfo {
  url: string;
  port: string;
  https_port: string;
  server_protocol: string;
  rtmp_port: string;
  timezone: string;
  timestamp_now: number;
  time_now: string;
}

export interface AuthResponse {
  user_info: UserInfo;
  server_info: ServerInfo;
}

export interface Category {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface LiveStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string | null;
  added: string;
  category_id: string;
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
}

export interface VodStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  rating: string;
  rating_5based: number;
  added: string;
  category_id: string;
  container_extension: string;
  custom_sid: string;
  direct_source: string;
}

export interface SeriesItem {
  num: number;
  name: string;
  series_id: number;
  cover: string;
  plot: string;
  cast: string;
  director: string;
  genre: string;
  releaseDate: string;
  last_modified: string;
  rating: string;
  rating_5based: number;
  category_id: string;
}

export interface VodInfo {
  info: {
    movie_image?: string;
    plot?: string;
    cast?: string;
    rating?: string;
    director?: string;
    genre?: string;
    releasedate?: string;
    tmdb_id?: string;
    duration?: string;
    duration_secs?: number;
    bitrate?: number;
    season?: number;
    tmdb?: string;
  };
  movie_data: {
    stream_id: number;
    name: string;
    added: string;
    category_id: string;
    container_extension: string;
    custom_sid: string;
    direct_source: string;
  };
}

export interface SeriesInfoEpisode {
  id: string;
  episode_num: string;
  title: string;
  container_extension: string;
  info: {
    movie_image?: string;
    plot?: string;
    duration_secs?: number;
    duration?: string;
    rating?: string;
    season?: number;
    tmdb_id?: number;
    cover_big?: string;
    name?: string;
  };
  added: string;
  season: number;
  direct_source: string;
}

export interface SeriesInfo {
  seasons: Array<{ season_number: number; name: string; cover: string; overview: string }>;
  info: {
    name: string;
    cover: string;
    plot: string;
    cast: string;
    director: string;
    genre: string;
    releaseDate: string;
    last_modified: string;
    rating: string;
    rating_5based: number;
    backdrop_path: Array<string>;
    youtube_trailer: string;
    episode_run_time: string;
    category_id: string;
  };
  episodes: { [season: string]: SeriesInfoEpisode[] };
}

export interface EpgProgram {
  id?: string;
  title: string;
  description: string;
  start: string; // ISO timestamp or epoch string
  end: string;
  start_timestamp?: string;
  stop_timestamp?: string;
  category?: string;
  image?: string;
  language?: string;
}

export interface ShortEpgResponse {
  epg_listings: EpgProgram[];
}

export type LiveStreamFormat = "m3u8" | "ts";

function normalizeHost(host: string): string {
  let h = host.trim();
  if (!h) return h;
  if (!/^https?:\/\//i.test(h)) {
    h = `http://${h}`;
  }
  // strip trailing slash
  h = h.replace(/\/+$/, "");
  return h;
}

/**
 * Build a player_api.php URL with the given query params.
 */
function buildApiUrl(
  creds: XtreamCredentials,
  params: Record<string, string | number>
): string {
  const host = normalizeHost(creds.host);
  const url = new URL(`${host}/player_api.php`);
  url.searchParams.set("username", creds.username);
  url.searchParams.set("password", creds.password);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  return url.toString();
}

/**
 * All Xtream calls go through our own /api/xtream proxy route.
 * The proxy only adds CORS headers — it does NOT log or store credentials.
 * The credentials remain in the user's browser and are only forwarded to
 * their own IPTV host.
 */
async function callApi<T>(
  creds: XtreamCredentials,
  params: Record<string, string | number>
): Promise<T> {
  const target = buildApiUrl(creds, params);
  const proxy = new URL("/api/xtream", window.location.origin);
  proxy.searchParams.set("url", target);

  const res = await fetch(proxy.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Xtream API error: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  if (!text) return [] as unknown as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Xtream API returned non-JSON response");
  }
}

export const Xtream = {
  normalizeHost,

  authenticate(creds: XtreamCredentials): Promise<AuthResponse> {
    return callApi<AuthResponse>(creds, {});
  },

  getLiveCategories(creds: XtreamCredentials): Promise<Category[]> {
    return callApi<Category[]>(creds, { action: "get_live_categories" });
  },

  getVodCategories(creds: XtreamCredentials): Promise<Category[]> {
    return callApi<Category[]>(creds, { action: "get_vod_categories" });
  },

  getSeriesCategories(creds: XtreamCredentials): Promise<Category[]> {
    return callApi<Category[]>(creds, { action: "get_series_categories" });
  },

  getLiveStreams(creds: XtreamCredentials, categoryId?: string): Promise<LiveStream[]> {
    const params: Record<string, string | number> = { action: "get_live_streams" };
    if (categoryId) params.category_id = categoryId;
    return callApi<LiveStream[]>(creds, params);
  },

  getVodStreams(creds: XtreamCredentials, categoryId?: string): Promise<VodStream[]> {
    const params: Record<string, string | number> = { action: "get_vod_streams" };
    if (categoryId) params.category_id = categoryId;
    return callApi<VodStream[]>(creds, params);
  },

  getSeries(creds: XtreamCredentials, categoryId?: string): Promise<SeriesItem[]> {
    const params: Record<string, string | number> = { action: "get_series" };
    if (categoryId) params.category_id = categoryId;
    return callApi<SeriesItem[]>(creds, params);
  },

  getVodInfo(creds: XtreamCredentials, vodId: number): Promise<VodInfo> {
    return callApi<VodInfo>(creds, { action: "get_vod_info", vod_id: vodId });
  },

  getSeriesInfo(creds: XtreamCredentials, seriesId: number): Promise<SeriesInfo> {
    return callApi<SeriesInfo>(creds, { action: "get_series_info", series_id: seriesId });
  },

  /**
   * Short EPG for a single live stream (next N programs).
   */
  getShortEpg(
    creds: XtreamCredentials,
    streamId: number,
    limit: number = 5
  ): Promise<ShortEpgResponse> {
    return callApi<ShortEpgResponse>(creds, {
      action: "get_short_epg",
      stream_id: streamId,
      limit,
    });
  },

  /**
   * Build a stream URL for a live channel.
   * Format: {host}/live/{user}/{pass}/{stream_id}.{ext}
   */
  liveStreamUrl(
    creds: XtreamCredentials,
    streamId: number,
    ext: LiveStreamFormat = "m3u8"
  ): string {
    const host = normalizeHost(creds.host);
    return `${host}/live/${creds.username}/${creds.password}/${streamId}.${ext}`;
  },

  /**
   * Build a stream URL for a VOD movie.
   * Format: {host}/movie/{user}/{pass}/{stream_id}.{container}
   */
  vodStreamUrl(creds: XtreamCredentials, streamId: number, container: string): string {
    const host = normalizeHost(creds.host);
    return `${host}/movie/${creds.username}/${creds.password}/${streamId}.${container}`;
  },

  /**
   * Build a stream URL for a series episode.
   * Format: {host}/series/{user}/{pass}/{episode_id}.{container}
   */
  seriesStreamUrl(creds: XtreamCredentials, episodeId: string, container: string): string {
    const host = normalizeHost(creds.host);
    return `${host}/series/${creds.username}/${creds.password}/${episodeId}.${container}`;
  },
};
