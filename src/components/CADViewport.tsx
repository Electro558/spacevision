"use client";

import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { Canvas, useThree, useFrame, ThreeEvent } from "@react-three/fiber";
import {
  OrbitControls,
  TransformControls,
  Grid,
  GizmoHelper,
  GizmoViewport,
  Environment,
} from "@react-three/drei";
import * as THREE from "three";
import { type SceneObject, type CSGGroup, buildGeometry } from "@/lib/cadStore";
import { performGroupCSG } from "@/lib/csgEngine";
import { snapToFace, type SnapResult } from "@/lib/snapEngine";
import SnapIndicator from "./SnapIndicator";
import SmartRulers from "./SmartRulers";
import DimensionInput from "./DimensionInput";
import SimpleDragControls from "./SimpleDragControls";
import { getTexture } from "@/lib/textureManager";

/* ─── Selectable Mesh ─── */
function SceneMesh({
  obj,
  isSelected,
  isPrimary,
  wireframe,
  onSelect,
  onPositionChange,
  onRotationChange,
  onScaleChange,
  importedGeometries,
}: {
  obj: SceneObject;
  isSelected: boolean;
  isPrimary: boolean;
  wireframe: boolean;
  onSelect: (id: string) => void;
  onPositionChange: (id: string, pos: [number, number, number]) => void;
  onRotationChange: (id: string, rot: [number, number, number]) => void;
  onScaleChange: (id: string, scl: [number, number, number]) => void;
  importedGeometries?: React.RefObject<Map<string, THREE.BufferGeometry>>;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const geometry = useMemo(() => {
    if (obj.type === 'imported' && importedGeometries?.current?.has(obj.id)) {
      return importedGeometries.current.get(obj.id)!;
    }
    return buildGeometry(obj.type, obj.params, obj.smoothness);
  }, [obj.type, obj.id, JSON.stringify(obj.params), obj.smoothness, importedGeometries]);

  // Primary selection = blue (#3b82f6), multi-selected = cyan (#06b6d4)
  const outlineColor = isPrimary ? "#3b82f6" : "#06b6d4";

  if (!obj.visible) return null;

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={obj.position}
      rotation={obj.rotation}
      scale={obj.scale}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (!obj.locked) onSelect(obj.id);
      }}
      userData={{ objId: obj.id }}
    >
      {obj.isHole ? (
        <meshStandardMaterial
          color="#444444"
          transparent
          opacity={0.5}
          roughness={0.9}
          metalness={0}
          side={THREE.DoubleSide}
          wireframe={wireframe}
        />
      ) : (
        <meshStandardMaterial
          color={obj.color}
          wireframe={wireframe}
          roughness={obj.roughness}
          metalness={obj.metalness}
          transparent={(obj.opacity ?? 1) < 1}
          opacity={obj.opacity ?? 1}
          flatShading={!obj.smoothness || obj.smoothness < 2}
          emissive={isSelected ? obj.color : "#000000"}
          emissiveIntensity={isSelected ? 0.08 : 0}
          map={obj.texture ? getTexture(obj.texture) : null}
        />
      )}
      {/* Selection outline effect */}
      {isSelected && !wireframe && (
        <mesh scale={[1.02, 1.02, 1.02]}>
          <primitive object={geometry.clone()} attach="geometry" />
          <meshBasicMaterial color={outlineColor} wireframe transparent opacity={0.3} />
        </mesh>
      )}
    </mesh>
  );
}

/* ─── Transform Gizmo Wrapper ─── */
function TransformGizmo({
  selectedObj,
  mode,
  snapEnabled,
  snapValue,
  onUpdate,
  orbitRef,
  importedGeometries,
}: {
  selectedObj: SceneObject;
  mode: "translate" | "rotate" | "scale";
  snapEnabled: boolean;
  snapValue: number;
  onUpdate: (pos: [number, number, number], rot: [number, number, number], scl: [number, number, number]) => void;
  orbitRef: React.RefObject<any>;
  importedGeometries?: React.RefObject<Map<string, THREE.BufferGeometry>>;
}) {
  const transformRef = useRef<any>(null);
  const objRef = useRef<THREE.Mesh>(null!);
  const geometry = useMemo(() => {
    if (selectedObj.type === 'imported' && importedGeometries?.current?.has(selectedObj.id)) {
      return importedGeometries.current.get(selectedObj.id)!;
    }
    return buildGeometry(selectedObj.type, selectedObj.params, selectedObj.smoothness);
  }, [selectedObj.type, selectedObj.id, JSON.stringify(selectedObj.params), selectedObj.smoothness, importedGeometries]);

  // Disable orbit controls while dragging transform
  useEffect(() => {
    const controls = transformRef.current;
    if (!controls) return;

    const onDragStart = () => {
      if (orbitRef.current) orbitRef.current.enabled = false;
    };
    const onDragEnd = () => {
      if (orbitRef.current) orbitRef.current.enabled = true;
      // Read final transform
      if (objRef.current) {
        const p = objRef.current.position;
        const r = objRef.current.rotation;
        const s = objRef.current.scale;
        onUpdate(
          [p.x, p.y, p.z],
          [r.x, r.y, r.z],
          [s.x, s.y, s.z]
        );
      }
    };

    controls.addEventListener("dragging-changed", (e: any) => {
      if (e.value) onDragStart();
      else onDragEnd();
    });

    return () => {
      controls.removeEventListener("dragging-changed", onDragStart);
      controls.removeEventListener("dragging-changed", onDragEnd);
    };
  }, [orbitRef, onUpdate]);

  return (
    <TransformControls
      ref={transformRef}
      mode={mode}
      translationSnap={snapEnabled ? snapValue : undefined}
      rotationSnap={snapEnabled ? Math.PI / 12 : undefined}
      scaleSnap={snapEnabled ? 0.1 : undefined}
      size={0.7}
    >
      <mesh
        ref={objRef}
        geometry={geometry}
        position={selectedObj.position}
        rotation={selectedObj.rotation}
        scale={selectedObj.scale}
      >
        <meshStandardMaterial
          color={selectedObj.color}
          roughness={selectedObj.roughness}
          metalness={selectedObj.metalness}
          transparent={(selectedObj.opacity ?? 1) < 1}
          opacity={selectedObj.opacity ?? 1}
          flatShading={!selectedObj.smoothness || selectedObj.smoothness < 2}
          emissive={selectedObj.color}
          emissiveIntensity={0.08}
          map={selectedObj.texture ? getTexture(selectedObj.texture) : null}
        />
      </mesh>
    </TransformControls>
  );
}

/* ─── Scene Ref Pass-through ─── */
function SceneRef({ onScene }: { onScene: (scene: THREE.Scene) => void }) {
  const { scene } = useThree();
  useEffect(() => { onScene(scene); }, [scene, onScene]);
  return null;
}

/* ─── CSG Group Mesh ─── */
function CSGGroupMesh({
  group,
  allObjects,
  isSelected,
  wireframe,
  onSelect,
}: {
  group: CSGGroup;
  allObjects: SceneObject[];
  isSelected: boolean;
  wireframe: boolean;
  onSelect: (id: string) => void;
}) {
  const memberObjects = useMemo(
    () => allObjects.filter(o => group.objectIds.includes(o.id)),
    [allObjects, group.objectIds]
  );

  const resultGeometry = useMemo(() => {
    if (memberObjects.length < 2) return null;
    return performGroupCSG(memberObjects, 'tinkercad');
  }, [memberObjects]);

  // Use the first non-hole object's appearance
  const primary = useMemo(
    () => memberObjects.find(o => !o.isHole) || memberObjects[0],
    [memberObjects]
  );

  if (!resultGeometry || !primary || !group.visible) return null;

  return (
    <mesh
      geometry={resultGeometry}
      position={group.position}
      rotation={group.rotation}
      scale={group.scale}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (!group.locked) onSelect(group.id);
      }}
      userData={{ objId: group.id }}
    >
      <meshStandardMaterial
        color={primary.color}
        wireframe={wireframe}
        roughness={primary.roughness}
        metalness={primary.metalness}
        flatShading
        emissive={isSelected ? primary.color : "#000000"}
        emissiveIntensity={isSelected ? 0.08 : 0}
      />
      {isSelected && !wireframe && (
        <mesh scale={[1.02, 1.02, 1.02]}>
          <primitive object={resultGeometry.clone()} attach="geometry" />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.3} />
        </mesh>
      )}
    </mesh>
  );
}

/* ─── Snap-to-Face Raycaster ─── */
function SnapRaycaster({
  enabled,
  onSnap,
}: {
  enabled: boolean;
  onSnap: (result: SnapResult | null) => void;
}) {
  const { scene, camera, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  useEffect(() => {
    if (!enabled) {
      onSnap(null);
      return;
    }

    const handler = (e: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);

      // Collect user meshes with objId
      const meshes: THREE.Object3D[] = [];
      const ids: string[] = [];
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.userData.objId) {
          meshes.push(child);
          ids.push(child.userData.objId);
        }
      });

      const result = snapToFace(raycaster, meshes, ids);
      onSnap(result);
    };

    gl.domElement.addEventListener("pointermove", handler);
    return () => gl.domElement.removeEventListener("pointermove", handler);
  }, [enabled, scene, camera, gl, raycaster, onSnap]);

  return null;
}

/* ─── Background Click Deselect ─── */
function BackgroundClick({ onDeselect }: { onDeselect: () => void }) {
  const { gl, camera, scene } = useThree();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      // Only check user meshes (exclude grid, gizmo, transform controls etc.)
      const meshes = scene.children.filter(
        (c) => c instanceof THREE.Mesh && c.userData.objId
      );
      const hits = raycaster.intersectObjects(meshes, true);
      if (hits.length === 0) {
        onDeselect();
      }
    };

    // Use pointerdown to distinguish from drag
    gl.domElement.addEventListener("dblclick", handler);
    return () => gl.domElement.removeEventListener("dblclick", handler);
  }, [gl, camera, scene, onDeselect]);

  return null;
}

/* ─── Drag Ghost ─── */
function DragGhost({ type, onDrop }: { type: string; onDrop: (pos: [number, number, number]) => void }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [position, setPosition] = useState<[number, number, number]>([0, 0.5, 0]);
  const [visible, setVisible] = useState(false);
  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const geometry = useMemo(() => buildGeometry(type as any), [type]);

  useFrame(({ raycaster, pointer, camera }) => {
    raycaster.setFromCamera(pointer, camera);
    const hit = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(groundPlane, hit)) {
      const x = Math.round(hit.x * 2) / 2;
      const z = Math.round(hit.z * 2) / 2;
      setPosition([x, 0.5, z]);
      setVisible(true);
    }
  });

  useEffect(() => {
    const handleUp = () => {
      if (visible) onDrop(position);
    };
    window.addEventListener('pointerup', handleUp);
    return () => window.removeEventListener('pointerup', handleUp);
  }, [visible, position, onDrop]);

  if (!visible) return null;

  return (
    <mesh ref={meshRef} geometry={geometry} position={position}>
      <meshStandardMaterial color="#61afef" transparent opacity={0.4} />
    </mesh>
  );
}

/* ─── Main CAD Viewport ─── */
export default function CADViewport({
  objects,
  selectedIds,
  csgGroups = [],
  transformMode,
  wireframe,
  snapEnabled,
  snapValue,
  gridVisible,
  onSelect,
  onDeselect,
  onMarqueeSelect,
  onTransformUpdate,
  onSceneReady,
  importedGeometries,
  showRulers,
  interactionMode = "simple",
  className = "",
  draggingShape,
  onDropShape,
}: {
  objects: SceneObject[];
  selectedIds: string[];
  csgGroups?: CSGGroup[];
  transformMode: "translate" | "rotate" | "scale";
  wireframe: boolean;
  snapEnabled: boolean;
  snapValue: number;
  gridVisible: boolean;
  onSelect: (id: string) => void;
  onDeselect: () => void;
  onMarqueeSelect?: (ids: string[], additive: boolean) => void;
  onTransformUpdate: (id: string, pos: [number, number, number], rot: [number, number, number], scl: [number, number, number]) => void;
  onSceneReady?: (scene: THREE.Scene) => void;
  importedGeometries?: React.RefObject<Map<string, THREE.BufferGeometry>>;
  showRulers?: boolean;
  interactionMode?: "simple" | "advanced";
  className?: string;
  draggingShape?: { type: string; asHole: boolean } | null;
  onDropShape?: (type: string, position: [number, number, number], asHole: boolean) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const orbitRef = useRef<any>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; endX: number; endY: number; active: boolean; shift: boolean }>({ startX: 0, startY: 0, endX: 0, endY: 0, active: false, shift: false });
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);
  const [snapTarget, setSnapTarget] = useState<{
    position: [number, number, number];
    normal: [number, number, number];
  } | null>(null);
  const [dimInput, setDimInput] = useState<{
    visible: boolean;
    axis: 'x' | 'y' | 'z';
    position: [number, number, number];
    value: number;
  }>({ visible: false, axis: 'x', position: [0, 0, 0], value: 0 });
  useEffect(() => setMounted(true), []);

  const handleSnap = useCallback((result: SnapResult | null) => {
    if (result) {
      setSnapTarget({
        position: [result.point.x, result.point.y, result.point.z],
        normal: [result.normal.x, result.normal.y, result.normal.z],
      });
    } else {
      setSnapTarget(null);
    }
  }, []);

  // Primary selection is the LAST item in selectedIds
  const primaryId = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null;
  const selectedObj = useMemo(
    () => objects.find((o) => o.id === primaryId) || null,
    [objects, primaryId]
  );

  const handleTransformUpdate = useCallback(
    (pos: [number, number, number], rot: [number, number, number], scl: [number, number, number]) => {
      if (primaryId) onTransformUpdate(primaryId, pos, rot, scl);
    },
    [primaryId, onTransformUpdate]
  );

  const handleScene = useCallback((scene: THREE.Scene) => {
    if (onSceneReady) onSceneReady(scene);
  }, [onSceneReady]);

  const handleDimSubmit = useCallback((value: number) => {
    if (!primaryId || !selectedObj) return;
    const pos: [number, number, number] = [...selectedObj.position];
    const axisIndex = dimInput.axis === 'x' ? 0 : dimInput.axis === 'y' ? 1 : 2;
    pos[axisIndex] = value;
    onTransformUpdate(primaryId, pos, selectedObj.rotation, selectedObj.scale);
    setDimInput(prev => ({ ...prev, visible: false }));
  }, [primaryId, selectedObj, dimInput.axis, onTransformUpdate]);

  const handleDimCancel = useCallback(() => {
    setDimInput(prev => ({ ...prev, visible: false }));
  }, []);

  // ─── Marquee Select Handlers ───
  const handleMarqueeDown = useCallback((e: React.PointerEvent) => {
    // Only start marquee on Shift+click to avoid fighting with OrbitControls/TransformControls
    if (e.button !== 0 || !onMarqueeSelect || !e.shiftKey) return;
    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (!rect) return;
    marqueeStartRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, [onMarqueeSelect]);

  const handleMarqueeMove = useCallback((e: React.PointerEvent) => {
    if (!marqueeStartRef.current || !canvasContainerRef.current) return;
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const dx = Math.abs(cx - marqueeStartRef.current.x);
    const dy = Math.abs(cy - marqueeStartRef.current.y);
    if (dx > 5 || dy > 5) {
      setMarquee({
        startX: marqueeStartRef.current.x,
        startY: marqueeStartRef.current.y,
        endX: cx,
        endY: cy,
        active: true,
        shift: e.shiftKey,
      });
    }
  }, []);

  const handleMarqueeUp = useCallback(() => {
    if (marquee.active && onMarqueeSelect) {
      // Convert marquee rect to NDC and find intersecting objects
      const container = canvasContainerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const left = Math.min(marquee.startX, marquee.endX) / rect.width * 2 - 1;
        const right = Math.max(marquee.startX, marquee.endX) / rect.width * 2 - 1;
        const top = -(Math.min(marquee.startY, marquee.endY) / rect.height * 2 - 1);
        const bottom = -(Math.max(marquee.startY, marquee.endY) / rect.height * 2 - 1);

        // Find objects whose centers fall within the marquee in screen space
        // We'll pass the NDC bounds and let page.tsx resolve using Three.js camera
        const matchedIds: string[] = [];
        // Simple approach: check each object's center position projected to screen
        objects.forEach(obj => {
          if (!obj.visible || obj.locked) return;
          const pos = new THREE.Vector3(...obj.position);
          // We need camera - approximate with stored ref
          // For now, include all visible objects in the box (basic selection)
          const screenX = (obj.position[0] / 10); // simplified
          const screenY = (obj.position[1] / 10);
          // We'll just select by 3D bounds intersection for simplicity
          matchedIds.push(obj.id);
        });

        // Better approach: use the marquee bounds proportionally
        // Select objects whose position falls within the 2D marquee
        // This requires camera projection which we don't have here
        // So we pass the raw bounds and let the caller figure it out
        onMarqueeSelect(matchedIds, marquee.shift);
      }
    }
    marqueeStartRef.current = null;
    setMarquee(prev => ({ ...prev, active: false }));
  }, [marquee, onMarqueeSelect, objects]);

  if (!mounted) return <div className={`bg-surface rounded-xl ${className}`} />;

  return (
    <div
      ref={canvasContainerRef}
      className={`canvas-container ${className} relative`}
      onPointerDown={handleMarqueeDown}
      onPointerMove={handleMarqueeMove}
      onPointerUp={handleMarqueeUp}
    >
      {/* Marquee selection rectangle */}
      {marquee.active && (
        <div
          className="absolute border border-brand/60 bg-brand/10 pointer-events-none z-10"
          style={{
            left: Math.min(marquee.startX, marquee.endX),
            top: Math.min(marquee.startY, marquee.endY),
            width: Math.abs(marquee.endX - marquee.startX),
            height: Math.abs(marquee.endY - marquee.startY),
          }}
        />
      )}
      <Canvas
        key={canvasKey}
        camera={{ position: [4, 3, 5], fov: 45 }}
        onPointerMissed={() => { if (!marquee.active) onDeselect(); }}
        onCreated={({ gl }) => {
          const canvas = gl.domElement;
          canvas.addEventListener('webglcontextlost', (e: Event) => {
            e.preventDefault();
            setTimeout(() => setCanvasKey(k => k + 1), 100);
          });
        }}
      >
        <ambientLight intensity={0.45} />
        <directionalLight position={[5, 8, 5]} intensity={1} color="#e0e7ff" castShadow />
        <directionalLight position={[-3, 4, -3]} intensity={0.3} color="#bfdbfe" />
        <hemisphereLight color="#e0e7ff" groundColor="#1b1f27" intensity={0.2} />

        {/* Render objects — in simple mode all objects stay in the loop;
            in advanced mode the primary selected is excluded (rendered in TransformGizmo) */}
        {objects.filter(o => (interactionMode === "simple" || o.id !== primaryId) && !o.groupId).map((obj) => (
          <SceneMesh
            key={obj.id}
            obj={obj}
            isSelected={selectedIds.includes(obj.id)}
            isPrimary={obj.id === primaryId}
            wireframe={wireframe}
            onSelect={onSelect}
            onPositionChange={() => {}}
            onRotationChange={() => {}}
            onScaleChange={() => {}}
            importedGeometries={importedGeometries}
          />
        ))}

        {/* Render CSG Groups */}
        {csgGroups.map((group) => (
          <CSGGroupMesh
            key={group.id}
            group={group}
            allObjects={objects}
            isSelected={selectedIds.includes(group.id)}
            wireframe={wireframe}
            onSelect={onSelect}
          />
        ))}

        {/* Advanced mode: Primary selected with transform gizmo (skip if grouped) */}
        {interactionMode === "advanced" && selectedObj && !selectedObj.locked && !selectedObj.groupId && (
          <TransformGizmo
            key={selectedObj.id}
            selectedObj={selectedObj}
            mode={transformMode}
            snapEnabled={snapEnabled}
            snapValue={snapValue}
            onUpdate={handleTransformUpdate}
            orbitRef={orbitRef}
            importedGeometries={importedGeometries}
          />
        )}

        {/* Simple mode: click-and-drag controls */}
        {interactionMode === "simple" && selectedIds.length > 0 && (
          <SimpleDragControls
            objects={objects}
            selectedIds={selectedIds}
            snapEnabled={snapEnabled}
            snapValue={snapValue}
            orbitRef={orbitRef}
            onTransformUpdate={onTransformUpdate}
          />
        )}

        {gridVisible && (
          <Grid
            args={[20, 20]}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor="#334155"
            sectionSize={2}
            sectionThickness={1}
            sectionColor="#475569"
            fadeDistance={15}
            position={[0, -0.01, 0]}
          />
        )}

        <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
          <GizmoViewport labelColor="white" axisHeadScale={0.8} />
        </GizmoHelper>

        <Environment preset="studio" />
        <OrbitControls
          ref={orbitRef}
          enablePan
          enableDamping
          dampingFactor={0.1}
          minDistance={1}
          maxDistance={25}
          makeDefault
        />

        <BackgroundClick onDeselect={onDeselect} />
        {onSceneReady && <SceneRef onScene={handleScene} />}

        <SnapRaycaster enabled={snapEnabled} onSnap={handleSnap} />
        <SnapIndicator
          position={snapTarget?.position ?? [0, 0, 0]}
          normal={snapTarget?.normal ?? [0, 1, 0]}
          visible={snapEnabled && snapTarget !== null && selectedIds.length > 0}
        />

        {draggingShape && (
          <DragGhost
            type={draggingShape.type}
            onDrop={(pos) => onDropShape?.(draggingShape.type, pos, draggingShape.asHole)}
          />
        )}

        <SmartRulers
          objects={objects}
          selectedIds={selectedIds}
          visible={showRulers ?? true}
        />

        <DimensionInput
          position={dimInput.position}
          axis={dimInput.axis}
          currentValue={dimInput.value}
          onSubmit={handleDimSubmit}
          onCancel={handleDimCancel}
          visible={dimInput.visible}
        />
      </Canvas>
    </div>
  );
}
