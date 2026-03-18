/* ─── CAD Scene State Management ─── */

import * as THREE from "three";

export interface SceneObject {
  id: string;
  name: string;
  type: "box" | "sphere" | "cylinder" | "cone" | "torus" | "torusKnot" | "dodecahedron" | "octahedron" | "plane" | "capsule";
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  metalness: number;
  roughness: number;
  visible: boolean;
  locked: boolean;
  isHole: boolean;
  groupId: string | null;
}

export interface CSGGroup {
  id: string;
  name: string;
  objectIds: string[];
  operation: 'union' | 'subtract' | 'intersect';
  visible: boolean;
  locked: boolean;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface CADState {
  objects: SceneObject[];
  selectedId: string | null;
  transformMode: "translate" | "rotate" | "scale";
  wireframe: boolean;
  snapEnabled: boolean;
  snapValue: number;
  gridVisible: boolean;
}

export interface HistoryEntry {
  objects: SceneObject[];
  selectedId: string | null;
}

let _idCounter = 0;
export function newId(): string {
  return `obj_${Date.now()}_${_idCounter++}`;
}

export const DEFAULT_STATE: CADState = {
  objects: [],
  selectedId: null,
  transformMode: "translate",
  wireframe: false,
  snapEnabled: false,
  snapValue: 0.5,
  gridVisible: true,
};

export function createObject(
  type: SceneObject["type"],
  overrides?: Partial<SceneObject>
): SceneObject {
  const names: Record<SceneObject["type"], string> = {
    box: "Cube",
    sphere: "Sphere",
    cylinder: "Cylinder",
    cone: "Cone",
    torus: "Torus",
    torusKnot: "Torus Knot",
    dodecahedron: "Dodecahedron",
    octahedron: "Octahedron",
    plane: "Plane",
    capsule: "Capsule",
  };

  // Count existing objects of same type for naming
  return {
    id: newId(),
    name: names[type] || "Object",
    type,
    position: [0, 0.5, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    color: "#6b8caf",
    metalness: 0.3,
    roughness: 0.5,
    visible: true,
    locked: false,
    isHole: false,
    groupId: null,
    ...overrides,
  };
}

export function duplicateObject(obj: SceneObject): SceneObject {
  return {
    ...obj,
    id: newId(),
    name: `${obj.name} Copy`,
    position: [obj.position[0] + 0.5, obj.position[1], obj.position[2] + 0.5],
  };
}

/* Build geometry from type */
export function buildGeometry(type: SceneObject["type"]): THREE.BufferGeometry {
  switch (type) {
    case "box": return new THREE.BoxGeometry(1, 1, 1);
    case "sphere": return new THREE.SphereGeometry(0.5, 32, 32);
    case "cylinder": return new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
    case "cone": return new THREE.ConeGeometry(0.5, 1, 32);
    case "torus": return new THREE.TorusGeometry(0.4, 0.15, 16, 48);
    case "torusKnot": return new THREE.TorusKnotGeometry(0.4, 0.12, 128, 32);
    case "dodecahedron": return new THREE.DodecahedronGeometry(0.5, 0);
    case "octahedron": return new THREE.OctahedronGeometry(0.5, 0);
    case "plane": return new THREE.PlaneGeometry(1, 1);
    case "capsule": return new THREE.CapsuleGeometry(0.3, 0.5, 8, 16);
    default: return new THREE.BoxGeometry(1, 1, 1);
  }
}

/* Analyze a prompt and return a list of SceneObjects to add */
export function generateFromPrompt(prompt: string): SceneObject[] {
  const lower = prompt.toLowerCase();
  const objects: SceneObject[] = [];

  let baseColor = "#6b8caf";
  let metalness = 0.3;
  let roughness = 0.5;

  // Color detection
  if (/red/.test(lower)) baseColor = "#dc2626";
  else if (/blue/.test(lower)) baseColor = "#2563eb";
  else if (/green/.test(lower)) baseColor = "#16a34a";
  else if (/gold|yellow/.test(lower)) { baseColor = "#ca8a04"; metalness = 0.8; roughness = 0.2; }
  else if (/purple|violet/.test(lower)) baseColor = "#7c3aed";
  else if (/pink/.test(lower)) baseColor = "#db2777";
  else if (/orange/.test(lower)) baseColor = "#ea580c";
  else if (/white/.test(lower)) baseColor = "#e2e8f0";
  else if (/black|dark/.test(lower)) baseColor = "#334155";
  else if (/silver|metal|chrome/.test(lower)) { baseColor = "#94a3b8"; metalness = 0.9; roughness = 0.1; }
  else if (/wood|wooden/.test(lower)) { baseColor = "#92400e"; metalness = 0; roughness = 0.8; }

  const add = (name: string, type: SceneObject["type"], pos: [number, number, number], scale: [number, number, number], color?: string, rot?: [number, number, number], met?: number, rough?: number) => {
    objects.push(createObject(type, {
      name,
      position: pos,
      rotation: rot || [0, 0, 0],
      scale,
      color: color || baseColor,
      metalness: met ?? metalness,
      roughness: rough ?? roughness,
    }));
  };

  // ─── HOUSE ───
  if (/house|home|cabin|cottage/.test(lower)) {
    add("Walls", "box", [0, 0.6, 0], [1.4, 1.2, 1.2]);
    add("Roof", "cone", [0, 1.55, 0], [1.3, 0.7, 1.3], "#78350f");
    add("Door", "box", [0, 0.3, 0.61], [0.3, 0.5, 0.04], "#451a03");
    add("Window L", "box", [-0.4, 0.7, 0.61], [0.25, 0.25, 0.04], "#7dd3fc");
    add("Window R", "box", [0.4, 0.7, 0.61], [0.25, 0.25, 0.04], "#7dd3fc");
    add("Chimney", "box", [0.45, 1.6, -0.2], [0.2, 0.5, 0.2], "#78716c");
    add("Ground", "box", [0, -0.05, 0], [2, 0.1, 1.8], "#65a30d");
  }
  // ─── CASTLE ───
  else if (/castle|tower|fortress|medieval/.test(lower)) {
    add("Main Tower", "cylinder", [0, 1, 0], [0.6, 2, 0.6], "#78716c");
    add("Tower Roof", "cone", [0, 2.3, 0], [0.7, 0.6, 0.7], "#dc2626");
    add("Left Tower", "cylinder", [-0.8, 0.7, 0], [0.35, 1.4, 0.35], "#a8a29e");
    add("Right Tower", "cylinder", [0.8, 0.7, 0], [0.35, 1.4, 0.35], "#a8a29e");
    add("Left Roof", "cone", [-0.8, 1.65, 0], [0.45, 0.5, 0.45], "#dc2626");
    add("Right Roof", "cone", [0.8, 1.65, 0], [0.45, 0.5, 0.45], "#dc2626");
    add("Wall", "box", [0, 0.3, 0.5], [2, 0.6, 0.15], "#78716c");
    add("Gate", "box", [0, 0.2, 0.58], [0.3, 0.4, 0.04], "#451a03");
  }
  // ─── CAR ───
  else if (/car|sedan|vehicle|automobile|sports car/.test(lower)) {
    add("Body", "box", [0, 0.25, 0], [2, 0.4, 0.9], baseColor, undefined, 0.7, 0.2);
    add("Cabin", "box", [0.1, 0.6, 0], [1, 0.35, 0.8], "#1e293b", undefined, 0.3, 0.1);
    add("Hood", "box", [-0.65, 0.4, 0], [0.4, 0.1, 0.75], baseColor, [0, 0, -0.15], 0.7, 0.2);
    add("Wheel FL", "cylinder", [-0.6, 0.05, 0.5], [0.2, 0.12, 0.2], "#1e293b", [Math.PI / 2, 0, 0], 0.2, 0.8);
    add("Wheel FR", "cylinder", [0.6, 0.05, 0.5], [0.2, 0.12, 0.2], "#1e293b", [Math.PI / 2, 0, 0], 0.2, 0.8);
    add("Wheel RL", "cylinder", [-0.6, 0.05, -0.5], [0.2, 0.12, 0.2], "#1e293b", [Math.PI / 2, 0, 0], 0.2, 0.8);
    add("Wheel RR", "cylinder", [0.6, 0.05, -0.5], [0.2, 0.12, 0.2], "#1e293b", [Math.PI / 2, 0, 0], 0.2, 0.8);
    add("Headlight L", "sphere", [-1, 0.3, 0.3], [0.06, 0.06, 0.06], "#fef08a");
    add("Headlight R", "sphere", [-1, 0.3, -0.3], [0.06, 0.06, 0.06], "#fef08a");
  }
  // ─── ROCKET ───
  else if (/rocket|spaceship|spacecraft|shuttle/.test(lower)) {
    add("Fuselage", "cylinder", [0, 0.8, 0], [0.35, 1.8, 0.35], "#e2e8f0");
    add("Nose Cone", "cone", [0, 2.1, 0], [0.35, 0.7, 0.35], "#dc2626");
    add("Fin 1", "box", [0.35, 0.15, 0], [0.02, 0.5, 0.35], "#ef4444", [0, 0, 0.3]);
    add("Fin 2", "box", [-0.35, 0.15, 0], [0.02, 0.5, 0.35], "#ef4444", [0, Math.PI, -0.3]);
    add("Fin 3", "box", [0, 0.15, 0.35], [0.35, 0.5, 0.02], "#ef4444", [0.3, 0, 0]);
    add("Fin 4", "box", [0, 0.15, -0.35], [0.35, 0.5, 0.02], "#ef4444", [-0.3, 0, 0]);
    add("Engine", "cylinder", [0, -0.15, 0], [0.25, 0.2, 0.25], "#475569", undefined, 0.8, 0.2);
    add("Window", "sphere", [0, 1.4, 0.33], [0.12, 0.12, 0.05], "#38bdf8");
    add("Exhaust", "cone", [0, -0.45, 0], [0.2, 0.4, 0.2], "#f97316", [Math.PI, 0, 0]);
  }
  // ─── CAT ───
  else if (/cat|kitten|kitty/.test(lower)) {
    const c = baseColor === "#6b8caf" ? "#f97316" : baseColor;
    add("Body", "sphere", [0, 0.4, 0], [0.5, 0.4, 0.35], c);
    add("Head", "sphere", [0, 0.75, 0.25], [0.28, 0.28, 0.25], c);
    add("Ear L", "cone", [-0.12, 1, 0.25], [0.08, 0.15, 0.06], c, [0, 0, 0.15]);
    add("Ear R", "cone", [0.12, 1, 0.25], [0.08, 0.15, 0.06], c, [0, 0, -0.15]);
    add("Eye L", "sphere", [-0.08, 0.8, 0.47], [0.04, 0.04, 0.03], "#22c55e");
    add("Eye R", "sphere", [0.08, 0.8, 0.47], [0.04, 0.04, 0.03], "#22c55e");
    add("Nose", "sphere", [0, 0.73, 0.49], [0.03, 0.02, 0.02], "#fda4af");
    add("Tail", "cylinder", [0, 0.55, -0.4], [0.04, 0.5, 0.04], c, [0.8, 0, 0]);
    add("Paw FL", "sphere", [-0.2, 0.08, 0.15], [0.1, 0.08, 0.1], c);
    add("Paw FR", "sphere", [0.2, 0.08, 0.15], [0.1, 0.08, 0.1], c);
    add("Paw RL", "sphere", [-0.15, 0.08, -0.15], [0.1, 0.08, 0.1], c);
    add("Paw RR", "sphere", [0.15, 0.08, -0.15], [0.1, 0.08, 0.1], c);
  }
  // ─── DOG ───
  else if (/dog|puppy|hound/.test(lower)) {
    const d = baseColor === "#6b8caf" ? "#92400e" : baseColor;
    add("Body", "sphere", [0, 0.45, 0], [0.55, 0.4, 0.35], d);
    add("Head", "sphere", [0, 0.7, 0.35], [0.25, 0.25, 0.22], d);
    add("Snout", "box", [0, 0.63, 0.55], [0.15, 0.12, 0.15], d);
    add("Nose", "sphere", [0, 0.65, 0.63], [0.04, 0.03, 0.03], "#1e1e1e");
    add("Ear L", "sphere", [-0.18, 0.8, 0.3], [0.12, 0.18, 0.05], d, [0, 0, 0.3]);
    add("Ear R", "sphere", [0.18, 0.8, 0.3], [0.12, 0.18, 0.05], d, [0, 0, -0.3]);
    add("Tail", "cylinder", [0, 0.7, -0.35], [0.04, 0.35, 0.04], d, [0.5, 0, 0]);
    add("Leg FL", "cylinder", [-0.2, 0.15, 0.15], [0.06, 0.3, 0.06], d);
    add("Leg FR", "cylinder", [0.2, 0.15, 0.15], [0.06, 0.3, 0.06], d);
    add("Leg RL", "cylinder", [-0.2, 0.15, -0.15], [0.06, 0.3, 0.06], d);
    add("Leg RR", "cylinder", [0.2, 0.15, -0.15], [0.06, 0.3, 0.06], d);
  }
  // ─── DRAGON ───
  else if (/dragon/.test(lower)) {
    const dr = baseColor === "#6b8caf" ? "#16a34a" : baseColor;
    add("Body", "sphere", [0, 0.5, 0], [0.6, 0.5, 0.4], dr);
    add("Head", "sphere", [0, 0.8, 0.5], [0.25, 0.22, 0.3], dr);
    add("Snout", "cone", [0, 0.75, 0.8], [0.12, 0.25, 0.1], dr, [Math.PI / 2, 0, 0]);
    add("Horn L", "cone", [-0.12, 1.05, 0.45], [0.04, 0.2, 0.04], "#78716c", [0.3, 0, 0.2]);
    add("Horn R", "cone", [0.12, 1.05, 0.45], [0.04, 0.2, 0.04], "#78716c", [0.3, 0, -0.2]);
    add("Wing L", "box", [-0.7, 0.9, 0], [0.8, 0.02, 0.5], dr, [0, 0.3, 0.5]);
    add("Wing R", "box", [0.7, 0.9, 0], [0.8, 0.02, 0.5], dr, [0, -0.3, -0.5]);
    add("Tail", "cylinder", [0, 0.35, -0.5], [0.1, 0.6, 0.1], dr, [0.6, 0, 0]);
    add("Tail Tip", "cone", [0, 0.15, -0.85], [0.12, 0.2, 0.08], dr, [2, 0, 0]);
    add("Eye L", "sphere", [-0.1, 0.88, 0.73], [0.04, 0.03, 0.03], "#fbbf24");
    add("Eye R", "sphere", [0.1, 0.88, 0.73], [0.04, 0.03, 0.03], "#fbbf24");
    add("Leg FL", "cylinder", [-0.25, 0.12, 0.15], [0.08, 0.25, 0.08], dr);
    add("Leg FR", "cylinder", [0.25, 0.12, 0.15], [0.08, 0.25, 0.08], dr);
    add("Leg RL", "cylinder", [-0.25, 0.12, -0.15], [0.08, 0.25, 0.08], dr);
    add("Leg RR", "cylinder", [0.25, 0.12, -0.15], [0.08, 0.25, 0.08], dr);
  }
  // ─── GEAR / MECHANICAL ───
  else if (/gear|mechanical|cog|machine|engine/.test(lower)) {
    add("Main Gear", "torus", [0, 0.5, 0], [0.8, 0.8, 0.8], "#94a3b8", [Math.PI / 2, 0, 0], 0.9, 0.1);
    add("Hub", "cylinder", [0, 0.5, 0], [0.25, 0.2, 0.25], "#64748b", undefined, 0.9, 0.1);
    add("Axle", "cylinder", [0, 0.5, 0], [0.08, 0.4, 0.08], "#334155");
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      add(`Tooth ${i + 1}`, "box",
        [Math.sin(angle) * 0.55, 0.5, Math.cos(angle) * 0.55],
        [0.12, 0.18, 0.25], "#94a3b8", [0, -angle, 0], 0.9, 0.1);
    }
    add("Small Gear", "torus", [0.8, 0.5, 0.6], [0.4, 0.4, 0.4], "#cbd5e1", [Math.PI / 2, 0, 0], 0.8, 0.2);
  }
  // ─── TROPHY ───
  else if (/trophy|cup|award|prize/.test(lower)) {
    const tc = baseColor === "#6b8caf" ? "#ca8a04" : baseColor;
    add("Base", "cylinder", [0, 0.06, 0], [0.4, 0.12, 0.4], tc, undefined, 0.8, 0.2);
    add("Stem", "cylinder", [0, 0.3, 0], [0.08, 0.4, 0.08], tc, undefined, 0.8, 0.2);
    add("Cup", "cylinder", [0, 0.75, 0], [0.35, 0.5, 0.35], tc, undefined, 0.8, 0.2);
    add("Handle L", "torus", [-0.4, 0.75, 0], [0.15, 0.15, 0.15], tc, [0, 0, Math.PI / 2], 0.8, 0.2);
    add("Handle R", "torus", [0.4, 0.75, 0], [0.15, 0.15, 0.15], tc, [0, 0, Math.PI / 2], 0.8, 0.2);
    add("Star", "octahedron", [0, 1.15, 0], [0.12, 0.12, 0.12], "#fef08a", undefined, 0.7, 0.3);
  }
  // ─── CRYSTAL ───
  else if (/crystal|gem|diamond|jewel|gemstone/.test(lower)) {
    const cc = baseColor === "#6b8caf" ? "#22d3ee" : baseColor;
    const crystals = [
      { h: 1.4, r: 0.18, x: 0, z: 0, rz: 0 },
      { h: 1.0, r: 0.14, x: 0.25, z: 0.1, rz: 0.2 },
      { h: 0.8, r: 0.12, x: -0.2, z: 0.15, rz: -0.15 },
      { h: 0.6, r: 0.1, x: 0.1, z: -0.2, rz: 0.1 },
      { h: 1.1, r: 0.15, x: -0.15, z: -0.15, rz: -0.1 },
    ];
    crystals.forEach((c, i) => {
      add(`Crystal ${i + 1}`, "cone",
        [c.x, c.h / 2 - 0.1, c.z],
        [c.r, c.h, c.r], cc, [0, 0, c.rz], 0.3, 0.1);
    });
    add("Rock Base", "dodecahedron", [0, -0.15, 0], [0.5, 0.2, 0.5], "#57534e");
  }
  // ─── TREE ───
  else if (/tree|pine|oak/.test(lower)) {
    add("Trunk", "cylinder", [0, 0.5, 0], [0.12, 1, 0.12], "#78350f");
    add("Foliage 1", "cone", [0, 1.5, 0], [0.8, 0.8, 0.8], "#16a34a");
    add("Foliage 2", "cone", [0, 1.9, 0], [0.65, 0.7, 0.65], "#22c55e", [0, 0.5, 0]);
    add("Foliage 3", "cone", [0, 2.25, 0], [0.45, 0.6, 0.45], "#4ade80", [0, 1, 0]);
  }
  // ─── MOUNTAIN / TERRAIN ───
  else if (/mountain|terrain|landscape|hill/.test(lower)) {
    add("Mountain Main", "cone", [0, 0.5, 0], [1, 1.2, 1], "#57534e");
    add("Snow Cap", "cone", [0, 0.9, 0], [0.4, 0.35, 0.4], "#e2e8f0");
    add("Mountain 2", "cone", [0.8, 0.3, 0.3], [0.7, 0.7, 0.7], "#78716c", [0, 0.5, 0]);
    add("Mountain 3", "cone", [-0.7, 0.25, -0.2], [0.6, 0.5, 0.5], "#78716c", [0, 1, 0]);
    add("Ground", "box", [0, -0.05, 0], [3, 0.1, 2.5], "#65a30d");
  }
  // ─── CHAIR ───
  else if (/chair|seat/.test(lower)) {
    const ch = baseColor === "#6b8caf" ? "#92400e" : baseColor;
    add("Seat", "box", [0, 0.5, 0], [0.6, 0.06, 0.6], ch);
    add("Backrest", "box", [0, 0.85, -0.27], [0.55, 0.65, 0.06], ch);
    add("Leg FL", "cylinder", [-0.25, 0.22, 0.25], [0.03, 0.45, 0.03], "#78350f");
    add("Leg FR", "cylinder", [0.25, 0.22, 0.25], [0.03, 0.45, 0.03], "#78350f");
    add("Leg RL", "cylinder", [-0.25, 0.22, -0.25], [0.03, 0.45, 0.03], "#78350f");
    add("Leg RR", "cylinder", [0.25, 0.22, -0.25], [0.03, 0.45, 0.03], "#78350f");
  }
  // ─── TABLE ───
  else if (/table|desk/.test(lower)) {
    const tb = baseColor === "#6b8caf" ? "#92400e" : baseColor;
    add("Top", "box", [0, 0.7, 0], [1.4, 0.06, 0.8], tb);
    add("Leg FL", "cylinder", [-0.6, 0.33, 0.35], [0.04, 0.65, 0.04], "#78350f");
    add("Leg FR", "cylinder", [0.6, 0.33, 0.35], [0.04, 0.65, 0.04], "#78350f");
    add("Leg RL", "cylinder", [-0.6, 0.33, -0.35], [0.04, 0.65, 0.04], "#78350f");
    add("Leg RR", "cylinder", [0.6, 0.33, -0.35], [0.04, 0.65, 0.04], "#78350f");
  }
  // ─── ROBOT ───
  else if (/robot|mech|android/.test(lower)) {
    add("Torso", "box", [0, 0.6, 0], [0.6, 0.7, 0.4], "#94a3b8", undefined, 0.7, 0.3);
    add("Head", "box", [0, 1.15, 0], [0.35, 0.3, 0.3], "#cbd5e1", undefined, 0.7, 0.3);
    add("Eye L", "sphere", [-0.08, 1.2, 0.16], [0.05, 0.05, 0.03], "#3b82f6");
    add("Eye R", "sphere", [0.08, 1.2, 0.16], [0.05, 0.05, 0.03], "#3b82f6");
    add("Antenna", "cylinder", [0, 1.4, 0], [0.02, 0.2, 0.02], "#475569");
    add("Antenna Tip", "sphere", [0, 1.52, 0], [0.04, 0.04, 0.04], "#ef4444");
    add("Arm L", "cylinder", [-0.45, 0.6, 0], [0.06, 0.5, 0.06], "#64748b", [0, 0, 0.2], 0.7, 0.3);
    add("Arm R", "cylinder", [0.45, 0.6, 0], [0.06, 0.5, 0.06], "#64748b", [0, 0, -0.2], 0.7, 0.3);
    add("Leg L", "cylinder", [-0.15, 0.1, 0], [0.08, 0.3, 0.08], "#64748b", undefined, 0.7, 0.3);
    add("Leg R", "cylinder", [0.15, 0.1, 0], [0.08, 0.3, 0.08], "#64748b", undefined, 0.7, 0.3);
  }
  // ─── FLOWER ───
  else if (/flower|rose|daisy|tulip/.test(lower)) {
    const pc = baseColor === "#6b8caf" ? "#f472b6" : baseColor;
    add("Stem", "cylinder", [0, 0.5, 0], [0.03, 1, 0.03], "#16a34a");
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      add(`Petal ${i + 1}`, "sphere",
        [Math.sin(angle) * 0.2, 1.05, Math.cos(angle) * 0.2],
        [0.15, 0.08, 0.1], pc, [0, angle, 0.5]);
    }
    add("Center", "sphere", [0, 1.05, 0], [0.1, 0.1, 0.1], "#fbbf24");
    add("Leaf L", "sphere", [-0.15, 0.4, 0], [0.15, 0.06, 0.08], "#22c55e", [0, 0, 0.5]);
    add("Leaf R", "sphere", [0.15, 0.6, 0], [0.15, 0.06, 0.08], "#22c55e", [0, 0, -0.5]);
  }
  // ─── AIRPLANE ───
  else if (/airplane|plane|jet|aircraft/.test(lower)) {
    add("Fuselage", "cylinder", [0, 0, 0], [0.2, 1.8, 0.2], "#e2e8f0", [0, 0, Math.PI / 2]);
    add("Nose", "sphere", [-0.9, 0, 0], [0.2, 0.2, 0.2], "#e2e8f0");
    add("Wings", "box", [0, 0, 0], [0.5, 0.04, 2.2], "#94a3b8");
    add("Tail Fin", "box", [0.8, 0.25, 0], [0.3, 0.4, 0.04], baseColor, [0, 0, 0.3]);
    add("Tail Wing", "box", [0.8, 0, 0], [0.2, 0.03, 0.6], "#94a3b8");
    add("Engine L", "cylinder", [0.1, -0.15, 0.5], [0.1, 0.3, 0.1], "#64748b", [0, 0, Math.PI / 2]);
    add("Engine R", "cylinder", [0.1, -0.15, -0.5], [0.1, 0.3, 0.1], "#64748b", [0, 0, Math.PI / 2]);
    add("Cockpit", "sphere", [-0.7, 0.1, 0], [0.15, 0.1, 0.15], "#38bdf8");
  }
  // ─── LIVING ROOM ───
  else if (/living room|bedroom|room|interior|scandinavian/.test(lower)) {
    add("Floor", "box", [0, -0.02, 0], [3, 0.04, 2.5], "#d4a373");
    add("Back Wall", "box", [0, 0.75, -1.2], [3, 1.5, 0.05], "#faf5ee");
    add("Side Wall", "box", [-1.5, 0.75, 0], [0.05, 1.5, 2.5], "#faf5ee");
    add("Sofa Base", "box", [0, 0.25, -0.7], [1.4, 0.3, 0.6], /beige/.test(lower) ? "#d4a373" : "#94a3b8");
    add("Sofa Back", "box", [0, 0.45, -0.95], [1.4, 0.25, 0.15], /beige/.test(lower) ? "#c2956b" : "#787a8b");
    add("Table Top", "box", [0, 0.2, -0.1], [0.7, 0.04, 0.4], "#78350f");
    add("Table Leg L", "cylinder", [-0.25, 0.09, 0], [0.03, 0.18, 0.03], "#451a03");
    add("Table Leg R", "cylinder", [0.25, 0.09, 0], [0.03, 0.18, 0.03], "#451a03");
    add("Window", "box", [0, 0.9, -1.17], [0.8, 0.7, 0.02], "#bae6fd");
    add("Lamp Pole", "cylinder", [0.9, 0.3, -0.7], [0.02, 0.6, 0.02], "#475569");
    add("Lamp Shade", "cone", [0.9, 0.65, -0.7], [0.15, 0.12, 0.15], "#fef3c7", [Math.PI, 0, 0]);
  }
  // ─── ABSTRACT / SCULPTURE ───
  else if (/abstract|sculpture|art|modern/.test(lower)) {
    add("Main Form", "torusKnot", [0, 0.8, 0], [0.5, 0.5, 0.5], baseColor, undefined, 0.6, 0.3);
    add("Sphere", "sphere", [0.5, 0.3, 0], [0.2, 0.2, 0.2], baseColor);
    add("Dodecahedron", "dodecahedron", [-0.4, 0.3, 0.3], [0.18, 0.18, 0.18], baseColor, [0.5, 0.3, 0]);
    add("Base", "cylinder", [0, 0.03, 0], [0.5, 0.06, 0.5], "#334155");
  }
  // ─── MUSHROOM ───
  else if (/mushroom|fungus/.test(lower)) {
    const mc = baseColor === "#6b8caf" ? "#dc2626" : baseColor;
    add("Stem", "cylinder", [0, 0.35, 0], [0.12, 0.7, 0.12], "#fef3c7");
    add("Cap", "sphere", [0, 0.8, 0], [0.45, 0.25, 0.45], mc);
    add("Spot 1", "sphere", [-0.15, 0.92, 0.1], [0.05, 0.04, 0.05], "#fef3c7");
    add("Spot 2", "sphere", [0.1, 0.95, -0.1], [0.05, 0.04, 0.05], "#fef3c7");
    add("Small Stem", "cylinder", [0.3, 0.15, 0.2], [0.06, 0.3, 0.06], "#fef3c7", [0, 0, 0.15]);
    add("Small Cap", "sphere", [0.33, 0.35, 0.2], [0.18, 0.1, 0.18], mc);
  }
  // ─── SWORD ───
  else if (/sword|blade|weapon|dagger/.test(lower)) {
    add("Blade", "box", [0, 1, 0], [0.08, 1.2, 0.02], "#e2e8f0", undefined, 0.9, 0.1);
    add("Blade Tip", "cone", [0, 1.65, 0], [0.04, 0.12, 0.01], "#e2e8f0", undefined, 0.9, 0.1);
    add("Guard", "box", [0, 0.38, 0], [0.25, 0.04, 0.06], "#ca8a04", undefined, 0.7, 0.3);
    add("Grip", "cylinder", [0, 0.2, 0], [0.04, 0.3, 0.04], "#78350f");
    add("Pommel", "sphere", [0, 0.04, 0], [0.06, 0.06, 0.06], "#ca8a04", undefined, 0.7, 0.3);
  }
  // ─── PERSON ───
  else if (/person|man|woman|human|figure|character/.test(lower)) {
    add("Head", "sphere", [0, 1.4, 0], [0.2, 0.22, 0.2], "#d4a373");
    add("Torso", "box", [0, 0.95, 0], [0.45, 0.65, 0.25], baseColor);
    add("Arm L", "cylinder", [-0.35, 0.95, 0], [0.06, 0.55, 0.06], baseColor, [0, 0, 0.15]);
    add("Arm R", "cylinder", [0.35, 0.95, 0], [0.06, 0.55, 0.06], baseColor, [0, 0, -0.15]);
    add("Leg L", "cylinder", [-0.12, 0.3, 0], [0.08, 0.6, 0.08], "#334155");
    add("Leg R", "cylinder", [0.12, 0.3, 0], [0.08, 0.6, 0.08], "#334155");
  }
  // ─── SIMPLE SHAPES ───
  else if (/cube|box/.test(lower)) {
    add("Cube", "box", [0, 0.5, 0], [1, 1, 1], baseColor);
  }
  else if (/sphere|ball|orb|globe/.test(lower)) {
    add("Sphere", "sphere", [0, 0.5, 0], [1, 1, 1], baseColor);
  }
  else if (/cylinder|pipe|tube/.test(lower)) {
    add("Cylinder", "cylinder", [0, 0.5, 0], [0.5, 1, 0.5], baseColor);
  }
  else if (/torus|donut|ring/.test(lower)) {
    add("Torus", "torus", [0, 0.5, 0], [1, 1, 1], baseColor, [Math.PI / 2, 0, 0]);
  }
  else if (/pyramid/.test(lower)) {
    add("Pyramid", "cone", [0, 0.5, 0], [1, 1, 1], baseColor);
  }
  // ─── TEMPLE ───
  else if (/temple|shrine|ancient|greek|roman/.test(lower)) {
    add("Base 1", "box", [0, 0.05, 0], [2, 0.1, 1.4], baseColor || "#d4c5a9");
    add("Base 2", "box", [0, 0.2, 0], [1.8, 0.1, 1.2], baseColor || "#d4c5a9");
    for (let i = 0; i < 5; i++) {
      const x = -0.7 + i * 0.35;
      add(`Column F${i + 1}`, "cylinder", [x, 0.85, 0.45], [0.08, 1.2, 0.08], "#e7e5e4");
      add(`Column B${i + 1}`, "cylinder", [x, 0.85, -0.45], [0.08, 1.2, 0.08], "#e7e5e4");
    }
    add("Roof", "box", [0, 1.5, 0], [1.9, 0.08, 1.3], "#d6d3d1");
    add("Pediment", "cone", [0, 1.8, 0], [1.2, 0.5, 0.8], "#d6d3d1");
  }
  // ─── BOAT ───
  else if (/boat|ship|yacht/.test(lower)) {
    add("Hull", "box", [0, 0.15, 0], [1.8, 0.3, 0.7], baseColor);
    add("Bow", "cone", [-1.1, 0.15, 0], [0.35, 0.4, 0.35], baseColor, [0, 0, -Math.PI / 2]);
    add("Cabin", "box", [0.2, 0.5, 0], [0.7, 0.4, 0.5], "#e2e8f0");
    add("Mast", "cylinder", [-0.2, 0.9, 0], [0.03, 1.2, 0.03], "#78716c");
    add("Sail", "cone", [-0.2, 1, 0.15], [0.5, 0.8, 0.02], "#fafafa");
  }
  // ─── TRUCK ───
  else if (/truck|lorry|pickup/.test(lower)) {
    add("Cab", "box", [-0.5, 0.5, 0], [0.8, 0.7, 0.9], baseColor);
    add("Bed", "box", [0.5, 0.3, 0], [1.2, 0.4, 0.95], "#475569");
    add("Bed Wall L", "box", [0.5, 0.55, 0.45], [1.2, 0.1, 0.05], "#475569");
    add("Bed Wall R", "box", [0.5, 0.55, -0.45], [1.2, 0.1, 0.05], "#475569");
    add("Wheel FL", "cylinder", [-0.5, 0.05, 0.5], [0.22, 0.14, 0.22], "#1e293b", [Math.PI / 2, 0, 0]);
    add("Wheel FR", "cylinder", [0.5, 0.05, 0.5], [0.22, 0.14, 0.22], "#1e293b", [Math.PI / 2, 0, 0]);
    add("Wheel RL", "cylinder", [-0.5, 0.05, -0.5], [0.22, 0.14, 0.22], "#1e293b", [Math.PI / 2, 0, 0]);
    add("Wheel RR", "cylinder", [0.5, 0.05, -0.5], [0.22, 0.14, 0.22], "#1e293b", [Math.PI / 2, 0, 0]);
  }
  // ─── FALLBACK ───
  else {
    add("Object", "dodecahedron", [0, 0.5, 0], [0.8, 0.8, 0.8], baseColor, [0.3, 0.5, 0], 0.5, 0.3);
    add("Base", "box", [0, 0.03, 0], [1, 0.06, 1], "#334155");
  }

  return objects;
}
