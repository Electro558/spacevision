/* ─── CAD Scene State Management ─── */

import * as THREE from "three";

export interface ShapeParams {
  // Box
  widthSegments?: number;
  heightSegments?: number;
  depthSegments?: number;
  // Sphere
  radius?: number;
  widthSegs?: number;
  heightSegs?: number;
  phiLength?: number;
  thetaLength?: number;
  // Cylinder
  radiusTop?: number;
  radiusBottom?: number;
  height?: number;
  radialSegments?: number;
  openEnded?: boolean;
  thetaStart?: number;
  thetaArc?: number;
  // Cone
  coneRadius?: number;
  coneHeight?: number;
  coneSegments?: number;
  // Torus
  torusRadius?: number;
  tubeRadius?: number;
  torusRadialSegments?: number;
  torusTubularSegments?: number;
  torusArc?: number;
  // Wedge
  wedgeWidth?: number;
  wedgeHeight?: number;
  wedgeDepth?: number;
  // Tube
  tubeOuterRadius?: number;
  tubeInnerRadius?: number;
  tubeHeight?: number;
  // Star
  starPoints?: number;
  starOuterRadius?: number;
  starInnerRadius?: number;
  starDepth?: number;
}

export interface SceneObject {
  id: string;
  name: string;
  type: "box" | "sphere" | "cylinder" | "cone" | "torus" | "torusKnot" | "dodecahedron" | "octahedron" | "plane" | "capsule" | "imported" | "wedge" | "tube" | "star";
  importedGeometry?: any; // THREE.BufferGeometry serialized data for imported meshes
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  metalness: number;
  roughness: number;
  opacity?: number;
  visible: boolean;
  locked: boolean;
  isHole: boolean;
  groupId: string | null;
  params: ShapeParams;
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

const PALETTE = [
  "#6b8caf", "#e06c75", "#98c379", "#e5c07b", "#61afef",
  "#c678dd", "#56b6c2", "#d19a66", "#be5046", "#7ec8e3",
  "#f5a623", "#50c878", "#ff6b6b", "#4ecdc4", "#45b7d1",
];

export function randomColor(): string {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)];
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
    imported: "Imported Model",
    wedge: "Wedge",
    tube: "Tube",
    star: "Star",
  };

  // Count existing objects of same type for naming
  return {
    id: newId(),
    name: names[type] || "Object",
    type,
    position: [0, 0.5, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    color: randomColor(),
    metalness: 0.3,
    roughness: 0.5,
    opacity: 1,
    visible: true,
    locked: false,
    isHole: false,
    groupId: null,
    params: {},
    ...overrides,
  };
}

export function duplicateObject(obj: SceneObject): SceneObject {
  const offsetX = Math.max(obj.scale[0], 0.5) * 1.2;
  return {
    ...obj,
    id: newId(),
    name: `${obj.name} Copy`,
    position: [obj.position[0] + offsetX, obj.position[1], obj.position[2]],
  };
}

/* Build geometry from type */
export function buildGeometry(type: SceneObject["type"], params: ShapeParams = {}): THREE.BufferGeometry {
  switch (type) {
    case "box": return new THREE.BoxGeometry(1, 1, 1, params.widthSegments || 1, params.heightSegments || 1, params.depthSegments || 1);
    case "sphere": return new THREE.SphereGeometry(params.radius || 0.5, params.widthSegs || 32, params.heightSegs || 32, 0, params.phiLength || Math.PI * 2, 0, params.thetaLength || Math.PI);
    case "cylinder": return new THREE.CylinderGeometry(params.radiusTop ?? 0.5, params.radiusBottom ?? 0.5, params.height || 1, params.radialSegments || 32, 1, params.openEnded || false, params.thetaStart || 0, params.thetaArc || Math.PI * 2);
    case "cone": return new THREE.ConeGeometry(params.coneRadius || 0.5, params.coneHeight || 1, params.coneSegments || 32, 1, false, 0, params.thetaArc || Math.PI * 2);
    case "torus": return new THREE.TorusGeometry(params.torusRadius || 0.4, params.tubeRadius || 0.15, params.torusRadialSegments || 16, params.torusTubularSegments || 48, params.torusArc || Math.PI * 2);
    case "torusKnot": return new THREE.TorusKnotGeometry(0.4, 0.12, 128, 32);
    case "dodecahedron": return new THREE.DodecahedronGeometry(0.5, 0);
    case "octahedron": return new THREE.OctahedronGeometry(0.5, 0);
    case "plane": return new THREE.PlaneGeometry(1, 1);
    case "capsule": return new THREE.CapsuleGeometry(0.3, 0.5, 8, 16);
    case "imported": return new THREE.BoxGeometry(1, 1, 1); // Placeholder; actual geometry handled in viewport
    case "wedge": {
      const w = params.wedgeWidth || 1;
      const h = params.wedgeHeight || 1;
      const d = params.wedgeDepth || 1;
      const shape = new THREE.Shape();
      shape.moveTo(-w / 2, -h / 2);
      shape.lineTo(w / 2, -h / 2);
      shape.lineTo(-w / 2, h / 2);
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
      geo.translate(0, 0, -d / 2); // Center along Z
      return geo;
    }
    case "tube": {
      const outer = params.tubeOuterRadius || 0.5;
      const inner = params.tubeInnerRadius || 0.35;
      const h = params.tubeHeight || 1;
      const points = [
        new THREE.Vector2(inner, -h / 2),
        new THREE.Vector2(outer, -h / 2),
        new THREE.Vector2(outer, h / 2),
        new THREE.Vector2(inner, h / 2),
      ];
      return new THREE.LatheGeometry(points, 32);
    }
    case "star": {
      const pts = params.starPoints || 5;
      const outerR = params.starOuterRadius || 0.5;
      const innerR = params.starInnerRadius || 0.25;
      const depth = params.starDepth || 0.3;
      const shape = new THREE.Shape();
      for (let i = 0; i < pts * 2; i++) {
        const angle = (i * Math.PI) / pts - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.closePath();
      return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    }
    default: return new THREE.BoxGeometry(1, 1, 1);
  }
}

export function serializeScene(objects: SceneObject[]): string {
  if (objects.length === 0) return '(empty scene)';
  return objects.map(obj => {
    let line = `- "${obj.name}" (${obj.type}): pos=[${obj.position}], rot=[${obj.rotation}], scale=[${obj.scale}], color=${obj.color}, metal=${obj.metalness}, rough=${obj.roughness}`;
    if (!obj.visible) line += ', HIDDEN';
    if (obj.locked) line += ', LOCKED';
    if (obj.isHole) line += ', HOLE';
    if (obj.type === 'imported') line += ', IMPORTED_MESH';
    if (obj.opacity != null && obj.opacity < 1) line += `, opacity=${obj.opacity}`;
    return line;
  }).join('\n');
}

/* generateFromPrompt has been removed — replaced by Claude AI streaming tool-use.
   See src/app/api/generate/route.ts for the new implementation. */
