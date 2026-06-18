export interface Resort {
  id: string;
  name: string;
  country: string;
  region: string;
  lat: number;
  lon: number;
  baseElevation: number;
  topElevation: number;
  liftCount?: number;
  terrain?: { beginner: number; intermediate: number; advanced: number };
}

export const RESORTS: Resort[] = [
  // South American Andes
  { id: "valle-nevado", name: "Valle Nevado", country: "CL", region: "Andes",
    lat: -33.3539, lon: -70.2486, baseElevation: 2860, topElevation: 3670 },
  { id: "portillo", name: "Portillo", country: "CL", region: "Andes",
    lat: -32.8347, lon: -70.1294, baseElevation: 2880, topElevation: 3310 },
  { id: "nevados-chillan", name: "Nevados de Chillán", country: "CL", region: "Andes",
    lat: -36.9058, lon: -71.4061, baseElevation: 1600, topElevation: 2700 },
  { id: "corralco", name: "Corralco", country: "CL", region: "Andes",
    lat: -38.4333, lon: -71.5000, baseElevation: 1440, topElevation: 2400 },
  { id: "las-lenas", name: "Las Leñas", country: "AR", region: "Andes",
    lat: -35.1494, lon: -70.0833, baseElevation: 2240, topElevation: 3430 },
  { id: "chapelco", name: "Chapelco", country: "AR", region: "Andes",
    lat: -40.2167, lon: -71.4500, baseElevation: 1250, topElevation: 1980 },
  { id: "cerro-castor", name: "Cerro Castor", country: "AR", region: "Patagonia",
    lat: -54.7211, lon: -68.0094, baseElevation: 195, topElevation: 1057 },
  // Alps
  { id: "zermatt", name: "Zermatt", country: "CH", region: "Alps",
    lat: 46.0207, lon: 7.7491, baseElevation: 1620, topElevation: 3883 },
  { id: "chamonix", name: "Chamonix", country: "FR", region: "Alps",
    lat: 45.9237, lon: 6.8694, baseElevation: 1035, topElevation: 3842 },
  { id: "st-anton", name: "St. Anton", country: "AT", region: "Alps",
    lat: 47.1287, lon: 10.2644, baseElevation: 1304, topElevation: 2811 },
  // North America
  { id: "whistler", name: "Whistler Blackcomb", country: "CA", region: "North America",
    lat: 50.1163, lon: -122.9574, baseElevation: 675, topElevation: 2284 },
  { id: "aspen", name: "Aspen Snowmass", country: "US", region: "North America",
    lat: 39.2084, lon: -106.9490, baseElevation: 2473, topElevation: 3813 },
  // Japan
  { id: "niseko", name: "Niseko", country: "JP", region: "Japan",
    lat: 42.8048, lon: 140.6874, baseElevation: 255, topElevation: 1308 },
];

export const REGIONS = [...new Set(RESORTS.map(r => r.region))];

export const COUNTRY_FLAGS: Record<string, string> = {
  CL: "🇨🇱", AR: "🇦🇷", CH: "🇨🇭", FR: "🇫🇷", AT: "🇦🇹",
  CA: "🇨🇦", US: "🇺🇸", JP: "🇯🇵",
};
