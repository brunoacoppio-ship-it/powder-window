import { describe, it, expect } from "vitest";
import { computeScore, DEFAULT_WEIGHTS } from "./score";
import type { HourlyForecast } from "../data/forecastClient";
import type { Resort } from "../data/resorts";

function makeHourly(
  hours: number = 96,
  snowfall: number,
  snow_depth: number,
  temperature_2m: number,
  freezing_level_height: number
): HourlyForecast {
  const time: string[] = [];
  const sf: number[] = [];
  const sd: number[] = [];
  const t2m: number[] = [];
  const flh: number[] = [];

  // Start 3 days before target so all 72 hours fall within the scoring window
  const base = new Date("2026-06-19T00:00:00Z");
  for (let i = 0; i < hours; i++) {
    const d = new Date(base.getTime() + i * 3600000);
    time.push(d.toISOString());
    sf.push(snowfall);
    sd.push(snow_depth);
    t2m.push(temperature_2m);
    flh.push(freezing_level_height);
  }
  return { time, snowfall: sf, snow_depth: sd, temperature_2m: t2m, freezing_level_height: flh };
}

const HIGH_RESORT: Resort = {
  id: "test-high", name: "Test High", country: "CH", region: "Alps",
  lat: 46, lon: 8, baseElevation: 1500, topElevation: 3500,
};

const LOW_RESORT: Resort = {
  id: "test-low", name: "Test Low", country: "CH", region: "Alps",
  lat: 46, lon: 8, baseElevation: 800, topElevation: 2000,
};

const TARGET_DATE = "2026-06-22";
const TODAY = "2026-06-19"; // 3 days out → confidence 1.0

describe("computeScore", () => {
  it("deep-cold powder resort scores high", () => {
    // 96h of data covering the 72h window; 1cm/h snowfall, deep base, very cold
    const hourly = makeHourly(96, 1, 2.0, -12, 800);
    const result = computeScore(HIGH_RESORT, TARGET_DATE, hourly, DEFAULT_WEIGHTS, TODAY);

    expect(result.total).toBeGreaterThan(70);
    expect(result.freshSnow).toBeGreaterThanOrEqual(0.9); // 72cm / 50cm → clamped to 1
    expect(result.snowQuality).toBeGreaterThan(0.7);
    expect(result.confidence).toBe(1.0);
  });

  it("warm rain-on-base resort: snowQuality=0 and rainExposure=1", () => {
    // Very warm — freezing level well above top; quality/terrain components are 0
    const hourly = makeHourly(96, 1, 2.0, 3, 3000);
    const result = computeScore(LOW_RESORT, TARGET_DATE, hourly, DEFAULT_WEIGHTS, TODAY);
    expect(result.snowQuality).toBe(0); // temp ≥ 2°C → qualityTemp = 0
    expect(result.rainExposure).toBe(1);
    // Base depth + fresh snow still contribute; verify quality/terrain are wiped out
    expect(result.aboveSnowline).toBe(0);
  });

  it("powder resort beats rain resort even with same raw snowfall", () => {
    const powderHourly = makeHourly(96, 1, 2.0, -12, 800);
    const rainHourly = makeHourly(96, 1, 2.0, 3, 3000);
    const powderScore = computeScore(HIGH_RESORT, TARGET_DATE, powderHourly, DEFAULT_WEIGHTS, TODAY);
    const rainScore = computeScore(LOW_RESORT, TARGET_DATE, rainHourly, DEFAULT_WEIGHTS, TODAY);
    expect(powderScore.total).toBeGreaterThan(rainScore.total);
  });

  it("freezing level exactly at base → rainExposure 0, aboveSnowline 1", () => {
    const hourly = makeHourly(96, 0.5, 1.5, -6, HIGH_RESORT.baseElevation);
    const result = computeScore(HIGH_RESORT, TARGET_DATE, hourly, DEFAULT_WEIGHTS, TODAY);
    expect(result.rainExposure).toBeCloseTo(0, 5);
    expect(result.aboveSnowline).toBeCloseTo(1, 5);
  });

  it("confidence decays with lead days", () => {
    const hourly = makeHourly(96, 1, 2.0, -12, 800);
    const nearScore = computeScore(HIGH_RESORT, TARGET_DATE, hourly, DEFAULT_WEIGHTS, "2026-06-19"); // 3 days
    const farScore = computeScore(HIGH_RESORT, TARGET_DATE, hourly, DEFAULT_WEIGHTS, "2026-06-06"); // 16 days
    expect(nearScore.confidence).toBe(1.0);
    expect(farScore.confidence).toBeCloseTo(0.6, 1);
    expect(nearScore.total).toBeGreaterThan(farScore.total);
  });
});
