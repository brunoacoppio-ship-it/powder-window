import { useMemo } from "react";
import type { ForecastResponse } from "../data/forecastClient";
import { computeScore, type ScoreWeights, DEFAULT_WEIGHTS } from "../scoring/score";
import { RESORTS } from "../data/resorts";

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function useBestNearbyDate(
  targetDate: string,
  forecasts: Map<string, ForecastResponse>,
  weights: ScoreWeights = DEFAULT_WEIGHTS
): { bestDate: string; bestAvgScore: number } | null {
  const today = new Date().toISOString().slice(0, 10);

  return useMemo(() => {
    if (forecasts.size === 0) return null;

    let bestDate = targetDate;
    let bestAvg = -1;

    for (let delta = -5; delta <= 5; delta++) {
      const d = addDays(targetDate, delta);
      if (d < today) continue;
      let sum = 0, count = 0;
      for (const resort of RESORTS) {
        const f = forecasts.get(resort.id);
        if (!f) continue;
        const s = computeScore(resort, d, f.hourly, weights, today);
        sum += s.total;
        count++;
      }
      const avg = count > 0 ? sum / count : 0;
      if (avg > bestAvg) { bestAvg = avg; bestDate = d; }
    }

    return { bestDate, bestAvgScore: Math.round(bestAvg) };
  }, [forecasts, targetDate, weights, today]);
}
