export type GeoPoint = [number, number];

export interface CordobaRiskZone {
  id: string;
  name: string;
  incidents: number;
  riskLevel: 'moderado' | 'alto' | 'critico';
  trend: string;
  center: GeoPoint;
  polygon: GeoPoint[];
}

export const cordobaMapCenter: GeoPoint = [-31.4201, -64.1888];

export const cordobaRiskZones: CordobaRiskZone[] = [
  {
    id: 'noroeste',
    name: 'Noroeste',
    incidents: 18,
    riskLevel: 'moderado',
    trend: '+8% vs. mes anterior',
    center: [-31.392, -64.232],
    polygon: [
      [-31.375, -64.265],
      [-31.36, -64.235],
      [-31.372, -64.2],
      [-31.395, -64.19],
      [-31.412, -64.212],
      [-31.408, -64.252]
    ]
  },
  {
    id: 'centro',
    name: 'Centro',
    incidents: 41,
    riskLevel: 'critico',
    trend: '+18% vs. mes anterior',
    center: [-31.418, -64.188],
    polygon: [
      [-31.404, -64.206],
      [-31.398, -64.182],
      [-31.409, -64.164],
      [-31.428, -64.165],
      [-31.437, -64.186],
      [-31.43, -64.206]
    ]
  },
  {
    id: 'noreste',
    name: 'Noreste',
    incidents: 29,
    riskLevel: 'alto',
    trend: '+11% vs. mes anterior',
    center: [-31.392, -64.145],
    polygon: [
      [-31.375, -64.17],
      [-31.362, -64.136],
      [-31.378, -64.108],
      [-31.406, -64.113],
      [-31.416, -64.145],
      [-31.4, -64.172]
    ]
  },
  {
    id: 'oeste',
    name: 'Oeste',
    incidents: 23,
    riskLevel: 'alto',
    trend: '+9% vs. mes anterior',
    center: [-31.424, -64.24],
    polygon: [
      [-31.41, -64.272],
      [-31.395, -64.238],
      [-31.409, -64.214],
      [-31.441, -64.216],
      [-31.454, -64.242],
      [-31.443, -64.27]
    ]
  },
  {
    id: 'sur',
    name: 'Sur',
    incidents: 34,
    riskLevel: 'critico',
    trend: '+14% vs. mes anterior',
    center: [-31.465, -64.19],
    polygon: [
      [-31.442, -64.214],
      [-31.437, -64.177],
      [-31.455, -64.151],
      [-31.485, -64.159],
      [-31.495, -64.192],
      [-31.482, -64.222]
    ]
  },
  {
    id: 'sudeste',
    name: 'Sudeste',
    incidents: 27,
    riskLevel: 'alto',
    trend: '+7% vs. mes anterior',
    center: [-31.455, -64.13],
    polygon: [
      [-31.434, -64.155],
      [-31.423, -64.126],
      [-31.441, -64.097],
      [-31.472, -64.101],
      [-31.486, -64.127],
      [-31.474, -64.159]
    ]
  }
];

export const totalRiskIncidents = cordobaRiskZones.reduce((sum, zone) => sum + zone.incidents, 0);
