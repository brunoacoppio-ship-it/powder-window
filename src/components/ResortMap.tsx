import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import type { ResortResult } from "../hooks/useForecastScores";
import { scoreToColor } from "../utils/scoreColor";
import { COUNTRY_FLAGS } from "../data/resorts";

interface Props {
  results: ResortResult[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

function FlyToSelected({ results, selectedId }: { results: ResortResult[]; selectedId: string | null }) {
  const map = useMap();
  const prevId = useRef<string | null>(null);
  useEffect(() => {
    if (selectedId && selectedId !== prevId.current) {
      const r = results.find(r => r.resort.id === selectedId);
      if (r) map.flyTo([r.resort.lat, r.resort.lon], Math.max(map.getZoom(), 6), { duration: 0.8 });
      prevId.current = selectedId;
    }
  }, [selectedId, results, map]);
  return null;
}

export function ResortMap({ results, selectedId, hoveredId, onSelect, onHover }: Props) {
  return (
    <MapContainer
      center={[20, 10]}
      zoom={2}
      className="w-full h-full rounded-xl overflow-hidden"
      style={{ background: "#0f172a" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={19}
      />

      <FlyToSelected results={results} selectedId={selectedId} />

      {results.map(result => {
        const { resort, score, rank } = result;
        const color = scoreToColor(score.total);
        const isSelected = resort.id === selectedId;
        const isHovered = resort.id === hoveredId;
        const radius = 6 + Math.min(score.freshSnowCm / 5, 10);
        const flag = COUNTRY_FLAGS[resort.country] ?? "🏔";

        return (
          <CircleMarker
            key={resort.id}
            center={[resort.lat, resort.lon]}
            radius={isSelected || isHovered ? radius + 4 : radius}
            pathOptions={{
              color: isSelected ? "#fff" : color,
              fillColor: color,
              fillOpacity: isSelected || isHovered ? 0.95 : 0.75,
              weight: isSelected ? 3 : isHovered ? 2 : 1,
            }}
            eventHandlers={{
              click: () => onSelect(resort.id),
              mouseover: () => onHover(resort.id),
              mouseout: () => onHover(null),
            }}
          >
            <Popup>
              <div className="text-sm min-w-[160px]">
                <div className="font-bold text-slate-100 mb-1">
                  {flag} {resort.name}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl font-bold" style={{ color }}>
                    {score.total}
                  </span>
                  <span className="text-slate-400 text-xs">/ 100 · #{rank}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span>Fresh snow</span><span className="text-slate-200">{score.freshSnowCm} cm</span>
                  <span>Base depth</span><span className="text-slate-200">{score.baseDepthCm} cm</span>
                  <span>Temp</span><span className="text-slate-200">{score.meanTempC}°C</span>
                  <span>Freeze level</span><span className="text-slate-200">{score.meanFreezingLevelM} m</span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
