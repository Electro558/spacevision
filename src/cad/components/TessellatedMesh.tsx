// src/cad/components/TessellatedMesh.tsx

"use client";

import { useMemo, useEffect } from "react";
import * as THREE from "three";
import type { TessellationResult, MaterialConfig } from "../engine/types";
import { DEFAULT_MATERIAL } from "../engine/materials";

interface TessellatedMeshProps {
  mesh: TessellationResult;
  viewMode: "shaded" | "wireframe" | "xray" | "measure";
  material?: MaterialConfig;
}

export function TessellatedMesh({ mesh, viewMode, material }: TessellatedMeshProps) {
  const mat = material ?? DEFAULT_MATERIAL;
  const isTransparent = mat.opacity < 1;
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(mesh.vertices, 3)
    );
    geo.setAttribute(
      "normal",
      new THREE.BufferAttribute(mesh.normals, 3)
    );
    geo.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
    return geo;
  }, [mesh]);

  // Dispose GPU resources on unmount or when geometry changes
  useEffect(() => {
    return () => { geometry.dispose(); };
  }, [geometry]);

  return (
    <group>
      {/* Solid mesh */}
      <mesh geometry={geometry}>
        {viewMode === "xray" ? (
          <meshPhysicalMaterial
            color={mat.color}
            metalness={0.1}
            roughness={0.4}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        ) : (
          <meshStandardMaterial
            color={mat.color}
            metalness={mat.metalness}
            roughness={mat.roughness}
            opacity={mat.opacity}
            transparent={isTransparent}
            depthWrite={!isTransparent}
            wireframe={viewMode === "wireframe"}
            side={THREE.DoubleSide}
          />
        )}
      </mesh>

      {/* Edge lines for shaded + xray modes */}
      {viewMode !== "wireframe" && (
        <lineSegments>
          <edgesGeometry args={[geometry, 15]} />
          <lineBasicMaterial color="#1e1b4b" opacity={0.3} transparent />
        </lineSegments>
      )}
    </group>
  );
}
