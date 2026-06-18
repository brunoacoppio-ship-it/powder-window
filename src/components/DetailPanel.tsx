import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import type { ResortResult } from "../hooks/useForecastScores";
import type { ScoreWeights } from "../scoring/score";
import { COUNTRY_FLAGS } from "../data/resorts";
import { ScoreBreakdownBar } from "./ScoreBreakdownBar";
import { scoreToColor, scoreLabel } from "../utils/scoreColor";

interface Props {
  result: ResortResult;
  weights: ScoreWeights;
  targetDate: string;
  onClose: () => void;
}

function parseLocalDate(iso: string) { return iso.slice(0, 10); }

export function DetailPanel({ result, weights, targetDate, onClose }: Props) {
  const { resort, score, forecast } = result;
  const flag = COUNTRY_FLAGS[resort.country] ?? "🏔";
  const color = scoreToColor(score.total);

  // Build cumulative snow chart data for the 7 days ending on targetDate
  const targetTs = new Date(targetDate + "T23:59:59Z").getTime();
  const windowStart = targetTs - 7 * 24 * 60 * 60 * 1000;

  const dailySnow: Record<string, number> = {};
  for (let i = 0; i < forecast.hourly.time.length; i++) {
    const t = new Date(forecast.hourly.time[i]).getTime();
    if (t < windowStart || t > targetTs) continue;
    const day = parseLocalDate(forecast.hourly.time[i]);
    dailySnow[day] = (dailySnow[day] ?? 0) + (forecast.hourly.snowfall[i] ?? 0);
  }

  const days = Object.keys(dailySnow).sort();
  let cumulative = 0;
  const chartData = days.map(d => {
    cumulative += dailySnow[d];
    return {
      date: d.slice(5), // MM-DD
      daily: Math.round(dailySnow[d] * 10) / 10,
      cumulative: Math.round(cumulative * 10) / 10,
    };
  });

  // Elevation profile
  const verticalM = resort.topElevation - resort.baseElevation;
  const freezeFraction = Math.min(
    Math.max((score.meanFreezingLevelM - resort.baseElevation) / verticalM, 0), 1
  );
  const snowlinePct = Math.round(freezeFraction * 100);

  return (
    <div className="bg-slate-900/95 backdrop-blur border border-slate-700 rounded-2xl p-5 shadow-2xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-lg font-bold text-slate-100 flex items-center gap-2">
            {flag} {resort.name}
          </div>
          <div className="text-sm text-slate-400">{resort.region} · {resort.country}</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-3xl font-bold tabular-nums" style={{ color }}>
              {score.total}
            </div>
            <div className="text-xs" style={{ color, opacity: 0.8 }}>{scoreLabel(score.total)}</div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="mb-5">
        <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Score breakdown</div>
        <ScoreBreakdownBar breakdown={score} weights={weights} />
        <div className="mt-2 text-xs text-slate-500">
          Confidence: {Math.round(score.confidence * 100)}%
        </div>
      </div>

      {/* Snow accumulation chart */}
      <div className="mb-5">
        <div className="text-xs text-slate-500 mb-3 uppercase tracking-wider">
          Snow accumulation (7-day)
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="snowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#94a3b8" }}
                itemStyle={{ color: "#60a5fa" }}
                formatter={(v) => [`${v} cm`, "Cumulative"]}
              />
              <Area
                type="monotone"
                dataKey="cumulative"
                stroke="#60a5fa"
                strokeWidth={2}
                fill="url(#snowGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-24 flex items-center justify-center text-slate-600 text-sm">
            No forecast data for this period
          </div>
        )}
      </div>

      {/* Elevation profile */}
      <div className="mb-5">
        <div className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Elevation profile</div>
        <div className="flex gap-4 items-center">
          <div className="relative w-16 flex-shrink-0">
            <div className="relative h-32 rounded-lg overflow-hidden" style={{ background: "#1e293b" }}>
              {/* Above snowline — good snow */}
              <div
                className="absolute left-0 right-0 bottom-0"
                style={{
                  height: `${100 - snowlinePct}%`,
                  background: "linear-gradient(to bottom, #60a5fa33, #60a5fa66)",
                  borderTop: "2px dashed #60a5fa88"
                }}
              />
              {/* Snowline label */}
              <div
                className="absolute left-0 right-0 flex items-center justify-center"
                style={{ bottom: `${100 - snowlinePct}%`, transform: "translateY(50%)" }}
              >
                <div className="w-full h-0.5 bg-blue-400/60" />
              </div>
            </div>
          </div>
          <div className="flex-1 text-xs space-y-2">
            <ElevRow label="Summit" value={`${resort.topElevation.toLocaleString()} m`} color="text-slate-200" />
            <ElevRow
              label="Freeze level"
              value={`${score.meanFreezingLevelM.toLocaleString()} m`}
              color="text-blue-400"
            />
            <ElevRow label="Base" value={`${resort.baseElevation.toLocaleString()} m`} color="text-slate-400" />
            <div className="border-t border-slate-800 pt-2 mt-2">
              <ElevRow
                label="Above snowline"
                value={`${Math.round((1 - freezeFraction) * 100)}% of vertical`}
                color="text-emerald-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat label="Fresh snow (72h)" value={`${score.freshSnowCm} cm`} />
        <Stat label="Base depth" value={`${score.baseDepthCm} cm`} />
        <Stat label="Mean temp" value={`${score.meanTempC}°C`} />
        <Stat label="Rain exposure" value={`${Math.round(score.rainExposure * 100)}%`} />
      </div>
    </div>
  );
}

function ElevRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium ${color}`}>{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-800/60 rounded-lg p-2">
      <div className="text-slate-500 mb-0.5">{label}</div>
      <div className="font-semibold text-slate-200">{value}</div>
    </div>
  );
}
