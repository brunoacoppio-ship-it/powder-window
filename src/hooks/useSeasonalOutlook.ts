import { useEffect, useMemo, useState } from "react";
import { RESORTS } from "../data/resorts";
import { computeSeasonalScore, type SeasonalResult } from "../engine/seasonalScore";
import { fetchForecastBase, leadDaysTo } from "../data/liveRefine";

export interface OutlookRow {
  resort: (typeof RESORTS)[number];
  result: SeasonalResult;
  rank: number;
}

/** Mid-month date — the representative target for a monthly outlook. */
export function targetDateFor(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}-15`;
}

export function useSeasonalOutlook(year: number, month: number, region: string | null) {
  const targetDate = targetDateFor(year, month);
  const leadDays = leadDaysTo(targetDate);

  // Seasonal baseline — synchronous, always available, runs offline.
  const base = useMemo(() => {
    const resorts = region ? RESORTS.filter((r) => r.region === region) : RESORTS;
    return resorts.map((resort) => ({
      resort,
      result: computeSeasonalScore(resort),
    }));
  }, [region]);

  const [rows, setRows] = useState<OutlookRow[]>([]);
  const [refining, setRefining] = useState(false);

  useEffect(() => {
    const ranked = (forecastBases: Map<string, number>) =>
      base
        .map(({ resort, result }) => {
          const fb = forecastBases.get(resort.id);
          const r = fb != null ? computeSeasonalScore(resort, { forecastBase: fb }) : result;
          return { resort, result: r };
        })
        .sort((a, b) => b.result.score - a.result.score)
        .map((row, i) => ({ ...row, rank: i + 1 }));

    setRows(ranked(new Map()));

    // Inside the 16-day window, pull live forecasts to collapse the bands.
    if (leadDays <= 15) {
      let cancelled = false;
      setRefining(true);
      Promise.all(
        base.map(async ({ resort }) => {
          const fb = await fetchForecastBase(resort.lat, resort.lon, targetDate);
          return [resort.id, fb] as const;
        })
      ).then((pairs) => {
        if (cancelled) return;
        const m = new Map<string, number>();
        for (const [id, fb] of pairs) if (fb != null) m.set(id, fb);
        if (m.size) setRows(ranked(m));
        setRefining(false);
      });
      return () => { cancelled = true; };
    }
  }, [base, targetDate, leadDays]);

  return { rows, leadDays, targetDate, refining };
}
