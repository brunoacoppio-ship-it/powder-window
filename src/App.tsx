import { useState, type CSSProperties } from "react";
import { REGIONS } from "./data/resorts";
import { useSeasonalOutlook } from "./hooks/useSeasonalOutlook";
import { ResortOutlookCard } from "./components/ResortOutlookCard";
import { EnsoBanner } from "./components/EnsoBanner";

const MONTHS = [
  { n: 6, label: "Junho" }, { n: 7, label: "Julho" }, { n: 8, label: "Agosto" },
  { n: 9, label: "Setembro" }, { n: 10, label: "Outubro" },
];

const selectStyle: CSSProperties = {
  font: "inherit", fontSize: 14, color: "var(--ink)", background: "var(--surface)",
  border: "1px solid var(--line-strong)", borderRadius: 9, padding: "7px 11px", cursor: "pointer",
};

function horizonLabel(leadDays: number): string {
  if (leadDays < 0) return "mês passado";
  if (leadDays <= 15) return `~${leadDays} dias — previsão entra na conta`;
  const weeks = Math.round(leadDays / 7);
  return `~${weeks} semanas à frente — outlook sazonal`;
}

export default function App() {
  const [year] = useState(2026);
  const [month, setMonth] = useState(8);
  const [region, setRegion] = useState<string | null>(null);
  const { rows, leadDays, refining } = useSeasonalOutlook(year, month, region);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "44px 22px 64px" }}>
      <header style={{ marginBottom: 26 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 600, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.05 }}>
              Powder Window
            </h1>
            <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 15 }}>
              Outlook sazonal de neve — não previsão do tempo. Andes.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <select style={selectStyle} value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTHS.map((m) => <option key={m.n} value={m.n}>{m.label} {year}</option>)}
            </select>
            <select style={selectStyle} value={region ?? ""} onChange={(e) => setRegion(e.target.value || null)}>
              <option value="">Todas as regiões</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 14, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--faint)", display: "flex", gap: 10, alignItems: "center" }}>
          <span>{horizonLabel(leadDays)}</span>
          {refining && <span style={{ color: "var(--blue)" }}>· atualizando com previsão…</span>}
        </div>
      </header>

      <EnsoBanner />

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((row) => <ResortOutlookCard key={row.resort.id} row={row} />)}
      </div>

      <footer style={{ marginTop: 30, paddingTop: 18, borderTop: "1px solid var(--line)", fontSize: 12.5, color: "var(--faint)", lineHeight: 1.6 }}>
        <p style={{ margin: 0 }}>
          <strong style={{ fontWeight: 500, color: "var(--muted)" }}>Como a nota é calculada.</strong>{" "}
          Linha de base dos últimos 5 anos (regime atual) + análogo de ENSO (o histórico profundo
          re-ponderado pelos anos de El Niño/La Niña parecidos com este), fundidos por inverso da
          variância. Quando a data entra nos 16 dias, a previsão real entra na fusão e a banda de
          confiança encolhe. A geografia (barlavento/sotavento, base vs. linha de neve) converte a
          anomalia esperada em nota de esquiada. Banda larga = menor confiança.
        </p>
      </footer>
    </div>
  );
}
