import { useState, useEffect } from "react";
import { RESORTS, type Resort } from "../data/resorts";
import { fetchForecast, type ForecastResponse } from "../data/forecastClient";
import { fetchHistorical } from "../data/historicalClient";
import { computeScore, type ScoreBreakdown, type ScoreWeights, DEFAULT_WEIGHTS } from "../scoring/score";

export type DataSource = "forecast" | "historical";

export interface ResortResult {
  resort: Resort;
  score: ScoreBreakdown;
  forecast: ForecastResponse;
  rank: number;
  source: DataSource;
  yearsUsed?: number;
  seasonAnomaly?: number;
}

interface State {
  results: ResortResult[];
  loading: boolean;
  error: string | null;
  progress: number;
  source: DataSource;
}

function isBeyondForecastWindow(targetDate: string): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + 15);
  return targetDate > cutoff.toISOString().slice(0, 10);
}

export function useForecastScores(
  targetDate: string,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
  regionFilter: string | null = null
) {
  const beyondWindow = isBeyondForecastWindow(targetDate);
  const source: DataSource = beyondWindow ? "historical" : "forecast";

  const [state, setState] = useState<State>({
    results: [], loading: false, error: null, progress: 0, source,
  });
  const [dataByKey, setDataByKey] = useState<Map<string, { data: ForecastResponse; yearsUsed?: number; seasonAnomaly?: number }>>(new Map());

  const today = new Date().toISOString().slice(0, 10);

  // Cache key includes mode so forecast and historical don't overwrite each other
  const modeKey = beyondWindow ? `hist:${targetDate.slice(5)}` : "fcst";

  useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true, error: null, progress: 0, source }));

    const run = async () => {
      const map = new Map<string, { data: ForecastResponse; yearsUsed?: number; seasonAnomaly?: number }>();
      for (let i = 0; i < RESORTS.length; i++) {
        if (cancelled) return;
        const r = RESORTS[i];
        try {
          if (beyondWindow) {
            const { data, yearsUsed, seasonAnomaly } = await fetchHistorical(r.lat, r.lon, r.baseElevation, r.id, targetDate);
            map.set(r.id, { data, yearsUsed, seasonAnomaly });
          } else {
            const data = await fetchForecast(r.lat, r.lon, r.id);
            map.set(r.id, { data });
          }
        } catch {
          // skip on failure
        }
        if (!cancelled) setState(s => ({ ...s, progress: (i + 1) / RESORTS.length }));
      }
      if (!cancelled) setDataByKey(map);
    };
    run().catch(e => {
      if (!cancelled) setState(s => ({ ...s, loading: false, error: String(e) }));
    });
    return () => { cancelled = true; };
    // Refetch when mode changes (forecast vs historical for a given MM-DD)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeKey]);

  // Recompute scores when data/weights/date/filter change
  useEffect(() => {
    if (dataByKey.size === 0) return;

    const resorts = regionFilter
      ? RESORTS.filter(r => r.region === regionFilter)
      : RESORTS;

    // For historical scoring, use the target date itself as "today" so confidence stays at 1.0
    const scoringToday = beyondWindow ? targetDate : today;

    const results: Omit<ResortResult, "rank">[] = [];
    for (const resort of resorts) {
      const entry = dataByKey.get(resort.id);
      if (!entry) continue;
      const score = computeScore(resort, targetDate, entry.data.hourly, weights, scoringToday);
      results.push({
        resort, score, forecast: entry.data,
        source, yearsUsed: entry.yearsUsed, seasonAnomaly: entry.seasonAnomaly,
      });
    }

    results.sort((a, b) => b.score.total - a.score.total);
    const ranked = results.map((r, i) => ({ ...r, rank: i + 1 }));
    setState({ results: ranked, loading: false, error: null, progress: 1, source });
  }, [dataByKey, targetDate, weights, regionFilter, today, beyondWindow, source]);

  return state;
}
