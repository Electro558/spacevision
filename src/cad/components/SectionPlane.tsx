// src/cad/components/SectionPlane.tsx
"use client";

import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

interface SectionPlaneProps {
  plane: "XY" | "XZ" | "YZ";
  offset: number;
  visible: boolean;
}

export function SectionPlane({ plane, offset, visible }: SectionPlaneProps) {
  const { gl } = useThree();

  useEffect(() => {
    if (!visible) {
      gl.clippingPlanes = [];
      gl.localClippingEnabled = false;
      return;
    }

    let normal: THREE.Vector3;
    switch (plane) {
      case "XY": normal = new THREE.Vector3(0, 0, -1); break;
      case "XZ": normal = new THREE.Vector3(0, -1, 0); break;
      case "YZ": normal = new THREE.Vector3(-1, 0, 0); break;
    }

    const clipPlane = new THREE.Plane(normal, offset);
    gl.clippingPlanes = [clipPlane];
    gl.localClippingEnabled = true;

    return () => {
      gl.clippingPlanes = [];
      gl.localClippingEnabled = false;
    };
  }, [visible, plane, offset, gl]);

  if (!visible) return null;

  const rotation: [number, number, number] = useMemo(() => {
    switch (plane) {
      case "XY": return [0, 0, 0];
      case "XZ": return [-Math.PI / 2, 0, 0];
      case "YZ": return [0, Math.PI / 2, 0];
    }
  }, [plane]);

  const position: [number, number, number] = useMemo(() => {
    switch (plane) {
      case "XY": return [0, 0, offset];
      case "XZ": return [0, offset, 0];
      case "YZ": return [offset, 0, 0];
    }
  }, [plane, offset]);

  return (
    <mesh rotation={rotation} position={position}>
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial
        color="#ef4444"
        transparent
        opacity={0.05}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
