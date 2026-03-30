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
  // Rounded Box
  cornerRadius?: number;
  rbWidth?: number;
  rbHeight?: number;
  rbDepth?: number;
  // Text3D
  textContent?: string;
  fontSize?: number;
  extrudeDepth?: number;
  bevelEnabled?: boolean;
  bevelSize?: number;
  // Half Sphere
  halfSphereRadius?: number;
  // Pyramid
  pyramidHeight?: number;
  pyramidBase?: number;
  // Heart
  heartSize?: number;
  heartDepth?: number;
  // Spring
  springCoils?: number;
  springRadius?: number;
  wireRadius?: number;
  // Screw
  screwLength?: number;
  screwRadius?: number;
  threadPitch?: number;
  // Roof
  roofWidth?: number;
  roofHeight?: number;
  roofDepth?: number;
  // Arrow
  arrowLength?: number;
  arrowHeadSize?: number;
  arrowDepth?: number;
  // Ring
  ringRadius?: number;
  ringThickness?: number;
}

export interface SceneObject {
  id: string;
  name: string;
  type: "box" | "sphere" | "cylinder" | "cone" | "torus" | "torusKnot" | "dodecahedron" | "octahedron" | "plane" | "capsule" | "imported" | "wedge" | "tube" | "star" | "roundedBox" | "text3d" | "halfSphere" | "pyramid" | "heart" | "spring" | "screw" | "roof" | "arrow" | "ring";
  importedGeometry?: any; // THREE.BufferGeometry serialized data for imported meshes
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  metalness: number;
  roughness: number;
  opacity?: number;
  materialPreset?: string;  // "wood", "metal", "glass", etc.
  texture?: string;         // texture key or "none"
  smoothness?: number;      // 0-3 (Low, Medium, High, Ultra)
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
    roundedBox: "Rounded Box",
    text3d: "Text",
    halfSphere: "Half Sphere",
    pyramid: "Pyramid",
    heart: "Heart",
    spring: "Spring",
    screw: "Screw",
    roof: "Roof",
    arrow: "Arrow",
    ring: "Ring",
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

/* Smoothness level → segment count */
const SMOOTHNESS_SEGMENTS = [8, 32, 64, 128];

function smoothSegs(smoothness: number | undefined, explicit: number | undefined, fallback: number): number {
  if (explicit !== undefined) return explicit;
  if (smoothness !== undefined && smoothness >= 0 && smoothness <= 3) return SMOOTHNESS_SEGMENTS[smoothness];
  return fallback;
}

/* Build geometry from type */
export function buildGeometry(type: SceneObject["type"], params: ShapeParams = {}, smoothness?: number): THREE.BufferGeometry {
  const ss = (explicit: number | undefined, fallback: number) => smoothSegs(smoothness, explicit, fallback);

  switch (type) {
    case "box": return new THREE.BoxGeometry(1, 1, 1, params.widthSegments || 1, params.heightSegments || 1, params.depthSegments || 1);
    case "sphere": return new THREE.SphereGeometry(params.radius || 0.5, ss(params.widthSegs, 32), ss(params.heightSegs, 32), 0, params.phiLength || Math.PI * 2, 0, params.thetaLength || Math.PI);
    case "cylinder": return new THREE.CylinderGeometry(params.radiusTop ?? 0.5, params.radiusBottom ?? 0.5, params.height || 1, ss(params.radialSegments, 32), 1, params.openEnded || false, params.thetaStart || 0, params.thetaArc || Math.PI * 2);
    case "cone": return new THREE.ConeGeometry(params.coneRadius || 0.5, params.coneHeight || 1, ss(params.coneSegments, 32), 1, false, 0, params.thetaArc || Math.PI * 2);
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
    case "roundedBox": {
      const w = params.rbWidth || 1;
      const h = params.rbHeight || 1;
      const d = params.rbDepth || 1;
      const r = Math.min(params.cornerRadius || 0.1, Math.min(w, h) / 2 - 0.01);
      const shape = new THREE.Shape();
      shape.moveTo(-w / 2 + r, -h / 2);
      shape.lineTo(w / 2 - r, -h / 2);
      shape.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false);
      shape.lineTo(w / 2, h / 2 - r);
      shape.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2, false);
      shape.lineTo(-w / 2 + r, h / 2);
      shape.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI, false);
      shape.lineTo(-w / 2, -h / 2 + r);
      shape.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5, false);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
      geo.translate(0, 0, -d / 2);
      return geo;
    }
    case "text3d": {
      const { getFont } = require('@/lib/fontManager');
      const font = getFont();
      if (!font) {
        return new THREE.BoxGeometry(1, 0.3, 0.1);
      }
      const { TextGeometry } = require('three-stdlib');
      const text = params.textContent || 'Text';
      const geo = new TextGeometry(text, {
        font,
        size: params.fontSize || 0.5,
        depth: params.extrudeDepth || 0.2,
        bevelEnabled: params.bevelEnabled ?? false,
        bevelSize: params.bevelSize || 0.02,
        bevelThickness: 0.01,
        curveSegments: 12,
      });
      geo.computeBoundingBox();
      if (geo.boundingBox) {
        const cx = -(geo.boundingBox.max.x + geo.boundingBox.min.x) / 2;
        const cy = -(geo.boundingBox.max.y + geo.boundingBox.min.y) / 2;
        const cz = -(geo.boundingBox.max.z + geo.boundingBox.min.z) / 2;
        geo.translate(cx, cy, cz);
      }
      return geo;
    }
    case "halfSphere": {
      return new THREE.SphereGeometry(
        params.halfSphereRadius || 0.5,
        params.widthSegs || 32,
        params.heightSegs || 16,
        0, Math.PI * 2,
        0, Math.PI / 2
      );
    }
    case "pyramid": {
      return new THREE.ConeGeometry(
        params.pyramidBase || 0.5,
        params.pyramidHeight || 1,
        4, 1, false, Math.PI / 4
      );
    }
    case "heart": {
      const s = params.heartSize || 0.5;
      const shape = new THREE.Shape();
      shape.moveTo(0, s * 0.4);
      shape.bezierCurveTo(0, s * 0.7, -s, s * 0.9, -s, s * 0.4);
      shape.bezierCurveTo(-s, -s * 0.2, 0, -s * 0.5, 0, -s * 0.8);
      shape.bezierCurveTo(0, -s * 0.5, s, -s * 0.2, s, s * 0.4);
      shape.bezierCurveTo(s, s * 0.9, 0, s * 0.7, 0, s * 0.4);
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: params.heartDepth || 0.3,
        bevelEnabled: false,
      });
      geo.translate(0, 0, -(params.heartDepth || 0.3) / 2);
      return geo;
    }
    case "spring": {
      const coils = params.springCoils || 5;
      const sRadius = params.springRadius || 0.4;
      const wRadius = params.wireRadius || 0.05;
      class HelixCurve extends THREE.Curve<THREE.Vector3> {
        constructor() { super(); }
        getPoint(t: number): THREE.Vector3 {
          const angle = t * Math.PI * 2 * coils;
          return new THREE.Vector3(
            Math.cos(angle) * sRadius,
            t * coils * wRadius * 8,
            Math.sin(angle) * sRadius
          );
        }
      }
      return new THREE.TubeGeometry(new HelixCurve(), coils * 32, wRadius, 8, false);
    }
    case "screw": {
      const len = params.screwLength || 1;
      const sRad = params.screwRadius || 0.1;
      const pitch = params.threadPitch || 0.15;
      const steps = Math.floor(len / pitch);
      const points: THREE.Vector2[] = [];
      for (let i = 0; i <= steps * 8; i++) {
        const t = i / (steps * 8);
        const y = t * len - len / 2;
        const phase = (t * steps * Math.PI * 2) % (Math.PI * 2);
        const threadR = sRad + Math.max(0, Math.sin(phase)) * sRad * 0.4;
        points.push(new THREE.Vector2(threadR, y));
      }
      return new THREE.LatheGeometry(points, 24);
    }
    case "roof": {
      const rw = params.roofWidth || 1;
      const rh = params.roofHeight || 0.7;
      const rd = params.roofDepth || 1;
      const shape = new THREE.Shape();
      shape.moveTo(-rw / 2, 0);
      shape.lineTo(rw / 2, 0);
      shape.lineTo(0, rh);
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth: rd, bevelEnabled: false });
      geo.translate(0, 0, -rd / 2);
      return geo;
    }
    case "arrow": {
      const aLen = params.arrowLength || 1;
      const headSize = params.arrowHeadSize || 0.3;
      const depth = params.arrowDepth || 0.15;
      const shaftW = headSize * 0.4;
      const shaftLen = aLen - headSize;
      const shape = new THREE.Shape();
      shape.moveTo(-shaftW / 2, -aLen / 2);
      shape.lineTo(shaftW / 2, -aLen / 2);
      shape.lineTo(shaftW / 2, -aLen / 2 + shaftLen);
      shape.lineTo(headSize / 2, -aLen / 2 + shaftLen);
      shape.lineTo(0, aLen / 2);
      shape.lineTo(-headSize / 2, -aLen / 2 + shaftLen);
      shape.lineTo(-shaftW / 2, -aLen / 2 + shaftLen);
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
      geo.translate(0, 0, -depth / 2);
      return geo;
    }
    case "ring": {
      const ringR = params.ringRadius || 0.4;
      const ringT = params.ringThickness || 0.06;
      return new THREE.TorusGeometry(ringR, ringT, 16, 48);
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
