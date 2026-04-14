/**
 * Composition Recipe Library
 *
 * Each recipe is a (prompt, scene) pair that teaches the AI how to build
 * complex objects from primitives. Used for:
 * 1. Few-shot examples in the system prompt (immediate quality boost)
 * 2. Fine-tuning dataset export for OpenAI/Anthropic API training
 */

export interface SceneAction {
  tool: "add_object";
  input: {
    name: string;
    type: string;
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    color?: string;
    metalness?: number;
    roughness?: number;
    opacity?: number;
    params?: Record<string, number | string | boolean>;
  };
}

export interface CompositionRecipe {
  prompt: string;
  category: string;
  difficulty: "simple" | "medium" | "complex";
  actions: SceneAction[];
  description: string;
}

export const RECIPES: CompositionRecipe[] = [
  // ═══════════════════════════════════════
  // FURNITURE
  // ═══════════════════════════════════════
  {
    prompt: "a wooden table",
    category: "furniture",
    difficulty: "simple",
    description: "A simple rectangular table with four legs.",
    actions: [
      { tool: "add_object", input: { name: "Table Top", type: "box", position: [0, 0.85, 0], scale: [1.4, 0.06, 0.8], color: "#8B5E3C", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Table Leg FL", type: "box", position: [-0.6, 0.42, 0.3], scale: [0.06, 0.84, 0.06], color: "#7A5230", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Table Leg FR", type: "box", position: [0.6, 0.42, 0.3], scale: [0.06, 0.84, 0.06], color: "#7A5230", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Table Leg BL", type: "box", position: [-0.6, 0.42, -0.3], scale: [0.06, 0.84, 0.06], color: "#7A5230", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Table Leg BR", type: "box", position: [0.6, 0.42, -0.3], scale: [0.06, 0.84, 0.06], color: "#7A5230", roughness: 0.8, metalness: 0 } },
    ],
  },
  {
    prompt: "a chair",
    category: "furniture",
    difficulty: "medium",
    description: "A wooden chair with backrest.",
    actions: [
      { tool: "add_object", input: { name: "Chair Seat", type: "box", position: [0, 0.45, 0], scale: [0.5, 0.05, 0.5], color: "#8B5E3C", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Chair Leg FL", type: "box", position: [-0.2, 0.22, 0.2], scale: [0.04, 0.44, 0.04], color: "#7A5230", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Chair Leg FR", type: "box", position: [0.2, 0.22, 0.2], scale: [0.04, 0.44, 0.04], color: "#7A5230", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Chair Leg BL", type: "box", position: [-0.2, 0.22, -0.2], scale: [0.04, 0.44, 0.04], color: "#7A5230", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Chair Leg BR", type: "box", position: [0.2, 0.22, -0.2], scale: [0.04, 0.44, 0.04], color: "#b45a0e", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Chair Backrest", type: "box", position: [0, 0.72, -0.22], scale: [0.5, 0.5, 0.04], color: "#8B5E3C", roughness: 0.8, metalness: 0 } },
    ],
  },
  {
    prompt: "a bookshelf",
    category: "furniture",
    difficulty: "medium",
    description: "A tall bookshelf with 4 shelves.",
    actions: [
      { tool: "add_object", input: { name: "Shelf Left Side", type: "box", position: [-0.5, 0.9, 0], scale: [0.04, 1.8, 0.35], color: "#6B4226", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Shelf Right Side", type: "box", position: [0.5, 0.9, 0], scale: [0.04, 1.8, 0.35], color: "#6B4226", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Shelf Bottom", type: "box", position: [0, 0.02, 0], scale: [1.04, 0.04, 0.35], color: "#6B4226", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Shelf 1", type: "box", position: [0, 0.45, 0], scale: [1.0, 0.03, 0.34], color: "#7A5230", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Shelf 2", type: "box", position: [0, 0.9, 0], scale: [1.0, 0.03, 0.34], color: "#7A5230", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Shelf 3", type: "box", position: [0, 1.35, 0], scale: [1.0, 0.03, 0.34], color: "#7A5230", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Shelf Top", type: "box", position: [0, 1.8, 0], scale: [1.04, 0.04, 0.35], color: "#6B4226", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Shelf Back", type: "box", position: [0, 0.9, -0.16], scale: [1.0, 1.76, 0.02], color: "#5A3820", roughness: 0.8, metalness: 0 } },
    ],
  },
  {
    prompt: "a bed",
    category: "furniture",
    difficulty: "medium",
    description: "A bed with mattress, frame, and headboard.",
    actions: [
      { tool: "add_object", input: { name: "Bed Frame", type: "box", position: [0, 0.2, 0], scale: [1.2, 0.12, 2.0], color: "#6B4226", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Mattress", type: "box", position: [0, 0.38, 0], scale: [1.15, 0.22, 1.9], color: "#E8E0D8", roughness: 0.9, metalness: 0 } },
      { tool: "add_object", input: { name: "Pillow Left", type: "box", position: [-0.3, 0.55, -0.75], scale: [0.4, 0.12, 0.3], color: "#F5F0EB", roughness: 0.9, metalness: 0 } },
      { tool: "add_object", input: { name: "Pillow Right", type: "box", position: [0.3, 0.55, -0.75], scale: [0.4, 0.12, 0.3], color: "#F5F0EB", roughness: 0.9, metalness: 0 } },
      { tool: "add_object", input: { name: "Headboard", type: "box", position: [0, 0.6, -0.98], scale: [1.3, 0.8, 0.06], color: "#5A3820", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Bed Leg FL", type: "box", position: [-0.55, 0.1, 0.95], scale: [0.06, 0.2, 0.06], color: "#5A3820", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Bed Leg FR", type: "box", position: [0.55, 0.1, 0.95], scale: [0.06, 0.2, 0.06], color: "#5A3820", roughness: 0.8, metalness: 0 } },
    ],
  },

  // ═══════════════════════════════════════
  // BUILDINGS
  // ═══════════════════════════════════════
  {
    prompt: "a simple house",
    category: "buildings",
    difficulty: "medium",
    description: "A house with walls, roof, door, and windows.",
    actions: [
      { tool: "add_object", input: { name: "House Body", type: "box", position: [0, 1, 0], scale: [2.5, 2.0, 2.0], color: "#D4C5A9", roughness: 0.9, metalness: 0 } },
      { tool: "add_object", input: { name: "Roof", type: "roof", position: [0, 2.4, 0], color: "#8B2500", roughness: 0.7, metalness: 0, params: { roofWidth: 2.8, roofHeight: 0.9, roofDepth: 2.2 } } },
      { tool: "add_object", input: { name: "Door", type: "box", position: [0, 0.55, 1.01], scale: [0.45, 1.1, 0.05], color: "#5A3820", roughness: 0.7, metalness: 0 } },
      { tool: "add_object", input: { name: "Door Knob", type: "sphere", position: [0.15, 0.55, 1.05], scale: [0.04, 0.04, 0.04], color: "#C8A84E", roughness: 0.2, metalness: 0.8 } },
      { tool: "add_object", input: { name: "Window Left", type: "box", position: [-0.7, 1.2, 1.01], scale: [0.4, 0.4, 0.03], color: "#87CEEB", roughness: 0.1, metalness: 0.1, opacity: 0.6 } },
      { tool: "add_object", input: { name: "Window Right", type: "box", position: [0.7, 1.2, 1.01], scale: [0.4, 0.4, 0.03], color: "#87CEEB", roughness: 0.1, metalness: 0.1, opacity: 0.6 } },
      { tool: "add_object", input: { name: "Chimney", type: "box", position: [0.7, 2.8, -0.4], scale: [0.3, 0.6, 0.3], color: "#8B4513", roughness: 0.9, metalness: 0 } },
    ],
  },
  {
    prompt: "a skyscraper",
    category: "buildings",
    difficulty: "medium",
    description: "A tall modern glass skyscraper.",
    actions: [
      { tool: "add_object", input: { name: "Tower Base", type: "box", position: [0, 0.3, 0], scale: [2.0, 0.6, 2.0], color: "#4A4A4A", roughness: 0.3, metalness: 0.6 } },
      { tool: "add_object", input: { name: "Tower Body", type: "box", position: [0, 4.0, 0], scale: [1.6, 7.0, 1.6], color: "#6BA3D6", roughness: 0.05, metalness: 0.3, opacity: 0.8 } },
      { tool: "add_object", input: { name: "Tower Spire", type: "cone", position: [0, 8.0, 0], scale: [0.15, 1.5, 0.15], color: "#C0C0C0", roughness: 0.1, metalness: 0.9 } },
      { tool: "add_object", input: { name: "Entrance Canopy", type: "box", position: [0, 0.65, 1.1], scale: [1.2, 0.05, 0.5], color: "#333333", roughness: 0.3, metalness: 0.5 } },
    ],
  },
  {
    prompt: "a castle",
    category: "buildings",
    difficulty: "complex",
    description: "A medieval castle with towers and walls.",
    actions: [
      { tool: "add_object", input: { name: "Castle Keep", type: "box", position: [0, 1.5, 0], scale: [2.0, 3.0, 2.0], color: "#A0937D", roughness: 0.95, metalness: 0 } },
      { tool: "add_object", input: { name: "Tower Front Left", type: "cylinder", position: [-1.5, 1.8, 1.5], scale: [0.5, 3.6, 0.5], color: "#8C8070", roughness: 0.95, metalness: 0 } },
      { tool: "add_object", input: { name: "Tower Front Right", type: "cylinder", position: [1.5, 1.8, 1.5], scale: [0.5, 3.6, 0.5], color: "#8C8070", roughness: 0.95, metalness: 0 } },
      { tool: "add_object", input: { name: "Tower Back Left", type: "cylinder", position: [-1.5, 1.8, -1.5], scale: [0.5, 3.6, 0.5], color: "#8C8070", roughness: 0.95, metalness: 0 } },
      { tool: "add_object", input: { name: "Tower Back Right", type: "cylinder", position: [1.5, 1.8, -1.5], scale: [0.5, 3.6, 0.5], color: "#8C8070", roughness: 0.95, metalness: 0 } },
      { tool: "add_object", input: { name: "Tower Cap FL", type: "cone", position: [-1.5, 3.8, 1.5], scale: [0.6, 0.8, 0.6], color: "#6B3A2A", roughness: 0.7, metalness: 0 } },
      { tool: "add_object", input: { name: "Tower Cap FR", type: "cone", position: [1.5, 3.8, 1.5], scale: [0.6, 0.8, 0.6], color: "#6B3A2A", roughness: 0.7, metalness: 0 } },
      { tool: "add_object", input: { name: "Tower Cap BL", type: "cone", position: [-1.5, 3.8, -1.5], scale: [0.6, 0.8, 0.6], color: "#6B3A2A", roughness: 0.7, metalness: 0 } },
      { tool: "add_object", input: { name: "Tower Cap BR", type: "cone", position: [1.5, 3.8, -1.5], scale: [0.6, 0.8, 0.6], color: "#6B3A2A", roughness: 0.7, metalness: 0 } },
      { tool: "add_object", input: { name: "Front Wall", type: "box", position: [0, 1.0, 1.5], scale: [3.0, 2.0, 0.25], color: "#A0937D", roughness: 0.95, metalness: 0 } },
      { tool: "add_object", input: { name: "Gate", type: "box", position: [0, 0.6, 1.65], scale: [0.6, 1.2, 0.1], color: "#4A3828", roughness: 0.7, metalness: 0.1 } },
    ],
  },

  // ═══════════════════════════════════════
  // VEHICLES
  // ═══════════════════════════════════════
  {
    prompt: "a car",
    category: "vehicles",
    difficulty: "medium",
    description: "A simple sedan car.",
    actions: [
      { tool: "add_object", input: { name: "Car Body", type: "roundedBox", position: [0, 0.4, 0], scale: [1, 1, 1], color: "#CC2233", roughness: 0.2, metalness: 0.6, params: { rbWidth: 1.8, rbHeight: 0.5, rbDepth: 0.9, cornerRadius: 0.08 } } },
      { tool: "add_object", input: { name: "Car Cabin", type: "roundedBox", position: [0.05, 0.75, 0], scale: [1, 1, 1], color: "#CC2233", roughness: 0.2, metalness: 0.6, params: { rbWidth: 1.0, rbHeight: 0.4, rbDepth: 0.82, cornerRadius: 0.06 } } },
      { tool: "add_object", input: { name: "Windshield", type: "box", position: [-0.35, 0.75, 0], scale: [0.02, 0.35, 0.72], color: "#87CEEB", roughness: 0.05, metalness: 0.1, opacity: 0.5 } },
      { tool: "add_object", input: { name: "Rear Window", type: "box", position: [0.45, 0.75, 0], scale: [0.02, 0.3, 0.7], color: "#87CEEB", roughness: 0.05, metalness: 0.1, opacity: 0.5 } },
      { tool: "add_object", input: { name: "Wheel FL", type: "cylinder", position: [-0.55, 0.18, 0.48], rotation: [Math.PI / 2, 0, 0], scale: [0.18, 0.08, 0.18], color: "#222222", roughness: 0.9, metalness: 0 } },
      { tool: "add_object", input: { name: "Wheel FR", type: "cylinder", position: [-0.55, 0.18, -0.48], rotation: [Math.PI / 2, 0, 0], scale: [0.18, 0.08, 0.18], color: "#222222", roughness: 0.9, metalness: 0 } },
      { tool: "add_object", input: { name: "Wheel BL", type: "cylinder", position: [0.55, 0.18, 0.48], rotation: [Math.PI / 2, 0, 0], scale: [0.18, 0.08, 0.18], color: "#222222", roughness: 0.9, metalness: 0 } },
      { tool: "add_object", input: { name: "Wheel BR", type: "cylinder", position: [0.55, 0.18, -0.48], rotation: [Math.PI / 2, 0, 0], scale: [0.18, 0.08, 0.18], color: "#222222", roughness: 0.9, metalness: 0 } },
      { tool: "add_object", input: { name: "Headlight L", type: "sphere", position: [-0.9, 0.4, 0.3], scale: [0.06, 0.06, 0.06], color: "#FFFFCC", roughness: 0.1, metalness: 0.2 } },
      { tool: "add_object", input: { name: "Headlight R", type: "sphere", position: [-0.9, 0.4, -0.3], scale: [0.06, 0.06, 0.06], color: "#FFFFCC", roughness: 0.1, metalness: 0.2 } },
    ],
  },
  {
    prompt: "a rocket",
    category: "vehicles",
    difficulty: "medium",
    description: "A space rocket on a launch pad.",
    actions: [
      { tool: "add_object", input: { name: "Rocket Body", type: "cylinder", position: [0, 2.5, 0], scale: [0.5, 4.0, 0.5], color: "#E8E8E8", roughness: 0.3, metalness: 0.5 } },
      { tool: "add_object", input: { name: "Nose Cone", type: "cone", position: [0, 5.0, 0], scale: [0.5, 1.2, 0.5], color: "#CC2233", roughness: 0.3, metalness: 0.4 } },
      { tool: "add_object", input: { name: "Fin 1", type: "wedge", position: [0.45, 0.4, 0], rotation: [0, 0, -0.3], scale: [1, 1, 1], color: "#CC2233", roughness: 0.3, metalness: 0.4, params: { wedgeWidth: 0.02, wedgeHeight: 0.8, wedgeDepth: 0.4 } } },
      { tool: "add_object", input: { name: "Fin 2", type: "wedge", position: [-0.45, 0.4, 0], rotation: [0, Math.PI, 0.3], scale: [1, 1, 1], color: "#CC2233", roughness: 0.3, metalness: 0.4, params: { wedgeWidth: 0.02, wedgeHeight: 0.8, wedgeDepth: 0.4 } } },
      { tool: "add_object", input: { name: "Fin 3", type: "wedge", position: [0, 0.4, 0.45], rotation: [0.3, Math.PI / 2, 0], scale: [1, 1, 1], color: "#CC2233", roughness: 0.3, metalness: 0.4, params: { wedgeWidth: 0.02, wedgeHeight: 0.8, wedgeDepth: 0.4 } } },
      { tool: "add_object", input: { name: "Engine Nozzle", type: "cylinder", position: [0, 0.15, 0], scale: [0.35, 0.3, 0.35], color: "#444444", roughness: 0.3, metalness: 0.8, params: { radiusTop: 0.6, radiusBottom: 1.0 } } },
      { tool: "add_object", input: { name: "Window", type: "sphere", position: [0.0, 3.8, 0.48], scale: [0.12, 0.12, 0.04], color: "#87CEEB", roughness: 0.05, metalness: 0.2 } },
      { tool: "add_object", input: { name: "Launch Pad", type: "cylinder", position: [0, 0.05, 0], scale: [1.2, 0.1, 1.2], color: "#666666", roughness: 0.8, metalness: 0.3 } },
    ],
  },

  // ═══════════════════════════════════════
  // NATURE / OUTDOOR
  // ═══════════════════════════════════════
  {
    prompt: "a tree",
    category: "nature",
    difficulty: "simple",
    description: "A tree with trunk and leafy canopy.",
    actions: [
      { tool: "add_object", input: { name: "Tree Trunk", type: "cylinder", position: [0, 0.7, 0], scale: [0.15, 1.4, 0.15], color: "#5A3820", roughness: 0.9, metalness: 0 } },
      { tool: "add_object", input: { name: "Tree Canopy", type: "sphere", position: [0, 1.9, 0], scale: [0.9, 1.0, 0.9], color: "#2D7A3A", roughness: 0.9, metalness: 0 } },
    ],
  },
  {
    prompt: "a snowman",
    category: "nature",
    difficulty: "simple",
    description: "A classic snowman with hat and carrot nose.",
    actions: [
      { tool: "add_object", input: { name: "Bottom Ball", type: "sphere", position: [0, 0.5, 0], scale: [0.5, 0.5, 0.5], color: "#F0F0F0", roughness: 0.9, metalness: 0 } },
      { tool: "add_object", input: { name: "Middle Ball", type: "sphere", position: [0, 1.1, 0], scale: [0.38, 0.38, 0.38], color: "#F0F0F0", roughness: 0.9, metalness: 0 } },
      { tool: "add_object", input: { name: "Head", type: "sphere", position: [0, 1.6, 0], scale: [0.28, 0.28, 0.28], color: "#F0F0F0", roughness: 0.9, metalness: 0 } },
      { tool: "add_object", input: { name: "Hat Brim", type: "cylinder", position: [0, 1.82, 0], scale: [0.3, 0.03, 0.3], color: "#1A1A1A", roughness: 0.7, metalness: 0 } },
      { tool: "add_object", input: { name: "Hat Top", type: "cylinder", position: [0, 2.0, 0], scale: [0.2, 0.3, 0.2], color: "#1A1A1A", roughness: 0.7, metalness: 0 } },
      { tool: "add_object", input: { name: "Carrot Nose", type: "cone", position: [0, 1.6, 0.3], rotation: [Math.PI / 2, 0, 0], scale: [0.04, 0.2, 0.04], color: "#FF8C00", roughness: 0.7, metalness: 0 } },
      { tool: "add_object", input: { name: "Left Eye", type: "sphere", position: [-0.08, 1.68, 0.24], scale: [0.03, 0.03, 0.03], color: "#111111", roughness: 0.5, metalness: 0 } },
      { tool: "add_object", input: { name: "Right Eye", type: "sphere", position: [0.08, 1.68, 0.24], scale: [0.03, 0.03, 0.03], color: "#111111", roughness: 0.5, metalness: 0 } },
    ],
  },
  {
    prompt: "a park bench",
    category: "furniture",
    difficulty: "medium",
    description: "A park bench with metal frame and wooden slats.",
    actions: [
      { tool: "add_object", input: { name: "Bench Seat Slat 1", type: "box", position: [0, 0.45, -0.08], scale: [1.4, 0.04, 0.12], color: "#8B5E3C", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Bench Seat Slat 2", type: "box", position: [0, 0.45, 0.08], scale: [1.4, 0.04, 0.12], color: "#8B5E3C", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Bench Seat Slat 3", type: "box", position: [0, 0.45, 0.24], scale: [1.4, 0.04, 0.12], color: "#8B5E3C", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Backrest Slat 1", type: "box", position: [0, 0.65, -0.17], scale: [1.4, 0.04, 0.08], color: "#8B5E3C", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Backrest Slat 2", type: "box", position: [0, 0.8, -0.17], scale: [1.4, 0.04, 0.08], color: "#8B5E3C", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Frame Left", type: "box", position: [-0.6, 0.25, 0.05], scale: [0.04, 0.5, 0.4], color: "#333333", roughness: 0.3, metalness: 0.8 } },
      { tool: "add_object", input: { name: "Frame Right", type: "box", position: [0.6, 0.25, 0.05], scale: [0.04, 0.5, 0.4], color: "#333333", roughness: 0.3, metalness: 0.8 } },
    ],
  },

  // ═══════════════════════════════════════
  // OBJECTS / ITEMS
  // ═══════════════════════════════════════
  {
    prompt: "a lamp",
    category: "objects",
    difficulty: "simple",
    description: "A desk lamp with adjustable arm.",
    actions: [
      { tool: "add_object", input: { name: "Lamp Base", type: "cylinder", position: [0, 0.03, 0], scale: [0.2, 0.06, 0.2], color: "#2A2A2A", roughness: 0.3, metalness: 0.7 } },
      { tool: "add_object", input: { name: "Lamp Pole", type: "cylinder", position: [0, 0.4, 0], scale: [0.02, 0.7, 0.02], color: "#333333", roughness: 0.3, metalness: 0.7 } },
      { tool: "add_object", input: { name: "Lamp Shade", type: "cone", position: [0, 0.8, 0], scale: [0.25, 0.2, 0.25], color: "#F5E6CC", roughness: 0.8, metalness: 0, params: { coneSegments: 32 } } },
      { tool: "add_object", input: { name: "Light Bulb", type: "sphere", position: [0, 0.72, 0], scale: [0.05, 0.07, 0.05], color: "#FFFFAA", roughness: 0.1, metalness: 0.1 } },
    ],
  },
  {
    prompt: "a mug",
    category: "objects",
    difficulty: "simple",
    description: "A coffee mug with handle.",
    actions: [
      { tool: "add_object", input: { name: "Mug Body", type: "cylinder", position: [0, 0.15, 0], scale: [0.15, 0.3, 0.15], color: "#D4D4D4", roughness: 0.4, metalness: 0.1 } },
      { tool: "add_object", input: { name: "Mug Handle", type: "torus", position: [0.17, 0.16, 0], rotation: [0, 0, Math.PI / 2], scale: [0.07, 0.07, 0.07], color: "#D4D4D4", roughness: 0.4, metalness: 0.1, params: { torusRadius: 1.0, tubeRadius: 0.25 } } },
      { tool: "add_object", input: { name: "Coffee", type: "cylinder", position: [0, 0.26, 0], scale: [0.13, 0.02, 0.13], color: "#3A1F0B", roughness: 0.3, metalness: 0 } },
    ],
  },
  {
    prompt: "a computer monitor",
    category: "objects",
    difficulty: "simple",
    description: "A modern flat-screen monitor on a stand.",
    actions: [
      { tool: "add_object", input: { name: "Monitor Screen", type: "box", position: [0, 0.85, 0], scale: [1.2, 0.7, 0.04], color: "#1A1A2E", roughness: 0.1, metalness: 0.3 } },
      { tool: "add_object", input: { name: "Monitor Bezel", type: "box", position: [0, 0.85, -0.025], scale: [1.25, 0.75, 0.03], color: "#2A2A2A", roughness: 0.3, metalness: 0.5 } },
      { tool: "add_object", input: { name: "Monitor Neck", type: "box", position: [0, 0.35, -0.1], scale: [0.08, 0.3, 0.08], color: "#333333", roughness: 0.3, metalness: 0.6 } },
      { tool: "add_object", input: { name: "Monitor Base", type: "cylinder", position: [0, 0.02, -0.1], scale: [0.3, 0.04, 0.2], color: "#333333", roughness: 0.3, metalness: 0.6 } },
    ],
  },
  {
    prompt: "a trophy",
    category: "objects",
    difficulty: "simple",
    description: "A golden trophy cup.",
    actions: [
      { tool: "add_object", input: { name: "Trophy Base", type: "box", position: [0, 0.05, 0], scale: [0.3, 0.1, 0.3], color: "#2A2A2A", roughness: 0.3, metalness: 0.5 } },
      { tool: "add_object", input: { name: "Trophy Stem", type: "cylinder", position: [0, 0.22, 0], scale: [0.04, 0.24, 0.04], color: "#D4AF37", roughness: 0.15, metalness: 0.9 } },
      { tool: "add_object", input: { name: "Trophy Cup", type: "cylinder", position: [0, 0.48, 0], scale: [0.18, 0.22, 0.18], color: "#D4AF37", roughness: 0.15, metalness: 0.9, params: { radiusTop: 1.2, radiusBottom: 0.6 } } },
      { tool: "add_object", input: { name: "Handle Left", type: "torus", position: [-0.22, 0.48, 0], rotation: [0, Math.PI / 2, 0], scale: [0.06, 0.06, 0.06], color: "#D4AF37", roughness: 0.15, metalness: 0.9, params: { torusRadius: 1.0, tubeRadius: 0.2 } } },
      { tool: "add_object", input: { name: "Handle Right", type: "torus", position: [0.22, 0.48, 0], rotation: [0, Math.PI / 2, 0], scale: [0.06, 0.06, 0.06], color: "#D4AF37", roughness: 0.15, metalness: 0.9, params: { torusRadius: 1.0, tubeRadius: 0.2 } } },
    ],
  },

  // ═══════════════════════════════════════
  // SCENES
  // ═══════════════════════════════════════
  {
    prompt: "a dining room scene",
    category: "scenes",
    difficulty: "complex",
    description: "A dining table with 4 chairs and a hanging light.",
    actions: [
      // Table
      { tool: "add_object", input: { name: "Dining Table Top", type: "box", position: [0, 0.75, 0], scale: [2.0, 0.06, 1.2], color: "#8B5E3C", roughness: 0.7, metalness: 0 } },
      { tool: "add_object", input: { name: "Table Leg FL", type: "box", position: [-0.85, 0.37, 0.5], scale: [0.06, 0.74, 0.06], color: "#7A5230", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Table Leg FR", type: "box", position: [0.85, 0.37, 0.5], scale: [0.06, 0.74, 0.06], color: "#7A5230", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Table Leg BL", type: "box", position: [-0.85, 0.37, -0.5], scale: [0.06, 0.74, 0.06], color: "#7A5230", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Table Leg BR", type: "box", position: [0.85, 0.37, -0.5], scale: [0.06, 0.74, 0.06], color: "#7A5230", roughness: 0.8, metalness: 0 } },
      // Chairs
      { tool: "add_object", input: { name: "Chair 1 Seat", type: "box", position: [-0.6, 0.45, 1.0], scale: [0.45, 0.04, 0.45], color: "#A0522D", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Chair 1 Back", type: "box", position: [-0.6, 0.72, 1.2], scale: [0.45, 0.5, 0.04], color: "#A0522D", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Chair 2 Seat", type: "box", position: [0.6, 0.45, 1.0], scale: [0.45, 0.04, 0.45], color: "#A0522D", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Chair 2 Back", type: "box", position: [0.6, 0.72, 1.2], scale: [0.45, 0.5, 0.04], color: "#A0522D", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Chair 3 Seat", type: "box", position: [-0.6, 0.45, -1.0], scale: [0.45, 0.04, 0.45], color: "#A0522D", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Chair 3 Back", type: "box", position: [-0.6, 0.72, -1.2], scale: [0.45, 0.5, 0.04], color: "#A0522D", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Chair 4 Seat", type: "box", position: [0.6, 0.45, -1.0], scale: [0.45, 0.04, 0.45], color: "#A0522D", roughness: 0.8, metalness: 0 } },
      { tool: "add_object", input: { name: "Chair 4 Back", type: "box", position: [0.6, 0.72, -1.2], scale: [0.45, 0.5, 0.04], color: "#A0522D", roughness: 0.8, metalness: 0 } },
      // Hanging light
      { tool: "add_object", input: { name: "Light Cord", type: "cylinder", position: [0, 2.0, 0], scale: [0.01, 1.0, 0.01], color: "#333333", roughness: 0.5, metalness: 0.3 } },
      { tool: "add_object", input: { name: "Light Shade", type: "cone", position: [0, 1.5, 0], scale: [0.3, 0.15, 0.3], color: "#F5E6CC", roughness: 0.7, metalness: 0 } },
    ],
  },
];

/**
 * Get a subset of recipes for few-shot examples in the system prompt.
 * Selects diverse examples across categories and difficulties.
 */
export function getFewShotExamples(count = 5): CompositionRecipe[] {
  const categories = [...new Set(RECIPES.map(r => r.category))];
  const selected: CompositionRecipe[] = [];

  // Pick one from each category, preferring medium difficulty
  for (const cat of categories) {
    if (selected.length >= count) break;
    const inCat = RECIPES.filter(r => r.category === cat);
    const medium = inCat.find(r => r.difficulty === "medium") || inCat[0];
    selected.push(medium);
  }

  return selected.slice(0, count);
}

/**
 * Format recipes as few-shot examples for the system prompt.
 */
export function formatFewShotPrompt(recipes: CompositionRecipe[]): string {
  return recipes
    .map((r, i) => {
      const actions = r.actions
        .map(a => `  ${a.input.name}: ${a.input.type} at [${a.input.position.join(", ")}]${a.input.scale ? ` scale=[${a.input.scale.join(", ")}]` : ""} color=${a.input.color || "#888"}`)
        .join("\n");
      return `Example ${i + 1}: "${r.prompt}"\n${r.description}\n${actions}`;
    })
    .join("\n\n");
}

/**
 * Export all recipes as fine-tuning JSONL for OpenAI/Anthropic API.
 * Each line is a {messages: [...]} training example.
 */
export function exportFineTuningJSONL(systemPromptBase: string): string {
  return RECIPES.map(recipe => {
    const toolCalls = recipe.actions.map(a => ({
      type: "tool_use",
      name: a.tool,
      input: a.input,
    }));

    const example = {
      messages: [
        { role: "system", content: systemPromptBase },
        { role: "user", content: recipe.prompt },
        {
          role: "assistant",
          content: [
            ...toolCalls.map(tc => ({
              type: "tool_use" as const,
              id: `call_${Math.random().toString(36).slice(2, 10)}`,
              name: "add_object",
              input: tc.input,
            })),
            { type: "text" as const, text: recipe.description },
          ],
        },
      ],
    };

    return JSON.stringify(example);
  }).join("\n");
}
