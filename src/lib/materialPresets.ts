export interface MaterialPreset {
  name: string;
  metalness: number;
  roughness: number;
  color: string;
  opacity: number;
  texture: string | null;
}

export const MATERIAL_PRESETS: Record<string, MaterialPreset> = {
  custom: { name: "Custom", metalness: 0.3, roughness: 0.5, color: "#6b8caf", opacity: 1, texture: null },
  wood: { name: "Wood", metalness: 0, roughness: 0.85, color: "#d19a66", opacity: 1, texture: "wood" },
  metal: { name: "Metal", metalness: 0.9, roughness: 0.2, color: "#c0c0c0", opacity: 1, texture: "brushedMetal" },
  glass: { name: "Glass", metalness: 0.1, roughness: 0.05, color: "#a8d8ea", opacity: 0.3, texture: null },
  brick: { name: "Brick", metalness: 0, roughness: 0.95, color: "#b5523c", opacity: 1, texture: "brick" },
  plastic: { name: "Plastic", metalness: 0, roughness: 0.4, color: "#6b8caf", opacity: 1, texture: null },
  stone: { name: "Stone", metalness: 0, roughness: 0.9, color: "#888888", opacity: 1, texture: "stone" },
  rubber: { name: "Rubber", metalness: 0, roughness: 1.0, color: "#333333", opacity: 1, texture: null },
  gold: { name: "Gold", metalness: 1.0, roughness: 0.1, color: "#ffd700", opacity: 1, texture: null },
};

export function getPreset(key: string): MaterialPreset {
  return MATERIAL_PRESETS[key] ?? MATERIAL_PRESETS.custom;
}

export const PRESET_KEYS: string[] = Object.keys(MATERIAL_PRESETS);

export const SMOOTHNESS_LEVELS = [
  { label: "Low", segments: 8 },
  { label: "Medium", segments: 32 },
  { label: "High", segments: 64 },
  { label: "Ultra", segments: 128 },
] as const;

export function getSmoothSegments(smoothness: number | undefined): number | undefined {
  if (smoothness === undefined) return undefined;
  return SMOOTHNESS_LEVELS[smoothness]?.segments;
}
