// Maps a 0-100 score to a CSS color string
export function scoreToColor(score: number): string {
  if (score >= 75) return "#10b981"; // emerald
  if (score >= 55) return "#3b82f6"; // blue
  if (score >= 35) return "#a855f7"; // purple
  return "#64748b";                  // slate
}

export function scoreToGradient(score: number): string {
  if (score >= 75) return "from-emerald-500 to-emerald-400";
  if (score >= 55) return "from-blue-500 to-blue-400";
  if (score >= 35) return "from-purple-500 to-purple-400";
  return "from-slate-500 to-slate-400";
}

export function scoreLabel(score: number): string {
  if (score >= 75) return "Epic";
  if (score >= 55) return "Great";
  if (score >= 35) return "Fair";
  return "Poor";
}
