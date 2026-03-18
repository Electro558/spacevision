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
import { type SceneObject, buildGeometry } from "@/lib/cadStore";

/* ─── Selectable Mesh ─── */
function SceneMesh({
  obj,
  isSelected,
  wireframe,
  onSelect,
  onPositionChange,
  onRotationChange,
  onScaleChange,
}: {
  obj: SceneObject;
  isSelected: boolean;
  wireframe: boolean;
  onSelect: (id: string) => void;
  onPositionChange: (id: string, pos: [number, number, number]) => void;
  onRotationChange: (id: string, rot: [number, number, number]) => void;
  onScaleChange: (id: string, scl: [number, number, number]) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const geometry = useMemo(() => buildGeometry(obj.type), [obj.type]);

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
      <meshStandardMaterial
        color={obj.color}
        wireframe={wireframe}
        roughness={obj.roughness}
        metalness={obj.metalness}
        flatShading
        emissive={isSelected ? obj.color : "#000000"}
        emissiveIntensity={isSelected ? 0.08 : 0}
      />
      {/* Selection outline effect */}
      {isSelected && !wireframe && (
        <mesh scale={[1.02, 1.02, 1.02]}>
          <primitive object={geometry.clone()} attach="geometry" />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.3} />
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
}: {
  selectedObj: SceneObject;
  mode: "translate" | "rotate" | "scale";
  snapEnabled: boolean;
  snapValue: number;
  onUpdate: (pos: [number, number, number], rot: [number, number, number], scl: [number, number, number]) => void;
  orbitRef: React.RefObject<any>;
}) {
  const transformRef = useRef<any>(null);
  const objRef = useRef<THREE.Mesh>(null!);
  const geometry = useMemo(() => buildGeometry(selectedObj.type), [selectedObj.type]);

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
          flatShading
          emissive={selectedObj.color}
          emissiveIntensity={0.08}
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

/* ─── Main CAD Viewport ─── */
export default function CADViewport({
  objects,
  selectedId,
  transformMode,
  wireframe,
  snapEnabled,
  snapValue,
  gridVisible,
  onSelect,
  onDeselect,
  onTransformUpdate,
  onSceneReady,
  className = "",
}: {
  objects: SceneObject[];
  selectedId: string | null;
  transformMode: "translate" | "rotate" | "scale";
  wireframe: boolean;
  snapEnabled: boolean;
  snapValue: number;
  gridVisible: boolean;
  onSelect: (id: string) => void;
  onDeselect: () => void;
  onTransformUpdate: (id: string, pos: [number, number, number], rot: [number, number, number], scl: [number, number, number]) => void;
  onSceneReady?: (scene: THREE.Scene) => void;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const orbitRef = useRef<any>(null);
  useEffect(() => setMounted(true), []);

  const selectedObj = useMemo(
    () => objects.find((o) => o.id === selectedId) || null,
    [objects, selectedId]
  );

  const handleTransformUpdate = useCallback(
    (pos: [number, number, number], rot: [number, number, number], scl: [number, number, number]) => {
      if (selectedId) onTransformUpdate(selectedId, pos, rot, scl);
    },
    [selectedId, onTransformUpdate]
  );

  const handleScene = useCallback((scene: THREE.Scene) => {
    if (onSceneReady) onSceneReady(scene);
  }, [onSceneReady]);

  if (!mounted) return <div className={`bg-surface rounded-xl ${className}`} />;

  return (
    <div className={`canvas-container ${className}`}>
      <Canvas
        camera={{ position: [4, 3, 5], fov: 45 }}
        onPointerMissed={() => onDeselect()}
      >
        <ambientLight intensity={0.45} />
        <directionalLight position={[5, 8, 5]} intensity={1} color="#e0e7ff" castShadow />
        <directionalLight position={[-3, 4, -3]} intensity={0.3} color="#bfdbfe" />
        <hemisphereLight color="#e0e7ff" groundColor="#1b1f27" intensity={0.2} />

        {/* Render non-selected objects */}
        {objects.filter(o => o.id !== selectedId).map((obj) => (
          <SceneMesh
            key={obj.id}
            obj={obj}
            isSelected={false}
            wireframe={wireframe}
            onSelect={onSelect}
            onPositionChange={() => {}}
            onRotationChange={() => {}}
            onScaleChange={() => {}}
          />
        ))}

        {/* Selected object with transform controls */}
        {selectedObj && !selectedObj.locked && (
          <TransformGizmo
            key={selectedObj.id}
            selectedObj={selectedObj}
            mode={transformMode}
            snapEnabled={snapEnabled}
            snapValue={snapValue}
            onUpdate={handleTransformUpdate}
            orbitRef={orbitRef}
          />
        )}

        {/* Selected but locked — render without controls */}
        {selectedObj && selectedObj.locked && (
          <SceneMesh
            obj={selectedObj}
            isSelected={true}
            wireframe={wireframe}
            onSelect={onSelect}
            onPositionChange={() => {}}
            onRotationChange={() => {}}
            onScaleChange={() => {}}
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
      </Canvas>
    </div>
  );
}
