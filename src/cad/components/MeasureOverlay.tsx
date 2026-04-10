// src/cad/components/MeasureOverlay.tsx
"use client";

import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import type { MeasureResult } from "../engine/types";

function MeasureLine({ result }: { result: MeasureResult }) {
  const ref = useRef<THREE.BufferGeometry>(null);
  const [p1, p2] = result.points;

  useEffect(() => {
    if (!ref.current) return;
    const positions = new Float32Array([p1.x, p1.y, p1.z, p2.x, p2.y, p2.z]);
    ref.current.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  }, [p1, p2]);

  const midpoint = useMemo(
    () => new THREE.Vector3((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2),
    [p1, p2]
  );

  return (
    <group>
      <line>
        <bufferGeometry ref={ref} />
        <lineBasicMaterial color="#f59e0b" linewidth={2} />
      </line>
      {/* Endpoint markers */}
      <mesh position={[p1.x, p1.y, p1.z]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
      <mesh position={[p2.x, p2.y, p2.z]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
      {/* Label */}
      <Html position={midpoint} center>
        <div className="rounded bg-gray-900/90 px-2 py-1 text-xs font-mono text-amber-300 whitespace-nowrap">
          {result.value.toFixed(2)} {result.unit}
        </div>
      </Html>
    </group>
  );
}

export function MeasureOverlay({ results }: { results: MeasureResult[] }) {
  return (
    <group>
      {results.map((result, i) => (
        <MeasureLine key={i} result={result} />
      ))}
    </group>
  );
}
