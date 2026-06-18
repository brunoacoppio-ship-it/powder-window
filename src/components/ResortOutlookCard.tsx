import type { CSSProperties } from "react";
import type { OutlookRow } from "../hooks/useSeasonalOutlook";
import { COUNTRY_FLAGS } from "../data/resorts";

const TONE = {
  good:    { fg: "var(--blue-ink)",  bg: "var(--blue-soft)",  bar: "var(--blue)" },
  warn:    { fg: "var(--amber-ink)", bg: "var(--amber-soft)", bar: "var(--amber)" },
  neutral: { fg: "var(--stone)",     bg: "var(--stone-soft)", bar: "var(--stone)" },
} as const;

export function ResortOutlookCard({ row }: { row: OutlookRow }) {
  const { resort, rank, mode } = row;

  if (mode === "forecast") {
    const score = row.forecastScore ?? 0;
    const conf = Math.round((row.confidence ?? 1) * 100);
    const tone = score >= 55 ? TONE.good : score >= 30 ? TONE.neutral : TONE.warn;
    return (
      <article style={cardStyle}>
        <div style={{ minWidth: 0 }}>
          <div style={nameRowStyle}>
            <span style={rankStyle}>{String(rank).padStart(2, "0")}</span>
            <span style={nameStyle}>{resort.name}</span>
            <span style={regionStyle}>{COUNTRY_FLAGS[resort.country]} {resort.region}</span>
            <span style={{ ...badgeStyle, color: "var(--blue-ink)", background: "var(--blue-soft)" }}>PREVISÃO REAL</span>
          </div>
          <div style={metricsRowStyle}>
            <Metric label="neve fresca (72h)" value={`${row.freshSnowCm ?? 0} cm`} />
            <Metric label="base" value={`${row.baseDepthCm ?? 0} cm`} />
            <Metric label="temp. média" value={`${row.meanTempC?.toFixed(1) ?? "—"}°C`} />
            <Metric label="linha de neve" value={`${row.freezingLevelM ?? "—"} m`} />
          </div>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={scoreStyle}>{score}</span>
            <span style={{ ...badgeStyle, color: tone.fg, background: tone.bg }}>conf. {conf}%</span>
          </div>
          <div style={barTrackStyle}>
            <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${Math.min(100, score)}%`, background: tone.bar, borderRadius: 4 }} />
          </div>
          <div style={barLabelStyle}><span>0</span><span>100</span></div>
        </div>
      </article>
    );
  }

  const result = row.result!;
  const t = TONE[result.tone];
  const lo = Math.max(0, Math.min(100, result.scoreLow));
  const hi = Math.max(0, Math.min(100, result.scoreHigh));

  return (
    <article style={cardStyle}>
      <div style={{ minWidth: 0 }}>
        <div style={nameRowStyle}>
          <span style={rankStyle}>{String(rank).padStart(2, "0")}</span>
          <span style={nameStyle}>{resort.name}</span>
          <span style={regionStyle}>{COUNTRY_FLAGS[resort.country]} {resort.region}</span>
          <span style={{ ...badgeStyle, color: "var(--amber-ink)", background: "var(--amber-soft)" }}>OUTLOOK SAZONAL</span>
        </div>
        <p style={{ margin: "6px 0 10px", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5 }}>
          {result.reasoning}
        </p>
        <div style={metricsRowStyle}>
          <Metric label="base esperada" value={`${result.low}–${result.high} cm`} />
          <Metric label="linha de neve" value={`${result.expectedSnowLine} m`} />
          <Metric label="vs. normal (5a)" value={`${result.normalBase} cm`} />
        </div>
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span style={scoreStyle}>{result.score}</span>
          <span style={{ ...badgeStyle, color: t.fg, background: t.bg }}>{result.tag}</span>
        </div>
        <div style={barTrackStyle}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: `${lo}%`, width: `${Math.max(2, hi - lo)}%`, background: t.bg, borderRadius: 4 }} />
          <div style={{ position: "absolute", top: -3, left: `calc(${Math.min(100, result.score)}% - 1px)`, width: 2.5, height: 14, background: t.bar, borderRadius: 2 }} />
        </div>
        <div style={barLabelStyle}><span>{lo}–{hi}</span><span>conf. {result.confidence}</span></div>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <span style={{ color: "var(--faint)" }}>{label} </span>
      <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink)" }}>{value}</span>
    </span>
  );
}

const cardStyle: CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 220px", gap: 20, alignItems: "center",
  background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 18px",
};
const nameRowStyle: CSSProperties = { display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" };
const rankStyle: CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--faint)" };
const nameStyle: CSSProperties = { fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em" };
const regionStyle: CSSProperties = { fontSize: 13, color: "var(--faint)" };
const badgeStyle: CSSProperties = {
  fontSize: 10.5, fontFamily: "var(--font-mono)", letterSpacing: "0.04em", padding: "2px 8px", borderRadius: 999,
};
const scoreStyle: CSSProperties = { fontFamily: "var(--font-mono)", fontSize: 27, fontWeight: 500, color: "var(--ink)" };
const metricsRowStyle: CSSProperties = { display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12.5, color: "var(--muted)" };
const barTrackStyle: CSSProperties = { position: "relative", height: 8, background: "var(--stone-soft)", borderRadius: 4, margin: "10px 0 5px" };
const barLabelStyle: CSSProperties = { display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--faint)" };
