"use client";

import { useEffect, useRef } from "react";

interface MeshModelViewerProps {
  src: string;
  alt?: string;
  poster?: string;
  className?: string;
}

export default function MeshModelViewer({ src, alt = "3D Model", poster, className = "" }: MeshModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true;
      import("@google/model-viewer").catch(() => {
        console.warn("model-viewer failed to load");
      });
    }
  }, []);

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
