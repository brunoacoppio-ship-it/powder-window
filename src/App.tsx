import { useState, type CSSProperties } from "react";
import { REGIONS } from "./data/resorts";
import { useSeasonalOutlook } from "./hooks/useSeasonalOutlook";
import { ResortOutlookCard } from "./components/ResortOutlookCard";
import { EnsoBanner } from "./components/EnsoBanner";

const today = new Date().toISOString().slice(0, 10);
const maxDate = new Date();
maxDate.setFullYear(maxDate.getFullYear() + 1);
const maxDateStr = maxDate.toISOString().slice(0, 10);

const inputStyle: CSSProperties = {
  font: "inherit", fontSize: 14, color: "var(--ink)", background: "var(--surface)",
  border: "1px solid var(--line-strong)", borderRadius: 9, padding: "7px 11px", cursor: "pointer",
};

function horizonLabel(leadDays: number, mode: "forecast" | "seasonal"): string {
  if (leadDays < 0) return "data no passado";
  if (mode === "forecast") return `${leadDays} dias à frente — dados reais do Open-Meteo`;
  const weeks = Math.round(leadDays / 7);
  return `~${weeks} semanas à frente — outlook sazonal (ENSO + climatologia)`;
}

export default function App() {
  const [targetDate, setTargetDate] = useState(today);
  const [region, setRegion] = useState<string | null>(null);
  const { rows, loading, progress, mode, leadDays } = useSeasonalOutlook(targetDate, region);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "44px 22px 64px" }}>
      <header style={{ marginBottom: 26 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 600, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.05 }}>
              Powder Window
            </h1>
            <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 15 }}>
              Condições de neve nos Andes — previsão real ou outlook sazonal.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="date"
              style={inputStyle}
              value={targetDate}
              min={today}
              max={maxDateStr}
              onChange={(e) => e.target.value && setTargetDate(e.target.value)}
            />
            <select style={inputStyle} value={region ?? ""} onChange={(e) => setRegion(e.target.value || null)}>
              <option value="">Todas as regiões</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 14, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--faint)", display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{
            display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: 11,
            background: mode === "forecast" ? "var(--blue-soft)" : "var(--amber-soft)",
            color: mode === "forecast" ? "var(--blue-ink)" : "var(--amber-ink)",
          }}>
            {mode === "forecast" ? "PREVISÃO REAL" : "OUTLOOK SAZONAL"}
          </span>
          <span>{horizonLabel(leadDays, mode)}</span>
          {loading && (
            <span style={{ color: "var(--blue)" }}>
              · carregando {Math.round(progress * 100)}%
            </span>
          )}
        </div>
      </header>

      {mode === "seasonal" && <EnsoBanner />}

      {loading && rows.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              height: 90, borderRadius: 14, background: "var(--surface)",
              border: "1px solid var(--line)", opacity: 0.6,
            }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map((row) => <ResortOutlookCard key={row.resort.id} row={row} />)}
        </div>
      )}

      <footer style={{ marginTop: 30, paddingTop: 18, borderTop: "1px solid var(--line)", fontSize: 12.5, color: "var(--faint)", lineHeight: 1.6 }}>
        <p style={{ margin: 0 }}>
          <strong style={{ fontWeight: 500, color: "var(--muted)" }}>Como a nota é calculada.</strong>{" "}
          Dentro dos 16 dias: dados reais do Open-Meteo (neve fresca 72h, base, temperatura, linha de neve).
          Além dos 16 dias: outlook sazonal — climatologia dos últimos 5 anos + análogo de ENSO (histórico
          re-ponderado por anos similares ao atual) fundidos por inverso da variância.
          Banda larga = menor confiança.
        </p>
      </footer>
    </div>
  );
}
