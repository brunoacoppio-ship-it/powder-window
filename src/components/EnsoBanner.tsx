import { CURRENT_ONI, ensoPhase } from "../data/enso";

export function EnsoBanner() {
  const phase = ensoPhase(CURRENT_ONI);
  const favorable = CURRENT_ONI >= 0.5;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        background: favorable ? "var(--blue-soft)" : "var(--stone-soft)",
        borderRadius: 12,
        padding: "12px 16px",
        margin: "0 0 22px",
      }}
    >
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--blue-ink)", whiteSpace: "nowrap", paddingTop: 1 }}>
        ONI {CURRENT_ONI > 0 ? "+" : ""}{CURRENT_ONI.toFixed(1)}
      </div>
      <div style={{ fontSize: 13.5, color: "var(--blue-ink)", lineHeight: 1.5 }}>
        <strong style={{ fontWeight: 500 }}>{phase.label} {phase.strength}.</strong>{" "}
        Favorece os Andes centrais chilenos (mais rios atmosféricos) e eleva a linha de neve nas
        bases baixas — vantagem para barlavento e cota alta.
      </div>
    </div>
  );
}
