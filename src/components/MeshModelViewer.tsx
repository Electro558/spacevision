"use client";

import { useRef, useEffect, useState, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";

export type ViewMode = "colored" | "wireframe" | "solid";

interface MeshModelViewerProps {
  /** URL to fetch the GLB from (can be a proxy endpoint or blob URL) */
  src: string;
  className?: string;
  viewMode?: ViewMode;
}

/* ── Inner component that loads and displays the GLB ── */
function GLBModel({ src, viewMode }: { src: string; viewMode: ViewMode }) {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const [error, setError] = useState<string | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Load the GLB
  useEffect(() => {
    let cancelled = false;
    setScene(null);
    setError(null);

    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        if (cancelled) return;
        const loader = new GLTFLoader();
        return new Promise<THREE.Group>((resolve, reject) => {
          loader.parse(buffer, "", (gltf) => resolve(gltf.scene), reject);
        });
      })
      .then((loadedScene) => {
        if (cancelled || !loadedScene) return;

        // Center and scale the model
        const box = new THREE.Box3().setFromObject(loadedScene);
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(size);

        // Center it
        loadedScene.position.sub(center);

        // Scale to fit nicely in view (target ~3 units)
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const scale = 3 / maxDim;
          loadedScene.scale.setScalar(scale);
        }

        // Recompute after scaling
        const newBox = new THREE.Box3().setFromObject(loadedScene);
        const newCenter = new THREE.Vector3();
        newBox.getCenter(newCenter);
        loadedScene.position.y -= newCenter.y;

        setScene(loadedScene);

        // Position camera to frame the model
        if (camera instanceof THREE.PerspectiveCamera) {
          camera.position.set(3, 2.5, 4);
          camera.lookAt(0, 0, 0);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("GLB load error:", err);
        setError(err.message || "Failed to load model");
      });

    return () => {
      cancelled = true;
    };
  }, [src, camera]);

  // Apply view mode
  useEffect(() => {
    if (!scene) return;

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material;
        if (!mat) return;

        // Handle both single and array materials
        const materials = Array.isArray(mat) ? mat : [mat];
        for (const m of materials) {
          if (m instanceof THREE.MeshStandardMaterial || m instanceof THREE.MeshPhysicalMaterial) {
            if (viewMode === "wireframe") {
              m.wireframe = true;
              m.color.set(0x888888);
              if (m.map) m.map = null;
              m.needsUpdate = true;
            } else if (viewMode === "solid") {
              m.wireframe = false;
              m.color.set(0x999999);
              if (m.map) m.map = null;
              m.metalness = 0.1;
              m.roughness = 0.6;
              m.needsUpdate = true;
            }
            // "colored" is the default loaded state — handled by re-loading
          }
        }
      }
    });
  }, [scene, viewMode]);

  // Gentle auto-rotate
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  if (error) {
    return null; // Error handled by parent
  }

  if (!scene) {
    return null; // Loading handled by parent
  }

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

/* ── Main viewer component ── */
export default function MeshModelViewer({
  src,
  className = "",
  viewMode = "colored",
}: MeshModelViewerProps) {
  // Force re-mount when viewMode goes back to "colored" (to restore original materials)
  const [mountKey, setMountKey] = useState(0);
  const prevViewMode = useRef(viewMode);

  useEffect(() => {
    // When switching back to colored, re-mount to get fresh materials
    if (viewMode === "colored" && prevViewMode.current !== "colored") {
      setMountKey((k) => k + 1);
    }
    prevViewMode.current = viewMode;
  }, [viewMode]);

  return (
    <div className={`relative ${className}`}>
      <Canvas
        key={`canvas-${mountKey}`}
        camera={{ position: [3, 2.5, 4], fov: 45, near: 0.01, far: 100 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        dpr={[1, 2]}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.0} castShadow />
        <directionalLight position={[-3, 4, -3]} intensity={0.4} />
        <pointLight position={[0, 5, 0]} intensity={0.3} />

        <Environment preset="studio" />

        <Suspense fallback={null}>
          <GLBModel src={src} viewMode={viewMode} />
        </Suspense>

        <OrbitControls
          enableDamping
          dampingFactor={0.1}
          minDistance={1}
          maxDistance={20}
          enablePan
          target={[0, 0, 0]}
        />

        {/* Ground shadow */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.15} />
        </mesh>
      </Canvas>
    </div>
  );
}
