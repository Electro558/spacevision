// src/cad/engine/materials.ts

import type { MaterialConfig } from "./types";

export const MATERIAL_PRESETS: Record<string, MaterialConfig> = {
  "Steel": { color: "#a8a8a8", metalness: 0.8, roughness: 0.3, opacity: 1, preset: "Steel" },
  "Aluminum": { color: "#d4d4d8", metalness: 0.7, roughness: 0.4, opacity: 1, preset: "Aluminum" },
  "Copper": { color: "#c87533", metalness: 0.9, roughness: 0.2, opacity: 1, preset: "Copper" },
  "Gold": { color: "#ffd700", metalness: 1.0, roughness: 0.1, opacity: 1, preset: "Gold" },
  "Plastic (White)": { color: "#f5f5f5", metalness: 0.0, roughness: 0.6, opacity: 1, preset: "Plastic (White)" },
  "Plastic (Black)": { color: "#2a2a2a", metalness: 0.0, roughness: 0.5, opacity: 1, preset: "Plastic (Black)" },
  "Plastic (Red)": { color: "#dc2626", metalness: 0.0, roughness: 0.5, opacity: 1, preset: "Plastic (Red)" },
  "Plastic (Blue)": { color: "#2563eb", metalness: 0.0, roughness: 0.5, opacity: 1, preset: "Plastic (Blue)" },
  "Glass": { color: "#e8f4f8", metalness: 0.1, roughness: 0.0, opacity: 0.3, preset: "Glass" },
  "Wood": { color: "#8B6914", metalness: 0.0, roughness: 0.8, opacity: 1, preset: "Wood" },
  "Rubber": { color: "#333333", metalness: 0.0, roughness: 0.9, opacity: 1, preset: "Rubber" },
  "Chrome": { color: "#e8e8e8", metalness: 1.0, roughness: 0.05, opacity: 1, preset: "Chrome" },
};

export const DEFAULT_MATERIAL: MaterialConfig = MATERIAL_PRESETS["Steel"];
