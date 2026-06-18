import type { ScoreWeights } from "../scoring/score";

interface Props {
  weights: ScoreWeights;
  onChange: (w: ScoreWeights) => void;
}

const sliders: { key: keyof ScoreWeights; label: string; color: string }[] = [
  { key: "freshSnow", label: "Fresh Snow", color: "#60a5fa" },
  { key: "baseDepth", label: "Base Depth", color: "#818cf8" },
  { key: "snowQuality", label: "Snow Quality", color: "#a78bfa" },
  { key: "aboveSnowline", label: "Terrain", color: "#34d399" },
];

export function WeightSliders({ weights, onChange }: Props) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500 uppercase tracking-wider">Score Weights</span>
        <button
          onClick={() => onChange({ freshSnow: 0.40, baseDepth: 0.20, snowQuality: 0.25, aboveSnowline: 0.15 })}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Reset
        </button>
      </div>
      {sliders.map(s => (
        <div key={s.key} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: s.color }} />
          <span className="text-xs text-slate-400 w-24 flex-shrink-0">{s.label}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={weights[s.key]}
            onChange={e => onChange({ ...weights, [s.key]: parseFloat(e.target.value) })}
            className="flex-1 h-1 accent-blue-500 cursor-pointer"
            style={{ accentColor: s.color }}
          />
          <span className="text-xs text-slate-400 w-8 text-right tabular-nums">
            {Math.round((weights[s.key] / total) * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}
