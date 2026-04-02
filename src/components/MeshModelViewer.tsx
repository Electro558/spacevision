"use client";

import { useEffect, useRef, useCallback } from "react";

export type ViewMode = "colored" | "wireframe" | "solid";

interface MeshModelViewerProps {
  src: string;
  alt?: string;
  poster?: string;
  className?: string;
  viewMode?: ViewMode;
}

export default function MeshModelViewer({
  src,
  alt = "3D Model",
  poster,
  className = "",
  viewMode = "colored",
}: MeshModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true;
      import("@google/model-viewer").catch(() => {
        console.warn("model-viewer failed to load");
      });
    }
  }, []);

  // Apply view mode changes via model-viewer's scene graph
  const applyViewMode = useCallback(
    async (viewer: any) => {
      if (!viewer || !viewer.model) return;

      try {
        const materials = viewer.model.materials;
        if (!materials) return;

        for (const material of materials) {
          if (viewMode === "wireframe") {
            // Set all materials to a grey wireframe look
            material.pbrMetallicRoughness.setBaseColorFactor([0.5, 0.5, 0.5, 1.0]);
            material.pbrMetallicRoughness.setMetallicFactor(0.1);
            material.pbrMetallicRoughness.setRoughnessFactor(0.9);
            material.setAlphaMode("OPAQUE");
          } else if (viewMode === "solid") {
            // Grey clay render — no textures, solid grey
            material.pbrMetallicRoughness.setBaseColorFactor([0.6, 0.6, 0.6, 1.0]);
            material.pbrMetallicRoughness.setMetallicFactor(0.0);
            material.pbrMetallicRoughness.setRoughnessFactor(0.7);
            material.setAlphaMode("OPAQUE");
          }
          // "colored" mode = default, restored on src change
        }
      } catch {
        // Model materials API may not be available
      }
    },
    [viewMode]
  );

  useEffect(() => {
    // When viewMode changes, apply to existing viewer
    const el = containerRef.current?.querySelector("model-viewer") as any;
    if (el?.model) {
      applyViewMode(el);
    }
  }, [viewMode, applyViewMode]);

  const handleLoad = useCallback(() => {
    const el = containerRef.current?.querySelector("model-viewer") as any;
    if (el) {
      viewerRef.current = el;
      if (viewMode !== "colored") {
        // Small delay to ensure model materials are ready
        setTimeout(() => applyViewMode(el), 100);
      }
    }
  }, [viewMode, applyViewMode]);

  useEffect(() => {
    const el = containerRef.current?.querySelector("model-viewer") as any;
    if (el) {
      el.addEventListener("load", handleLoad);
      return () => el.removeEventListener("load", handleLoad);
    }
  }, [handleLoad, src]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* @ts-ignore - model-viewer is a web component */}
      <model-viewer
        src={src}
        alt={alt}
        poster={poster || undefined}
        camera-controls=""
        auto-rotate=""
        shadow-intensity="1"
        environment-image="neutral"
        interaction-prompt="none"
        touch-action="pan-y"
        camera-orbit="0deg 75deg 105%"
        min-camera-orbit="auto auto auto"
        max-camera-orbit="auto auto auto"
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "transparent",
          borderRadius: "0.75rem",
        }}
      />
    </div>
  );
}
