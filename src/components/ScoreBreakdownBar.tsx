import type { ScoreBreakdown, ScoreWeights } from "../scoring/score";

interface Props {
  breakdown: ScoreBreakdown;
  weights: ScoreWeights;
  compact?: boolean;
}

const segments = [
  { key: "freshSnow" as const, label: "Fresh", color: "#60a5fa" },
  { key: "baseDepth" as const, label: "Base", color: "#818cf8" },
  { key: "snowQuality" as const, label: "Quality", color: "#a78bfa" },
  { key: "aboveSnowline" as const, label: "Terrain", color: "#34d399" },
];

export function ScoreBreakdownBar({ breakdown, weights, compact = false }: Props) {
  const totalWeight = weights.freshSnow + weights.baseDepth + weights.snowQuality + weights.aboveSnowline;

  return (
    <div className="w-full">
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        {segments.map(seg => {
          const w = (weights[seg.key] / totalWeight) * 100;
          const fill = breakdown[seg.key];
          return (
            <div
              key={seg.key}
              style={{ width: `${w}%`, backgroundColor: "#1e293b" }}
              className="relative overflow-hidden"
              title={`${seg.label}: ${Math.round(fill * 100)}%`}
            >
              <div
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${fill * 100}%`,
                  backgroundColor: seg.color,
                  transition: "width 0.3s ease"
                }}
              />
            </div>
          );
        })}
      </div>
      {!compact && (
        <div className="flex gap-3 mt-1.5">
          {segments.map(seg => (
            <div key={seg.key} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: seg.color }} />
              <span className="text-xs text-slate-500">
                {seg.label} {Math.round(breakdown[seg.key] * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
