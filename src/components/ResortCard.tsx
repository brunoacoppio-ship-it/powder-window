import type { ResortResult } from "../hooks/useForecastScores";
import type { ScoreWeights } from "../scoring/score";
import { COUNTRY_FLAGS } from "../data/resorts";
import { ScoreBreakdownBar } from "./ScoreBreakdownBar";
import { scoreToColor, scoreLabel } from "../utils/scoreColor";

interface Props {
  result: ResortResult;
  weights: ScoreWeights;
  selected: boolean;
  hovered: boolean;
  onSelect: () => void;
  onHover: (hover: boolean) => void;
}

export function ResortCard({ result, weights, selected, hovered, onSelect, onHover }: Props) {
  const { resort, score, rank } = result;
  const color = scoreToColor(score.total);
  const flag = COUNTRY_FLAGS[resort.country] ?? "🏔";

  const borderStyle = selected
    ? `1px solid ${color}`
    : hovered
    ? "1px solid #475569"
    : "1px solid rgba(51, 65, 85, 0.4)";

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{
        position: "relative",
        borderRadius: 16,
        border: borderStyle,
        background: selected
          ? `linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))`
          : hovered
          ? "rgba(15, 23, 42, 0.85)"
          : "rgba(15, 23, 42, 0.55)",
        padding: 16,
        cursor: "pointer",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transition: "all 0.2s ease",
        boxShadow: selected ? `0 8px 32px ${color}25, 0 0 0 1px ${color}30` : "none",
        transform: hovered && !selected ? "translateY(-1px)" : "translateY(0)",
      }}
    >
      {/* Accent gradient strip on left */}
      {(selected || hovered) && (
        <div style={{
          position: "absolute", left: 0, top: "20%", bottom: "20%", width: 3,
          background: `linear-gradient(180deg, ${color}, ${color}80)`,
          borderRadius: "0 3px 3px 0",
        }} />
      )}

      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* Rank with subtle bg */}
        <div style={{
          width: 32, height: 32, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(30, 41, 59, 0.6)",
          borderRadius: 8,
          fontSize: 12, fontWeight: 700, color: "#94a3b8",
          fontFamily: "ui-monospace, monospace",
        }}>
          {rank}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 15 }}>{flag}</span>
                <div style={{ fontWeight: 600, fontSize: 14.5, color: "#f1f5f9", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {resort.name}
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#64748b", letterSpacing: 0.3 }}>
                {resort.region.toUpperCase()}
              </div>
            </div>

            {/* Score with glow */}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{
                fontSize: 28, fontWeight: 800, color, lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
                textShadow: `0 0 24px ${color}40`,
              }}>
                {score.total}
              </div>
              <div style={{
                fontSize: 10, fontWeight: 600, color,
                marginTop: 2, letterSpacing: 0.5, textTransform: "uppercase",
                opacity: 0.85,
              }}>
                {scoreLabel(score.total)}
              </div>
            </div>
          </div>

          {/* Metrics grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 12 }}>
            <Metric label="Fresh" value={`${score.freshSnowCm}`} unit="cm" highlight={score.freshSnowCm >= 20} />
            <Metric label="Base" value={`${score.baseDepthCm}`} unit="cm" />
            <Metric label="Temp" value={`${score.meanTempC}`} unit="°C" highlight={score.meanTempC <= -3} />
            <Metric label="Freeze" value={`${Math.round(score.meanFreezingLevelM / 100) / 10}`} unit="k" />
          </div>

          <ScoreBreakdownBar breakdown={score} weights={weights} compact />
        </div>
      </div>

      {/* Source / confidence badge */}
      {result.source === "historical" ? (
        <div style={{
          position: "absolute", top: 8, right: 8,
          padding: "2px 7px", borderRadius: 6,
          background: "rgba(139, 92, 246, 0.15)",
          border: "1px solid rgba(139, 92, 246, 0.35)",
          color: "#c4b5fd", fontSize: 9, fontWeight: 700,
          letterSpacing: 0.4,
        }}>
          📊 CLIMATE
        </div>
      ) : score.confidence < 0.9 ? (
        <div style={{
          position: "absolute", top: 8, right: 8,
          padding: "2px 7px", borderRadius: 6,
          background: "rgba(245, 158, 11, 0.15)",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          color: "#fbbf24", fontSize: 9.5, fontWeight: 600,
          letterSpacing: 0.3,
        }}>
          {Math.round(score.confidence * 100)}%
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value, unit, highlight = false }: { label: string; value: string; unit: string; highlight?: boolean }) {
  return (
    <div style={{
      background: highlight ? "rgba(59, 130, 246, 0.1)" : "rgba(30, 41, 59, 0.5)",
      border: `1px solid ${highlight ? "rgba(59, 130, 246, 0.25)" : "rgba(51, 65, 85, 0.3)"}`,
      borderRadius: 8,
      padding: "6px 4px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: highlight ? "#93c5fd" : "#cbd5e1", fontVariantNumeric: "tabular-nums" }}>
        {value}<span style={{ fontSize: 9, color: "#64748b", marginLeft: 1 }}>{unit}</span>
      </div>
    </div>
  );
}
