// src/cad/components/CadViewport.tsx

"use client";

import { useRef, useCallback, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from "@react-three/drei";
import * as THREE from "three";
import { useCad } from "../context/CadContext";
import { TessellatedMesh } from "./TessellatedMesh";
import { SketchOverlay } from "./SketchOverlay";
import { ViewCubeOverlay, VIEW_CAMERA_POSITIONS } from "./ViewCube";
import type { ViewPreset, SketchFeature } from "../engine/types";

function CadScene() {
  const cad = useCad();
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

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

  // Get active sketch for overlay rendering
  const activeSketch = cad.uiState.activeSketchId
    ? cad.project.features.find(
        (f) => f.id === cad.uiState.activeSketchId && f.type === "sketch"
      ) as SketchFeature | undefined
    : undefined;

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

      {/* Origin planes (subtle) */}
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
        <SketchOverlay sketch={activeSketch.sketch} />
      )}

      {/* Orbit controls */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.1}
        minDistance={1}
        maxDistance={500}
      />

      {/* View gizmo */}
      <GizmoHelper alignment="top-right" margin={[60, 60]}>
        <GizmoViewport labelColor="white" axisHeadScale={0.8} />
      </GizmoHelper>
    </>
  );
}

export function CadViewport() {
  const cad = useCad();

  const handleSetView = useCallback((preset: ViewPreset) => {
    // NOTE: Direct camera manipulation requires accessing the R3F camera ref.
    // This will be passed down from CadScene. For now, we dispatch a custom event
    // that CadScene listens for.
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

      {/* Rebuilding indicator */}
      {cad.isRebuilding && (
        <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded bg-indigo-900/80 px-3 py-1 text-xs text-indigo-200">
          Rebuilding geometry...
        </div>
      )}
    </div>
  );
}
