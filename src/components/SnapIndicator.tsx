"use client";

import { useMemo } from "react";
import * as THREE from "three";

interface SnapIndicatorProps {
  position: [number, number, number];
  normal: [number, number, number];
  visible: boolean;
}

export default function SnapIndicator({
  position,
  normal,
  visible,
}: SnapIndicatorProps) {
  const quaternion = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const n = new THREE.Vector3(...normal).normalize();
    return new THREE.Quaternion().setFromUnitVectors(up, n);
  }, [normal[0], normal[1], normal[2]]);

  if (!visible) return null;

  return (
    <group position={position} quaternion={quaternion}>
      {/* Static ring */}
      <mesh renderOrder={999}>
        <ringGeometry args={[0.18, 0.22, 32]} />
        <meshBasicMaterial
          color="#22d3ee"
          side={THREE.DoubleSide}
          transparent
          opacity={0.85}
          depthTest={false}
        />
      </mesh>

      {/* Center dot */}
      <mesh renderOrder={999}>
        <circleGeometry args={[0.04, 16]} />
        <meshBasicMaterial
          color="#22d3ee"
          side={THREE.DoubleSide}
          depthTest={false}
        />
      </mesh>
    </group>
  );
}
