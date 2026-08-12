export interface ForceBalanceProfile {
  value: number;
  label: string;
  distanceScale: number;
  repulsionScale: number;
  attractionScale: number;
  linkStrength: number;
}

export function getForceBalanceLabel(value: number): string {
  return `${value} · ${value < 85 ? "松散" : value > 115 ? "紧密" : "均衡"}`;
}

export function getForceBalanceProfile(rawValue: number): ForceBalanceProfile {
  const value = Math.max(
    0,
    Math.min(200, Number.isFinite(rawValue) ? rawValue : 100),
  );
  const compactness = (value - 100) / 100;
  return {
    value,
    label: getForceBalanceLabel(value),
    distanceScale: 1 - compactness * 0.35,
    repulsionScale: 1 - compactness * 0.65,
    attractionScale: 1 + compactness * 0.7,
    linkStrength: Math.max(0.3, Math.min(1, 0.7 + compactness * 0.4)),
  };
}
