import type { HourlyForecast } from "../data/forecastClient";
import type { Resort } from "../data/resorts";

export interface ScoreWeights {
  freshSnow: number;    // default 0.40
  baseDepth: number;    // default 0.20
  snowQuality: number;  // default 0.25
  aboveSnowline: number; // default 0.15
}

export const DEFAULT_WEIGHTS: ScoreWeights = {
  freshSnow: 0.40,
  baseDepth: 0.20,
  snowQuality: 0.25,
  aboveSnowline: 0.15,
};

export interface ScoreBreakdown {
  total: number;
  freshSnow: number;
  baseDepth: number;
  snowQuality: number;
  aboveSnowline: number;
  confidence: number;
  // raw metrics
  freshSnowCm: number;
  baseDepthCm: number;
  meanTempC: number;
  meanFreezingLevelM: number;
  qualityTemp: number;
  rainExposure: number;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function parseLocalDate(iso: string): string {
  // Returns YYYY-MM-DD from ISO timestamp
  return iso.slice(0, 10);
}

export function computeScore(
  resort: Resort,
  targetDate: string, // YYYY-MM-DD
  hourly: HourlyForecast,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
  today: string = new Date().toISOString().slice(0, 10)
): ScoreBreakdown {
  const targetTs = new Date(targetDate + "T23:59:59Z").getTime();
  const windowStart = targetTs - 72 * 60 * 60 * 1000;

  // Gather indices for the 72h window and for the target date
  const windowIndices: number[] = [];
  const dayIndices: number[] = [];

  for (let i = 0; i < hourly.time.length; i++) {
    const t = new Date(hourly.time[i]).getTime();
    if (t >= windowStart && t <= targetTs) windowIndices.push(i);
    if (parseLocalDate(hourly.time[i]) === targetDate) dayIndices.push(i);
  }

  // 1. Fresh snow — sum snowfall over 72h window
  const freshSnowCm = windowIndices.reduce((s, i) => s + (hourly.snowfall[i] ?? 0), 0);
  const freshSnow = clamp(freshSnowCm / 50, 0, 1);

  // 2. Base depth — snow_depth on the target date (last available reading)
  const baseReadings = dayIndices.map(i => hourly.snow_depth[i] ?? 0);
  const baseDepthCm = baseReadings.length > 0
    ? baseReadings[baseReadings.length - 1] * 100  // open-meteo returns meters
    : 0;
  const baseDepth = clamp(baseDepthCm / 150, 0, 1);

  // 3. Snow quality
  const tempReadings = windowIndices.map(i => hourly.temperature_2m[i] ?? 0);
  const meanTempC = tempReadings.length > 0
    ? tempReadings.reduce((s, v) => s + v, 0) / tempReadings.length
    : 0;

  // qualityTemp: ≤-5°C → 1.0, 0°C → 0.4, ≥+2°C → 0
  let qualityTemp: number;
  if (meanTempC <= -5) qualityTemp = 1.0;
  else if (meanTempC <= 0) qualityTemp = 1.0 - (meanTempC + 5) * (0.6 / 5);
  else if (meanTempC < 2) qualityTemp = 0.4 - (meanTempC / 2) * 0.4;
  else qualityTemp = 0;

  const flReadings = dayIndices.map(i => hourly.freezing_level_height[i] ?? 0);
  const meanFreezingLevelM = flReadings.length > 0
    ? flReadings.reduce((s, v) => s + v, 0) / flReadings.length
    : resort.baseElevation;

  const vertical = resort.topElevation - resort.baseElevation;
  const rainExposure = clamp(
    (meanFreezingLevelM - resort.baseElevation) / vertical, 0, 1
  );
  const snowQuality = qualityTemp * (1 - rainExposure);

  // 4. Above-snowline terrain
  const aboveFreeze = resort.topElevation - Math.max(meanFreezingLevelM, resort.baseElevation);
  const aboveSnowline = clamp(aboveFreeze / vertical, 0, 1);

  // 5. Confidence multiplier
  const todayTs = new Date(today).getTime();
  const targetDayTs = new Date(targetDate).getTime();
  const leadDays = (targetDayTs - todayTs) / (1000 * 60 * 60 * 24);
  const confidence = leadDays <= 3
    ? 1.0
    : clamp(1.0 - ((leadDays - 3) / 13) * 0.4, 0.6, 1.0);

  const weighted =
    weights.freshSnow * freshSnow +
    weights.baseDepth * baseDepth +
    weights.snowQuality * snowQuality +
    weights.aboveSnowline * aboveSnowline;

  const total = Math.round(100 * confidence * weighted);

  return {
    total,
    freshSnow,
    baseDepth,
    snowQuality,
    aboveSnowline,
    confidence,
    freshSnowCm: Math.round(freshSnowCm * 10) / 10,
    baseDepthCm: Math.round(baseDepthCm),
    meanTempC: Math.round(meanTempC * 10) / 10,
    meanFreezingLevelM: Math.round(meanFreezingLevelM),
    qualityTemp,
    rainExposure,
  };
}
