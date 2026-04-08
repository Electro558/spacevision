"use client";

import { useRef, useEffect, useState, useCallback, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import { Loader2, AlertTriangle, RotateCcw } from "lucide-react";

export type ViewMode = "colored" | "wireframe" | "solid";

interface MeshModelViewerProps {
  src: string;
  className?: string;
  viewMode?: ViewMode;
}

/* ── Inner component that loads and displays the GLB ── */
function GLBModel({
  src,
  viewMode,
  onLoaded,
  onError,
}: {
  src: string;
  viewMode: ViewMode;
  onLoaded: () => void;
  onError: (msg: string) => void;
}) {
  const [scene, setScene] = useState<THREE.Group | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  // Store callbacks in refs so they don't trigger re-fetches
  const onLoadedRef = useRef(onLoaded);
  const onErrorRef = useRef(onError);
  onLoadedRef.current = onLoaded;
  onErrorRef.current = onError;

  // Load the GLB
  useEffect(() => {
    let cancelled = false;
    setScene(null);

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

        loadedScene.position.sub(center);

        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const scale = 3 / maxDim;
          loadedScene.scale.setScalar(scale);
        }

        // Re-center after scaling
        const newBox = new THREE.Box3().setFromObject(loadedScene);
        const newCenter = new THREE.Vector3();
        newBox.getCenter(newCenter);
        loadedScene.position.y -= newCenter.y;

        setScene(loadedScene);
        onLoadedRef.current();

        // Position camera
        if (camera instanceof THREE.PerspectiveCamera) {
          camera.position.set(3, 2.5, 4);
          camera.lookAt(0, 0, 0);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("GLB load error:", err);
        onErrorRef.current(err.message || "Failed to load model");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, camera]);

  // Apply view mode
  useEffect(() => {
    if (!scene) return;

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material;
        if (!mat) return;

        const materials = Array.isArray(mat) ? mat : [mat];
        for (const m of materials) {
          if (
            m instanceof THREE.MeshStandardMaterial ||
            m instanceof THREE.MeshPhysicalMaterial
          ) {
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

  if (!scene) return null;

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
  const [mountKey, setMountKey] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [errorMsg, setErrorMsg] = useState("");
  const prevViewMode = useRef(viewMode);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Force re-mount when viewMode goes back to "colored" (restores original materials)
  useEffect(() => {
    if (viewMode === "colored" && prevViewMode.current !== "colored") {
      setMountKey((k) => k + 1);
      setStatus("loading");
    }
    prevViewMode.current = viewMode;
  }, [viewMode]);

  // Reset status when src or mountKey changes
  useEffect(() => {
    setStatus("loading");
    setErrorMsg("");
  }, [src, mountKey]);

  const handleLoaded = useCallback(() => setStatus("ready"), []);
  const handleError = useCallback((msg: string) => {
    setStatus("error");
    setErrorMsg(msg);
  }, []);

  const handleRetry = useCallback(() => {
    setMountKey((k) => k + 1);
    setStatus("loading");
    setErrorMsg("");
  }, []);

  // Detect WebGL context loss on the canvas element
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onContextLost = (e: Event) => {
      e.preventDefault();
      console.warn("WebGL context lost — will auto-retry");
      // Auto-retry after a brief delay
      setTimeout(() => {
        setMountKey((k) => k + 1);
        setStatus("loading");
      }, 1000);
    };

    canvas.addEventListener("webglcontextlost", onContextLost);
    return () => canvas.removeEventListener("webglcontextlost", onContextLost);
  }, [mountKey]);

  return (
    <div className={`relative ${className}`} style={{ background: "#1a1a2e", width: "100%", height: "100%" }}>
      {/* Three.js Canvas */}
      <Canvas
        key={`canvas-${mountKey}`}
        ref={(node) => {
          // R3F Canvas ref gives us the canvas DOM element
          if (node) {
            const el = (node as any).querySelector?.("canvas") || (node as any);
            if (el instanceof HTMLCanvasElement) {
              canvasRef.current = el;
            }
          }
        }}
        camera={{ position: [3, 2.5, 4], fov: 45, near: 0.01, far: 100 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        dpr={[1, 2]}
        style={{ background: "#1a1a2e" }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color("#1a1a2e"), 1);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
        }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.0} castShadow />
        <directionalLight position={[-3, 4, -3]} intensity={0.4} />
        <pointLight position={[0, 5, 0]} intensity={0.3} />

        <Environment preset="studio" />

        <Suspense fallback={null}>
          <GLBModel
            src={src}
            viewMode={viewMode}
            onLoaded={handleLoaded}
            onError={handleError}
          />
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
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.01, 0]}
          receiveShadow
        >
          <planeGeometry args={[20, 20]} />
          <shadowMaterial opacity={0.15} />
        </mesh>
      </Canvas>

      {/* Loading overlay */}
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          <Loader2 className="w-10 h-10 text-brand animate-spin mb-3" />
          <p className="text-sm text-gray-400">Loading 3D model...</p>
        </div>
      )}

      {/* Error overlay */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#1a1a2e]/90">
          <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-sm text-red-300 mb-1">Failed to load model</p>
          <p className="text-xs text-gray-500 mb-4 max-w-[300px] text-center">
            {errorMsg}
          </p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
