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
  const originalMaterials = useRef<Map<number, any>>(new Map());

  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true;
      import("@google/model-viewer").catch(() => {
        console.warn("model-viewer failed to load");
      });
    }
  }, []);

  // Save original material state so we can restore on "colored" mode
  const saveOriginalMaterials = useCallback((viewer: any) => {
    if (!viewer?.model?.materials) return;
    originalMaterials.current.clear();
    viewer.model.materials.forEach((material: any, i: number) => {
      try {
        const pbr = material.pbrMetallicRoughness;
        originalMaterials.current.set(i, {
          baseColor: pbr.baseColorFactor ? [...pbr.baseColorFactor] : [1, 1, 1, 1],
          metallic: pbr.metallicFactor,
          roughness: pbr.roughnessFactor,
          baseColorTexture: pbr.baseColorTexture,
        });
      } catch {
        // ignore
      }
    });
  }, []);

  // Apply view mode changes via model-viewer's scene graph
  const applyViewMode = useCallback(
    (viewer: any) => {
      if (!viewer?.model?.materials) return;

      try {
        const materials = viewer.model.materials;

        for (let i = 0; i < materials.length; i++) {
          const material = materials[i];
          const pbr = material.pbrMetallicRoughness;

          if (viewMode === "wireframe") {
            pbr.setBaseColorFactor([0.45, 0.45, 0.45, 1.0]);
            pbr.setMetallicFactor(0.15);
            pbr.setRoughnessFactor(0.85);
            // Remove base color texture to show flat grey
            if (pbr.baseColorTexture) {
              pbr.baseColorTexture.setTexture(null);
            }
          } else if (viewMode === "solid") {
            pbr.setBaseColorFactor([0.65, 0.65, 0.65, 1.0]);
            pbr.setMetallicFactor(0.0);
            pbr.setRoughnessFactor(0.6);
            if (pbr.baseColorTexture) {
              pbr.baseColorTexture.setTexture(null);
            }
          } else {
            // "colored" — restore originals by reloading src
            // (material restoration is complex, force reload is more reliable)
          }
        }
      } catch {
        // Model materials API may not be available
      }
    },
    [viewMode]
  );

  useEffect(() => {
    const el = containerRef.current?.querySelector("model-viewer") as any;
    if (el?.model) {
      applyViewMode(el);
    }
  }, [viewMode, applyViewMode]);

  const handleLoad = useCallback(() => {
    const el = containerRef.current?.querySelector("model-viewer") as any;
    if (el) {
      viewerRef.current = el;
      saveOriginalMaterials(el);
      if (viewMode !== "colored") {
        setTimeout(() => applyViewMode(el), 150);
      }
    }
  }, [viewMode, applyViewMode, saveOriginalMaterials]);

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
        auto-rotate-delay="0"
        rotation-per-second="20deg"
        interaction-prompt="auto"
        interaction-prompt-style="wiggle"
        touch-action="pan-y"
        camera-orbit="30deg 75deg 105%"
        min-camera-orbit="auto auto auto"
        max-camera-orbit="auto auto 300%"
        min-field-of-view="10deg"
        max-field-of-view="90deg"
        interpolation-decay="100"
        shadow-intensity="1.2"
        shadow-softness="0.8"
        exposure="1.0"
        tone-mapping="commerce"
        environment-image="neutral"
        skybox-height="0"
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "transparent",
          borderRadius: "0.75rem",
          // Force high DPI rendering
          imageRendering: "auto" as any,
        }}
      />
    </div>
  );
}
