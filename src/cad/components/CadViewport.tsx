// src/cad/components/CadViewport.tsx

"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from "@react-three/drei";
import * as THREE from "three";
import { useCad } from "../context/CadContext";
import { useSketchMode } from "../hooks/useSketchMode";
import { TessellatedMesh } from "./TessellatedMesh";
import { SketchOverlay } from "./SketchOverlay";
import { MeasureOverlay } from "./MeasureOverlay";
import { SectionPlane } from "./SectionPlane";
import { ViewCubeOverlay, VIEW_CAMERA_POSITIONS } from "./ViewCube";
import type { ViewPreset, SketchFeature, SketchPlane, Sketch, MeasureResult } from "../engine/types";

/**
 * Converts a 3D intersection point to 2D sketch-plane coordinates.
 */
function worldToSketch2D(plane: SketchPlane, point: THREE.Vector3): { x: number; y: number } {
  switch (plane) {
    case "XY": return { x: point.x, y: point.y };
    case "XZ": return { x: point.x, y: point.z };
    case "YZ": return { x: point.y, y: point.z };
  }
}

/**
 * Returns the Three.js Plane for raycasting based on the sketch plane.
 */
function getSketchPlane3D(plane: SketchPlane): THREE.Plane {
  switch (plane) {
    case "XY": return new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    case "XZ": return new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    case "YZ": return new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
  }
}

/**
 * Invisible plane mesh for raycasting sketch clicks.
 * Only visible (to raycaster) when in sketch mode.
 */
function SketchPlaneHelper({
  plane,
  onSketchClick,
  onSketchMove,
}: {
  plane: SketchPlane;
  onSketchClick: (x: number, y: number) => void;
  onSketchMove: (x: number, y: number) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const sketchPlane = useMemo(() => getSketchPlane3D(plane), [plane]);
  const { camera, gl } = useThree();
  const intersectPoint = useMemo(() => new THREE.Vector3(), []);

  // Raycast against the infinite sketch plane
  const raycastToPlane = useCallback(
    (event: { clientX: number; clientY: number }): { x: number; y: number } | null => {
      const rect = gl.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(mouse, camera);
      const hit = raycaster.ray.intersectPlane(sketchPlane, intersectPoint);
      if (!hit) return null;
      return worldToSketch2D(plane, hit);
    },
    [camera, gl, raycaster, sketchPlane, intersectPoint, plane]
  );

  useEffect(() => {
    const canvas = gl.domElement;

    const handleClick = (e: MouseEvent) => {
      const pt = raycastToPlane(e);
      if (pt) onSketchClick(pt.x, pt.y);
    };

    const handleMove = (e: MouseEvent) => {
      const pt = raycastToPlane(e);
      if (pt) onSketchMove(pt.x, pt.y);
    };

    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mousemove", handleMove);
    return () => {
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mousemove", handleMove);
    };
  }, [gl, raycastToPlane, onSketchClick, onSketchMove]);

  return null; // No visible mesh needed — we raycast against math plane
}

function CadScene() {
  const cad = useCad();
  const controlsRef = useRef<any>(null);
  const { camera, gl, scene } = useThree();

  // Measure tool state
  const [measurePoints, setMeasurePoints] = useState<THREE.Vector3[]>([]);
  const [measureResults, setMeasureResults] = useState<MeasureResult[]>([]);
  const measureRaycaster = useMemo(() => new THREE.Raycaster(), []);

  // Section view state
  const [sectionConfig, setSectionConfig] = useState<{ visible: boolean; plane: "XY" | "XZ" | "YZ"; offset: number }>({
    visible: false, plane: "XY", offset: 5,
  });

  // Listen for section toggle event
  useEffect(() => {
    const handler = () => {
      setSectionConfig(prev => ({ ...prev, visible: !prev.visible }));
    };
    window.addEventListener("cad-toggle-section", handler);
    return () => window.removeEventListener("cad-toggle-section", handler);
  }, []);

  // Measure mode click handler
  useEffect(() => {
    if (cad.uiState.viewMode !== "measure") {
      setMeasurePoints([]);
      return;
    }
    const canvas = gl.domElement;

    const handleMeasureClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      measureRaycaster.setFromCamera(mouse, camera);

      const meshes: THREE.Object3D[] = [];
      scene.traverse(obj => { if ((obj as THREE.Mesh).isMesh) meshes.push(obj); });
      const intersects = measureRaycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const pt = intersects[0].point.clone();
        setMeasurePoints(prev => {
          if (prev.length >= 2) {
            // Reset — start new measurement
            return [pt];
          }
          const newPts = [...prev, pt];
          if (newPts.length === 2) {
            const [p1, p2] = newPts;
            const dist = p1.distanceTo(p2);
            setMeasureResults(prevResults => [
              ...prevResults,
              {
                type: "distance",
                value: dist,
                unit: "mm",
                points: [
                  { x: p1.x, y: p1.y, z: p1.z },
                  { x: p2.x, y: p2.y, z: p2.z },
                ],
              },
            ]);
          }
          return newPts;
        });
      }
    };

    canvas.addEventListener("click", handleMeasureClick);
    return () => canvas.removeEventListener("click", handleMeasureClick);
  }, [cad.uiState.viewMode, camera, gl, scene, measureRaycaster]);

  // Listen for view preset changes
  useEffect(() => {
    const handler = (e: Event) => {
      const preset = (e as CustomEvent).detail.preset as ViewPreset;
      const pos = VIEW_CAMERA_POSITIONS[preset];
      if (pos) {
        camera.position.set(pos[0], pos[1], pos[2]);
        camera.lookAt(0, 0, 0);
        controlsRef.current?.target.set(0, 0, 0);
        controlsRef.current?.update();
      }
    };
    window.addEventListener("cad-set-view", handler);
    return () => window.removeEventListener("cad-set-view", handler);
  }, [camera]);

  // Get active sketch for overlay rendering and sketch mode
  const activeSketchFeature = cad.uiState.activeSketchId
    ? cad.project.features.find(
        (f) => f.id === cad.uiState.activeSketchId && f.type === "sketch"
      ) as SketchFeature | undefined
    : undefined;

  const activeSketch = activeSketchFeature?.sketch ?? null;

  // Callback to update sketch entities in the feature tree
  const handleUpdateSketch = useCallback(
    (updatedSketch: Sketch) => {
      if (!activeSketchFeature) return;
      cad.updateFeature(activeSketchFeature.id, {
        sketch: updatedSketch,
      } as Partial<SketchFeature>);
    },
    [activeSketchFeature, cad]
  );

  // Wire up sketch mode interaction
  const sketchMode = useSketchMode(
    activeSketch,
    cad.uiState.activeTool,
    handleUpdateSketch
  );

  // Cancel sketch drawing on Escape (also handled by CadWorkspace, but this cancels the drawing state)
  // Delete/Backspace deletes selected sketch entities when in select mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sketchMode.isDrawing) {
        sketchMode.cancel();
      }
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        cad.uiState.sketchModeActive &&
        cad.uiState.activeTool === "select" &&
        sketchMode.selectedEntityIds.size > 0
      ) {
        e.preventDefault();
        e.stopPropagation();
        sketchMode.deleteSelectedEntities();
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [sketchMode, cad.uiState.sketchModeActive, cad.uiState.activeTool]);

  // Listen for delete-selected-entities custom event (from toolbar button)
  useEffect(() => {
    const handler = () => {
      sketchMode.deleteSelectedEntities();
    };
    window.addEventListener("cad-delete-selected-entities", handler);
    return () => window.removeEventListener("cad-delete-selected-entities", handler);
  }, [sketchMode]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />
      <directionalLight position={[-10, -5, -10]} intensity={0.3} />
      <hemisphereLight
        args={["#b1e1ff", "#b97a20", 0.3]}
      />

      {/* Grid */}
      {cad.uiState.gridVisible && (
        <Grid
          args={[200, 200]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#1a1a3e"
          sectionSize={10}
          sectionThickness={1}
          sectionColor="#2a2a4e"
          fadeDistance={100}
          infiniteGrid
        />
      )}

      {/* Origin axes */}
      <axesHelper args={[5]} />

      {/* Tessellated meshes from OCCT */}
      {cad.meshes.map((mesh, i) => (
        <TessellatedMesh
          key={`${mesh.featureId}-${i}`}
          mesh={mesh}
          viewMode={cad.uiState.viewMode}
        />
      ))}

      {/* Sketch overlay (when in sketch mode) */}
      {activeSketch && (
        <SketchOverlay
          sketch={activeSketch}
          previewPoints={sketchMode.currentPoints.length >= 1 ? sketchMode.currentPoints : undefined}
          activeTool={cad.uiState.activeTool}
        />
      )}

      {/* Sketch plane raycaster (only active in sketch mode) */}
      {cad.uiState.sketchModeActive && activeSketch && (
        <SketchPlaneHelper
          plane={activeSketch.plane}
          onSketchClick={sketchMode.handleClick}
          onSketchMove={sketchMode.handleMouseMove}
        />
      )}

      {/* Semi-transparent sketch plane indicator */}
      {cad.uiState.sketchModeActive && activeSketch && (
        <SketchPlaneIndicator plane={activeSketch.plane} />
      )}

      {/* Orbit controls — disable rotation during sketch drawing */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.1}
        minDistance={1}
        maxDistance={500}
        enableRotate={!cad.uiState.sketchModeActive}
      />

      {/* Measure overlay */}
      {measureResults.length > 0 && (
        <MeasureOverlay results={measureResults} />
      )}

      {/* Section plane */}
      <SectionPlane {...sectionConfig} />

      {/* View gizmo */}
      <GizmoHelper alignment="top-right" margin={[60, 60]}>
        <GizmoViewport labelColor="white" axisHeadScale={0.8} />
      </GizmoHelper>
    </>
  );
}

/**
 * Visual indicator showing which plane is active for sketching.
 */
function SketchPlaneIndicator({ plane }: { plane: SketchPlane }) {
  const rotation = useMemo(() => {
    switch (plane) {
      case "XY": return new THREE.Euler(0, 0, 0);
      case "XZ": return new THREE.Euler(-Math.PI / 2, 0, 0);
      case "YZ": return new THREE.Euler(0, Math.PI / 2, 0);
    }
  }, [plane]);

  return (
    <mesh rotation={rotation}>
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial
        color="#6366f1"
        transparent
        opacity={0.03}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

export function CadViewport() {
  const cad = useCad();

  const handleSetView = useCallback((preset: ViewPreset) => {
    window.dispatchEvent(
      new CustomEvent("cad-set-view", { detail: { preset } })
    );
  }, []);

  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{
          position: [30, 30, 30],
          fov: 45,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color("#0d0d1a"), 1);
        }}
      >
        <CadScene />
      </Canvas>

      {/* View preset buttons overlay */}
      <ViewCubeOverlay onSetView={handleSetView} />

      {/* Sketch mode indicator */}
      {cad.uiState.sketchModeActive && (
        <div className="absolute left-1/2 top-2 -translate-x-1/2 rounded bg-amber-900/80 px-3 py-1 text-xs text-amber-200">
          Sketch Mode — Click to draw, Escape to cancel
        </div>
      )}

      {/* Rebuilding indicator */}
      {cad.isRebuilding && (
        <div className="absolute left-1/2 top-10 -translate-x-1/2 rounded bg-indigo-900/80 px-3 py-1 text-xs text-indigo-200">
          Rebuilding geometry...
        </div>
      )}
    </div>
  );
}
