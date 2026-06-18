import type { OutlookRow } from "../hooks/useSeasonalOutlook";
import { COUNTRY_FLAGS } from "../data/resorts";

const TONE = {
  good: { fg: "var(--blue-ink)", bg: "var(--blue-soft)", bar: "var(--blue)" },
  warn: { fg: "var(--amber-ink)", bg: "var(--amber-soft)", bar: "var(--amber)" },
  neutral: { fg: "var(--stone)", bg: "var(--stone-soft)", bar: "var(--stone)" },
} as const;

export function ResortOutlookCard({ row }: { row: OutlookRow }) {
  const { resort, result, rank } = row;
  const t = TONE[result.tone];
  const lo = Math.max(0, Math.min(100, result.scoreLow));
  const hi = Math.max(0, Math.min(100, result.scoreHigh));

  return (
    <article
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 232px",
        gap: 20,
        alignItems: "center",
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 14,
        padding: "16px 18px",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--faint)" }}>
            {String(rank).padStart(2, "0")}
          </span>
          <span style={{ fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em" }}>
            {resort.name}
          </span>
          <span style={{ fontSize: 13, color: "var(--faint)" }}>
            {COUNTRY_FLAGS[resort.country]} {resort.region}
          </span>
        </div>
        <p style={{ margin: "6px 0 10px", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5 }}>
          {result.reasoning}
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12.5, color: "var(--muted)" }}>
          <Metric label="base esperada" value={`${result.low}–${result.high} cm`} />
          <Metric label="linha de neve" value={`${result.expectedSnowLine} m`} />
          <Metric label="vs. normal (5 a)" value={`${result.normalBase} cm`} />
        </div>
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 27, fontWeight: 500, color: "var(--ink)" }}>
            {result.score}
          </span>
          <span style={{ fontSize: 11.5, padding: "3px 9px", borderRadius: 999, color: t.fg, background: t.bg }}>
            {result.tag}
          </span>
        </div>
        <div style={{ position: "relative", height: 8, background: "var(--stone-soft)", borderRadius: 4, margin: "10px 0 5px" }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: `${lo}%`, width: `${Math.max(2, hi - lo)}%`, background: t.bg, borderRadius: 4 }} />
          <div style={{ position: "absolute", top: -3, left: `calc(${Math.min(100, result.score)}% - 1px)`, width: 2.5, height: 14, background: t.bar, borderRadius: 2 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--faint)" }}>
          <span>{lo}–{hi}</span>
          <span>conf. {result.confidence}</span>
        </div>
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
