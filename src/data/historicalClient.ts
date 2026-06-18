import type { ForecastResponse } from "./forecastClient";

const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";
const YEARS_BACK = 5;
const STORAGE_KEY = "powder-window:historical:v2";
const HOURS_WINDOW = 96; // 4 days, target date at hours 72–95

interface HistoricalCached {
  data: ForecastResponse;
  fetchedAt: number;
  yearsUsed: number;
  seasonAnomaly: number; // this year's snowpack vs typical (1.0 = normal)
}

function loadStore(): Record<string, HistoricalCached> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveStore(store: Record<string, HistoricalCached>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch {}
}
function cacheKey(resortId: string, targetDate: string) {
  // Keyed by full date — season anomaly depends on the current year
  return `${resortId}:${targetDate}`;
}
function isoDate(d: Date): string { return d.toISOString().slice(0, 10); }

async function fetchArchiveWindow(
  lat: number, lon: number, startDate: string, endDate: string
): Promise<{ snowfall: number[]; snow_depth: number[]; temp: number[] } | null> {
  const params = new URLSearchParams({
    latitude: lat.toString(), longitude: lon.toString(),
    start_date: startDate, end_date: endDate,
    hourly: "snowfall,snow_depth,temperature_2m", timezone: "auto",
  });
  try {
    const r = await fetch(`${ARCHIVE_URL}?${params}`);
    if (!r.ok) return null;
    const j = await r.json();
    if (!j?.hourly?.time) return null;
    return {
      snowfall: j.hourly.snowfall ?? [],
      snow_depth: j.hourly.snow_depth ?? [],
      temp: j.hourly.temperature_2m ?? [],
    };
  } catch { return null; }
}

function lastValid(arr: number[]): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (typeof arr[i] === "number" && !isNaN(arr[i])) return arr[i];
  }
  return 0;
}

/**
 * Blended projection for dates beyond the 16-day forecast:
 *  - 5-year climatological averages for the target date (typical pattern)
 *  - scaled by a "season anomaly" = how this year's current snowpack compares
 *    to the typical snowpack right now (captures a strong/weak season)
 */
export async function fetchHistorical(
  lat: number, lon: number, baseElevation: number,
  resortId: string, targetDate: string
): Promise<{ data: ForecastResponse; yearsUsed: number; seasonAnomaly: number }> {
  const store = loadStore();
  const key = cacheKey(resortId, targetDate);
  const cached = store[key];
  // Re-use cache for 12h (season anomaly drifts slowly)
  if (cached && Date.now() - cached.fetchedAt < 12 * 3600 * 1000) {
    return { data: cached.data, yearsUsed: cached.yearsUsed, seasonAnomaly: cached.seasonAnomaly };
  }

  const targetD = new Date(targetDate + "T00:00:00Z");

  // 1. Climatological window for the target date (past N years)
  const yearFetches = [];
  for (let i = 1; i <= YEARS_BACK; i++) {
    const start = new Date(targetD);
    start.setUTCFullYear(start.getUTCFullYear() - i);
    start.setUTCDate(start.getUTCDate() - 3);
    const end = new Date(start.getTime() + (HOURS_WINDOW - 1) * 3600000);
    yearFetches.push(fetchArchiveWindow(lat, lon, isoDate(start), isoDate(end)));
  }

  // 2. This year's recent actual snowpack (archive lags ~5 days) — current scenario
  const recentEnd = new Date(Date.now() - 5 * 86400000);
  const recentStart = new Date(recentEnd.getTime() - 6 * 86400000);
  const recentThisYear = fetchArchiveWindow(lat, lon, isoDate(recentStart), isoDate(recentEnd));

  // 3. Typical snowpack for the same recent period across past years (baseline)
  const recentClimFetches = [];
  for (let i = 1; i <= YEARS_BACK; i++) {
    const s = new Date(recentStart); s.setUTCFullYear(s.getUTCFullYear() - i);
    const e = new Date(recentEnd); e.setUTCFullYear(e.getUTCFullYear() - i);
    recentClimFetches.push(fetchArchiveWindow(lat, lon, isoDate(s), isoDate(e)));
  }

  const [yearResults, recentNow, recentClim] = await Promise.all([
    Promise.all(yearFetches),
    recentThisYear,
    Promise.all(recentClimFetches),
  ]);

  const datasets = yearResults.filter((r): r is NonNullable<typeof r> => r !== null);
  if (datasets.length === 0) {
    throw new Error(`No historical data for ${resortId} on ${targetDate}`);
  }

  // Season anomaly: current base depth vs typical base depth for now
  let seasonAnomaly = 1.0;
  if (recentNow) {
    const currentBase = lastValid(recentNow.snow_depth);
    const typicalBases = recentClim
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .map(r => lastValid(r.snow_depth))
      .filter(v => v > 0);
    const typicalBase = typicalBases.length
      ? typicalBases.reduce((a, b) => a + b, 0) / typicalBases.length
      : 0;
    if (typicalBase > 0.05) {
      seasonAnomaly = Math.max(0.5, Math.min(1.5, currentBase / typicalBase));
    }
  }

  // Build synthetic forecast, applying the season anomaly to snow metrics
  const anchor = new Date(targetD); anchor.setUTCDate(anchor.getUTCDate() - 3);
  const time: string[] = [], snowfall: number[] = [], snow_depth: number[] = [],
    temperature_2m: number[] = [], freezing_level_height: number[] = [];

  for (let h = 0; h < HOURS_WINDOW; h++) {
    time.push(new Date(anchor.getTime() + h * 3600000).toISOString());
    let sfSum = 0, sdSum = 0, tSum = 0, count = 0;
    for (const ds of datasets) {
      const tp = ds.temp[h];
      if (typeof tp === "number" && !isNaN(tp)) {
        sfSum += ds.snowfall[h] ?? 0;
        sdSum += ds.snow_depth[h] ?? 0;
        tSum += tp;
        count++;
      }
    }
    const avgT = count ? tSum / count : 0;
    snowfall.push((count ? sfSum / count : 0) * seasonAnomaly);
    snow_depth.push((count ? sdSum / count : 0) * seasonAnomaly);
    temperature_2m.push(avgT);
    freezing_level_height.push(Math.max(0, baseElevation + avgT * (1000 / 6.5)));
  }

  const data: ForecastResponse = {
    latitude: lat, longitude: lon,
    hourly: { time, snowfall, snow_depth, temperature_2m, freezing_level_height },
  };
  store[key] = { data, fetchedAt: Date.now(), yearsUsed: datasets.length, seasonAnomaly };
  saveStore(store);
  return { data, yearsUsed: datasets.length, seasonAnomaly };
}

export function getHistoricalCacheCount(): number {
  return Object.keys(loadStore()).length;
}
export function clearHistoricalCache() {
  localStorage.removeItem(STORAGE_KEY);
}
