import { useState, useMemo, useEffect } from "react";
import { ResortMap } from "./components/ResortMap";
import { ResortCard } from "./components/ResortCard";
import { SkeletonCard } from "./components/SkeletonCard";
import { DetailPanel } from "./components/DetailPanel";
import { WeightSliders } from "./components/WeightSliders";
import { useForecastScores } from "./hooks/useForecastScores";
import { useBestNearbyDate } from "./hooks/useBestNearbyDate";
import { DEFAULT_WEIGHTS, type ScoreWeights } from "./scoring/score";
import { REGIONS } from "./data/resorts";
import { getCacheStats, incrementSearchCount, clearCache, type ForecastResponse } from "./data/forecastClient";
import { getHistoricalCacheCount, clearHistoricalCache } from "./data/historicalClient";

function defaultDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  return d.toISOString().slice(0, 10);
}

function maxDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 2);
  return d.toISOString().slice(0, 10);
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function App() {
  const [targetDate, setTargetDate] = useState(defaultDate);
  const [weights, setWeights] = useState<ScoreWeights>(DEFAULT_WEIGHTS);
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showWeights, setShowWeights] = useState(false);
  const [cacheStats, setCacheStats] = useState(getCacheStats);
  const [histCount, setHistCount] = useState(getHistoricalCacheCount);

  const { results, loading, progress, source } = useForecastScores(targetDate, weights, regionFilter);
  const isHistorical = source === "historical";
  const yearsUsed = results[0]?.yearsUsed;
  const anomalies = results.map(r => r.seasonAnomaly).filter((a): a is number => typeof a === "number");
  const avgAnomaly = anomalies.length ? anomalies.reduce((a, b) => a + b, 0) / anomalies.length : 1;
  const anomalyPct = Math.round((avgAnomaly - 1) * 100);

  // Track every search
  useEffect(() => {
    incrementSearchCount();
    setCacheStats(getCacheStats());
  }, [targetDate, regionFilter]);

  useEffect(() => {
    if (!loading) {
      setCacheStats(getCacheStats());
      setHistCount(getHistoricalCacheCount());
    }
  }, [loading]);

  const forecastsMap = useMemo(() => {
    const m = new Map<string, ForecastResponse>();
    for (const r of results) m.set(r.resort.id, r.forecast);
    return m;
  }, [results]);

  const bestNearby = useBestNearbyDate(targetDate, forecastsMap, weights);
  const showBestNearby = bestNearby && bestNearby.bestDate !== targetDate && results.length > 0 && (results[0]?.score.total ?? 0) < 55;
  const selectedResult = results.find(r => r.resort.id === selectedId) ?? null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at top left, #0a1628 0%, #020617 50%, #000 100%)",
      color: "#f1f5f9",
      fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    }}>
      {/* Decorative gradient orbs */}
      <div style={{
        position: "fixed", top: -200, right: -200, width: 600, height: 600,
        background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: -300, left: -100, width: 700, height: 700,
        background: "radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        borderBottom: "1px solid rgba(30, 41, 59, 0.6)",
        background: "rgba(2, 6, 23, 0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}>
        <div style={{ maxWidth: 1600, margin: "0 auto", padding: "14px 20px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #3b82f6, #1e40af)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(59, 130, 246, 0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
              fontSize: 18,
            }}>
              🏔
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.1, letterSpacing: -0.3 }}>
                Powder Window
              </div>
              <div style={{ fontSize: 10.5, color: "#64748b", letterSpacing: 0.4, textTransform: "uppercase", marginTop: 1 }}>
                Snow forecast intelligence
              </div>
            </div>
          </div>

          {/* Date */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "6px 12px",
            background: "rgba(30, 41, 59, 0.5)",
            border: "1px solid rgba(51, 65, 85, 0.5)",
            borderRadius: 10,
          }}>
            <span style={{ fontSize: 14 }}>📅</span>
            <label style={{ fontSize: 10.5, color: "#64748b", letterSpacing: 0.3, textTransform: "uppercase" }}>Target</label>
            <input
              type="date"
              value={targetDate}
              min={new Date().toISOString().slice(0, 10)}
              max={maxDate()}
              onChange={e => { setTargetDate(e.target.value); setSelectedId(null); }}
              style={{
                background: "transparent", border: "none", outline: "none",
                color: "#f1f5f9", fontSize: 13, fontWeight: 600,
                fontFamily: "inherit", colorScheme: "dark",
              }}
            />
          </div>

          {/* Regions */}
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {[null, ...REGIONS].map(r => (
              <button
                key={r ?? "__all"}
                onClick={() => setRegionFilter(r)}
                style={{
                  padding: "5px 11px", borderRadius: 8, fontSize: 11.5, fontWeight: 600,
                  border: regionFilter === r ? "1px solid #3b82f6" : "1px solid rgba(51, 65, 85, 0.4)",
                  cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                  background: regionFilter === r ? "linear-gradient(135deg, #2563eb, #1e40af)" : "rgba(30, 41, 59, 0.4)",
                  color: regionFilter === r ? "#fff" : "#94a3b8",
                  boxShadow: regionFilter === r ? "0 2px 8px rgba(59, 130, 246, 0.3)" : "none",
                }}
              >
                {r ?? "All"}
              </button>
            ))}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            {/* Cache stats pill */}
            <div title={`${cacheStats.totalResorts} forecasts + ${histCount} climatological records cached`} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "5px 10px",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              borderRadius: 8, fontSize: 11, color: "#34d399", fontWeight: 600,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#10b981", boxShadow: "0 0 8px #10b981",
                animation: "pulse 2s infinite",
              }} />
              <span>{cacheStats.totalResorts}</span>
              <span style={{ color: "#94a3b8", marginLeft: 2 }}>fcst</span>
              <span style={{ color: "#475569", margin: "0 4px" }}>·</span>
              <span style={{ color: "#c4b5fd" }}>{histCount}</span>
              <span style={{ color: "#94a3b8", marginLeft: 2 }}>climate</span>
              <span style={{ color: "#475569", margin: "0 4px" }}>·</span>
              <span style={{ color: "#94a3b8" }}>{cacheStats.totalSearches} searches</span>
            </div>

            <button
              onClick={() => setShowWeights(s => !s)}
              style={{
                padding: "6px 12px", borderRadius: 8, fontSize: 11.5, fontWeight: 600,
                border: showWeights ? "1px solid #3b82f6" : "1px solid rgba(51, 65, 85, 0.4)",
                background: showWeights ? "linear-gradient(135deg, #2563eb, #1e40af)" : "rgba(30, 41, 59, 0.4)",
                color: showWeights ? "#fff" : "#94a3b8",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              ⚖ Weights
            </button>

            <button
              onClick={() => { if (confirm("Clear all cached forecast & climate data?")) { clearCache(); clearHistoricalCache(); location.reload(); } }}
              style={{
                padding: "6px 10px", borderRadius: 8, fontSize: 11.5,
                border: "1px solid rgba(51, 65, 85, 0.4)",
                background: "rgba(30, 41, 59, 0.4)", color: "#64748b",
                cursor: "pointer", fontFamily: "inherit",
              }}
              title="Clear cache"
            >
              ⟲
            </button>
          </div>
        </div>

        {showWeights && (
          <div style={{ borderTop: "1px solid rgba(30, 41, 59, 0.6)", background: "rgba(2, 6, 23, 0.5)", padding: "14px 20px" }}>
            <div style={{ maxWidth: 460 }}>
              <WeightSliders weights={weights} onChange={setWeights} />
            </div>
          </div>
        )}

        {loading && (
          <div style={{ height: 2, background: "rgba(15, 23, 42, 0.8)" }}>
            <div style={{
              height: "100%",
              background: "linear-gradient(90deg, #3b82f6, #10b981)",
              width: `${progress * 100}%`,
              transition: "width 0.3s",
              boxShadow: "0 0 8px rgba(59, 130, 246, 0.6)",
            }} />
          </div>
        )}
      </header>

      {/* Banners */}
      {(isHistorical || showBestNearby) && (
        <div style={{ position: "relative", zIndex: 1, maxWidth: 1600, margin: "0 auto", padding: "14px 20px 0", display: "flex", flexDirection: "column", gap: 8 }}>
          {isHistorical && (
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "11px 16px", borderRadius: 12, fontSize: 12.5,
              border: "1px solid rgba(139, 92, 246, 0.35)",
              background: "linear-gradient(90deg, rgba(76, 29, 149, 0.4), rgba(76, 29, 149, 0.15))",
              color: "#c4b5fd",
              backdropFilter: "blur(8px)",
            }}>
              <span style={{ fontSize: 16 }}>📊</span>
              <span>
                <strong style={{ color: "#ede9fe" }}>Smart projection</strong> — blends {yearsUsed ?? 5}-year climatology for this date with this season's actual snowpack.
                {anomalyPct !== 0 && (
                  <>
                    {" "}This year is tracking{" "}
                    <strong style={{ color: anomalyPct > 0 ? "#6ee7b7" : "#fca5a5" }}>
                      {anomalyPct > 0 ? "+" : ""}{anomalyPct}% {anomalyPct > 0 ? "above" : "below"} normal
                    </strong>{" "}
                    snowpack, applied to the forecast.
                  </>
                )}
                {anomalyPct === 0 && " Season is tracking near normal."}
              </span>
            </div>
          )}
          {showBestNearby && (
            <div
              onClick={() => setTargetDate(bestNearby!.bestDate)}
              style={{
                display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                padding: "11px 16px", borderRadius: 12, fontSize: 12.5,
                border: "1px solid rgba(245, 158, 11, 0.35)",
                background: "linear-gradient(90deg, rgba(120, 53, 15, 0.4), rgba(120, 53, 15, 0.1))",
                color: "#fbbf24",
                backdropFilter: "blur(8px)",
                transition: "transform 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              <span style={{ fontSize: 16 }}>✨</span>
              <span>
                Better powder nearby — <strong style={{ color: "#fef3c7" }}>{bestNearby!.bestDate}</strong> averages{" "}
                <strong style={{ color: "#fef3c7" }}>{bestNearby!.bestAvgScore}</strong>/100. Click to switch.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main */}
      <main style={{
        position: "relative", zIndex: 1,
        maxWidth: 1600, margin: "0 auto", padding: 20,
        display: "flex", gap: 20,
        height: `calc(100vh - ${showWeights ? 168 : 96}px - ${(isHistorical ? 56 : 0) + (showBestNearby ? 56 : 0)}px)`,
        minHeight: 600,
      }}>
        {/* Left */}
        <div style={{ width: 400, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12, overflow: "hidden" }}>
          {selectedResult && (
            <div style={{ flexShrink: 0, maxHeight: "55%", overflowY: "auto" }}>
              <DetailPanel
                result={selectedResult}
                weights={weights}
                targetDate={targetDate}
                onClose={() => setSelectedId(null)}
              />
            </div>
          )}

          {/* Section header */}
          {!loading && results.length > 0 && (
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "0 4px" }}>
              <div style={{ fontSize: 10.5, color: "#64748b", letterSpacing: 0.6, textTransform: "uppercase", fontWeight: 600 }}>
                Ranked · {results.length} resorts
              </div>
              <div style={{ fontSize: 10.5, color: "#475569" }}>
                {cacheStats.newestFetch ? `Updated ${formatRelativeTime(cacheStats.newestFetch)}` : ""}
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 4 }}>
            {loading && results.length === 0
              ? Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)
              : results.map(result => (
                  <ResortCard
                    key={result.resort.id}
                    result={result}
                    weights={weights}
                    selected={selectedId === result.resort.id}
                    hovered={hoveredId === result.resort.id}
                    onSelect={() => setSelectedId(prev => prev === result.resort.id ? null : result.resort.id)}
                    onHover={h => setHoveredId(h ? result.resort.id : null)}
                  />
                ))
            }
            {!loading && results.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#475569", fontSize: 13 }}>
                No resorts for this region
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div style={{
          flex: 1, minWidth: 0,
          borderRadius: 16, overflow: "hidden",
          border: "1px solid rgba(30, 41, 59, 0.6)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
        }}>
          <ResortMap
            results={results}
            selectedId={selectedId}
            hoveredId={hoveredId}
            onSelect={id => setSelectedId(prev => prev === id ? null : id)}
            onHover={setHoveredId}
          />
        </div>
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(0.7);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
