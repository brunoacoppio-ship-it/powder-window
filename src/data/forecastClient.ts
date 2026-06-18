export interface HourlyForecast {
  time: string[];
  snowfall: number[];
  snow_depth: number[];
  temperature_2m: number[];
  freezing_level_height: number[];
}

export interface ForecastResponse {
  latitude: number;
  longitude: number;
  hourly: HourlyForecast;
}

interface CachedForecast {
  data: ForecastResponse;
  fetchedAt: number;
}

const BASE_URL = "https://api.open-meteo.com/v1/forecast";
const STORAGE_KEY = "powder-window:forecasts:v1";
const memCache = new Map<string, ForecastResponse>();

function loadStore(): Record<string, CachedForecast> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveStore(store: Record<string, CachedForecast>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch {}
}

export interface CacheStats {
  totalResorts: number;
  oldestFetch: number | null;
  newestFetch: number | null;
  totalSearches: number;
}

export function getCacheStats(): CacheStats {
  const store = loadStore();
  const entries = Object.values(store);
  const times = entries.map(e => e.fetchedAt);
  const searches = parseInt(localStorage.getItem("powder-window:search-count") || "0", 10);
  return {
    totalResorts: entries.length,
    oldestFetch: times.length ? Math.min(...times) : null,
    newestFetch: times.length ? Math.max(...times) : null,
    totalSearches: searches,
  };
}

export function incrementSearchCount() {
  const n = parseInt(localStorage.getItem("powder-window:search-count") || "0", 10);
  localStorage.setItem("powder-window:search-count", String(n + 1));
}

export async function fetchForecast(
  lat: number,
  lon: number,
  resortId: string,
  forceRefresh = false
): Promise<ForecastResponse> {
  const store = loadStore();
  const cached = store[resortId];

  // Session reuse: the 16-day payload already covers every in-window date,
  // so within one search session we don't refetch unless explicitly refreshing.
  if (!forceRefresh && memCache.has(resortId)) return memCache.get(resortId)!;

  // Network-FIRST: every search pulls the freshest model run.
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    hourly: "snowfall,snow_depth,temperature_2m,freezing_level_height",
    forecast_days: "16",
    timezone: "auto",
  });

  try {
    const res = await fetch(`${BASE_URL}?${params}`);
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: ForecastResponse = await res.json();
    memCache.set(resortId, data);
    store[resortId] = { data, fetchedAt: Date.now() };
    saveStore(store);
    return data;
  } catch (e) {
    // Offline fallback: any cached copy, regardless of age.
    if (cached) {
      memCache.set(resortId, cached.data);
      return cached.data;
    }
    throw e;
  }
}

export function clearCache() {
  memCache.clear();
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("powder-window:search-count");
}
