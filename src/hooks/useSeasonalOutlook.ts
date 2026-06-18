import { useEffect, useMemo, useState } from "react";
import { RESORTS } from "../data/resorts";
import { computeSeasonalScore, type SeasonalResult } from "../engine/seasonalScore";
import { fetchForecast, clearForecastCache } from "../data/forecastClient";
import { computeScore, DEFAULT_WEIGHTS } from "../scoring/score";
import { leadDaysTo } from "../data/liveRefine";

export type DataMode = "forecast" | "seasonal";

export interface OutlookRow {
  resort: (typeof RESORTS)[number];
  result: SeasonalResult | null;
  forecastScore?: number;
  freshSnowCm?: number;
  baseDepthCm?: number;
  meanTempC?: number;
  freezingLevelM?: number;
  confidence?: number;
  rank: number;
  mode: DataMode;
}

export function useSeasonalOutlook(targetDate: string, region: string | null) {
  const leadDays = leadDaysTo(targetDate);
  const mode: DataMode = leadDays <= 15 ? "forecast" : "seasonal";
  const today = new Date().toISOString().slice(0, 10);

  const resorts = useMemo(
    () => (region ? RESORTS.filter((r) => r.region === region) : RESORTS),
    [region]
  );

  const [rows, setRows] = useState<OutlookRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    clearForecastCache();
    setLoading(true);
    setProgress(0);
    setRows([]);

    const run = async () => {
      const out: Omit<OutlookRow, "rank">[] = [];

      for (let i = 0; i < resorts.length; i++) {
        if (cancelled) return;
        const resort = resorts[i];

        if (mode === "forecast") {
          try {
            const fc = await fetchForecast(resort.lat, resort.lon, resort.id);
            const sc = computeScore(resort, targetDate, fc.hourly, DEFAULT_WEIGHTS, today);
            out.push({
              resort, result: null, mode: "forecast",
              forecastScore: sc.total,
              freshSnowCm: sc.freshSnowCm,
              baseDepthCm: sc.baseDepthCm,
              meanTempC: sc.meanTempC,
              freezingLevelM: sc.freezingLevelM,
              confidence: sc.confidence,
            });
          } catch {
            // skip on network failure
          }
        } else {
          const result = computeSeasonalScore(resort);
          out.push({ resort, result, mode: "seasonal" });
        }

        if (!cancelled) setProgress((i + 1) / resorts.length);
      }

      if (cancelled) return;

      const sorted = out
        .sort((a, b) => {
          const sa = a.mode === "forecast" ? (a.forecastScore ?? 0) : (a.result?.score ?? 0);
          const sb = b.mode === "forecast" ? (b.forecastScore ?? 0) : (b.result?.score ?? 0);
          return sb - sa;
        })
        .map((r, i) => ({ ...r, rank: i + 1 }));

      setRows(sorted);
      setLoading(false);
    };

    run().catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [targetDate, mode, resorts, today]);

  return { rows, loading, progress, mode, leadDays };
}
