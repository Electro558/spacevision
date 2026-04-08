// src/cad/components/TessellatedMesh.tsx

"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { TessellationResult } from "../engine/types";

interface TessellatedMeshProps {
  mesh: TessellationResult;
  viewMode: "shaded" | "wireframe" | "xray";
}

export function TessellatedMesh({ mesh, viewMode }: TessellatedMeshProps) {
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

  return (
    <group>
      {/* Solid mesh */}
      <mesh geometry={geometry}>
        {viewMode === "xray" ? (
          <meshPhysicalMaterial
            color="#6366f1"
            metalness={0.1}
            roughness={0.4}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        ) : (
          <meshStandardMaterial
            color="#a5b4fc"
            metalness={0.2}
            roughness={0.5}
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
