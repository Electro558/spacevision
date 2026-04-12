"use client";

import { useEffect, useRef, useCallback } from "react";
import { useCad } from "../context/CadContext";
import {
  createSketch,
  createExtrude,
  createRevolve,
  createFillet,
  createChamfer,
  createLoft,
  createSweep,
  createShell,
  createLinearPattern,
  createCircularPattern,
  createMirrorBody,
} from "../engine/featureTree";
import type { SketchPlane, SketchFeature, CadTool } from "../engine/types";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  shortcut?: string;
  action: () => void;
  separator?: false;
}

interface SeparatorItem {
  separator: true;
}

type MenuEntry = MenuItem | SeparatorItem;

function isSeparator(entry: MenuEntry): entry is SeparatorItem {
  return "separator" in entry && entry.separator === true;
}

export function ContextMenu({ x, y, onClose }: ContextMenuProps) {
  const cad = useCad();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Adjust position so menu doesn't go off-screen
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (rect.right > vw) {
      menuRef.current.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > vh) {
      menuRef.current.style.top = `${y - rect.height}px`;
    }
  }, [x, y]);

  const setTool = useCallback(
    (tool: CadTool) => {
      cad.setActiveTool(tool);
      onClose();
    },
    [cad, onClose]
  );

  const handleNewSketch = useCallback(
    (plane: SketchPlane) => {
      const sketchFeature = createSketch(
        `Sketch ${cad.project.features.length + 1}`,
        plane
      );
      cad.addFeature(sketchFeature);
      cad.setSelectedFeatureId(sketchFeature.id);
      cad.setSketchModeActive(true, sketchFeature.id);
      onClose();
    },
    [cad, onClose]
  );

  const handleExtrude = useCallback(() => {
    const sketches = cad.project.features.filter(
      (f): f is SketchFeature => f.type === "sketch"
    );
    if (sketches.length === 0) {
      alert("Create a sketch first before extruding.");
      onClose();
      return;
    }
    const lastSketch = sketches[sketches.length - 1];
    const extrude = createExtrude(
      `Extrude ${cad.project.features.filter((f) => f.type === "extrude").length + 1}`,
      lastSketch.id,
      10,
      "add"
    );
    cad.addFeature(extrude);
    cad.setSelectedFeatureId(extrude.id);
    onClose();
  }, [cad, onClose]);

  const handleRevolve = useCallback(() => {
    const sketches = cad.project.features.filter(
      (f): f is SketchFeature => f.type === "sketch"
    );
    if (sketches.length === 0) {
      alert("Create a sketch first before revolving.");
      onClose();
      return;
    }
    const lastSketch = sketches[sketches.length - 1];
    const revolve = createRevolve(lastSketch.id, 360, "x");
    cad.addFeature(revolve);
    cad.setSelectedFeatureId(revolve.id);
    onClose();
  }, [cad, onClose]);

  const handleFillet = useCallback(() => {
    const hasSolid = cad.project.features.some(
      (f) =>
        (f.type === "extrude" || f.type === "revolve") && !f.suppressed
    );
    if (!hasSolid) {
      alert("Create a solid feature first.");
      onClose();
      return;
    }
    const fillet = createFillet(2);
    cad.addFeature(fillet);
    cad.setSelectedFeatureId(fillet.id);
    onClose();
  }, [cad, onClose]);

  const handleChamfer = useCallback(() => {
    const hasSolid = cad.project.features.some(
      (f) =>
        (f.type === "extrude" || f.type === "revolve") && !f.suppressed
    );
    if (!hasSolid) {
      alert("Create a solid feature first.");
      onClose();
      return;
    }
    const chamfer = createChamfer(1);
    cad.addFeature(chamfer);
    cad.setSelectedFeatureId(chamfer.id);
    onClose();
  }, [cad, onClose]);

  const handleLoft = useCallback(() => {
    const sketches = cad.project.features.filter(
      (f) => f.type === "sketch" && !f.suppressed
    );
    if (sketches.length < 2) {
      alert("Loft requires at least 2 sketches.");
      onClose();
      return;
    }
    const sketchIds = sketches.slice(-2).map((s) => s.id);
    const loft = createLoft(sketchIds);
    cad.addFeature(loft);
    cad.setSelectedFeatureId(loft.id);
    onClose();
  }, [cad, onClose]);

  const handleSweep = useCallback(() => {
    const sketches = cad.project.features.filter(
      (f) => f.type === "sketch" && !f.suppressed
    );
    if (sketches.length < 2) {
      alert("Sweep requires at least 2 sketches.");
      onClose();
      return;
    }
    const sweep = createSweep(
      sketches[sketches.length - 2].id,
      sketches[sketches.length - 1].id
    );
    cad.addFeature(sweep);
    cad.setSelectedFeatureId(sweep.id);
    onClose();
  }, [cad, onClose]);

  const handleShell = useCallback(() => {
    const hasSolid = cad.project.features.some(
      (f) =>
        (f.type === "extrude" ||
          f.type === "revolve" ||
          f.type === "loft" ||
          f.type === "sweep") &&
        !f.suppressed
    );
    if (!hasSolid) {
      alert("Shell requires an existing solid.");
      onClose();
      return;
    }
    const shell = createShell(1);
    cad.addFeature(shell);
    cad.setSelectedFeatureId(shell.id);
    onClose();
  }, [cad, onClose]);

  const handleLinearPattern = useCallback(() => {
    const lastSolid = cad.project.features
      .filter((f) => f.type !== "sketch" && !f.suppressed)
      .pop();
    if (!lastSolid) {
      alert("Pattern requires an existing feature.");
      onClose();
      return;
    }
    const pattern = createLinearPattern(lastSolid.id);
    cad.addFeature(pattern);
    cad.setSelectedFeatureId(pattern.id);
    onClose();
  }, [cad, onClose]);

  const handleCircularPattern = useCallback(() => {
    const lastSolid = cad.project.features
      .filter((f) => f.type !== "sketch" && !f.suppressed)
      .pop();
    if (!lastSolid) {
      alert("Pattern requires an existing feature.");
      onClose();
      return;
    }
    const pattern = createCircularPattern(lastSolid.id);
    cad.addFeature(pattern);
    cad.setSelectedFeatureId(pattern.id);
    onClose();
  }, [cad, onClose]);

  const handleMirrorBody = useCallback(() => {
    const hasSolid = cad.project.features.some(
      (f) => f.type !== "sketch" && !f.suppressed
    );
    if (!hasSolid) {
      alert("Mirror requires an existing solid.");
      onClose();
      return;
    }
    const mirror = createMirrorBody("XY");
    cad.addFeature(mirror);
    cad.setSelectedFeatureId(mirror.id);
    onClose();
  }, [cad, onClose]);

  // Build context-sensitive menu items
  const items: MenuEntry[] = [];

  if (cad.uiState.sketchModeActive) {
    // Sketch mode menu
    items.push(
      { label: "Line", shortcut: "L", action: () => setTool("line") },
      { label: "Circle", shortcut: "C", action: () => setTool("circle") },
      { label: "Rectangle", shortcut: "R", action: () => setTool("rectangle") },
      { label: "Arc", shortcut: "A", action: () => setTool("arc") },
      { separator: true },
      { label: "Trim", shortcut: "T", action: () => setTool("trim") },
      { label: "Mirror", shortcut: "M", action: () => setTool("mirror") },
      { label: "Offset", shortcut: "O", action: () => setTool("offset") },
      { separator: true },
      {
        label: "Construction Mode",
        shortcut: "X",
        action: () => {
          window.dispatchEvent(
            new CustomEvent("cad-toggle-construction-mode")
          );
          onClose();
        },
      },
      {
        label: "Finish Sketch",
        shortcut: "Esc",
        action: () => {
          cad.setSketchModeActive(false);
          onClose();
        },
      }
    );
  } else {
    // Non-sketch mode menu
    items.push(
      {
        label: "New Sketch on XY",
        action: () => handleNewSketch("XY"),
      },
      {
        label: "New Sketch on XZ",
        action: () => handleNewSketch("XZ"),
      },
      {
        label: "New Sketch on YZ",
        action: () => handleNewSketch("YZ"),
      },
      { separator: true },
      { label: "Extrude", shortcut: "E", action: handleExtrude },
      { label: "Revolve", action: handleRevolve },
      { label: "Fillet", shortcut: "F", action: handleFillet },
      { label: "Chamfer", action: handleChamfer },
      { separator: true },
      { label: "Loft", action: handleLoft },
      { label: "Sweep", action: handleSweep },
      { label: "Shell", action: handleShell },
      { separator: true },
      { label: "Linear Pattern", action: handleLinearPattern },
      { label: "Circular Pattern", action: handleCircularPattern },
      { label: "Mirror Body", action: handleMirrorBody }
    );
  }

  // Feature-selected items
  if (cad.uiState.selectedFeatureId) {
    const feature = cad.project.features.find(
      (f) => f.id === cad.uiState.selectedFeatureId
    );
    if (feature) {
      items.push({ separator: true });
      if (feature.type === "sketch") {
        items.push({
          label: "Edit Sketch",
          action: () => {
            cad.setSelectedFeatureId(feature.id);
            cad.setSketchModeActive(true, feature.id);
            onClose();
          },
        });
      }
      items.push({
        label: feature.suppressed ? "Unsuppress" : "Suppress",
        action: () => {
          cad.updateFeature(feature.id, {
            suppressed: !feature.suppressed,
          });
          onClose();
        },
      });
      items.push({
        label: "Delete Feature",
        shortcut: "Del",
        action: () => {
          cad.removeFeature(feature.id);
          cad.setSelectedFeatureId(null);
          onClose();
        },
      });
    }
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-52 rounded border border-gray-700 bg-[#1a1a2e] py-1 shadow-2xl"
      style={{ left: x, top: y }}
    >
      {items.map((entry, i) => {
        if (isSeparator(entry)) {
          return (
            <div
              key={`sep-${i}`}
              className="my-1 border-t border-gray-700"
            />
          );
        }
        return (
          <button
            key={`${entry.label}-${i}`}
            onClick={entry.action}
            className="flex w-full items-center justify-between px-4 py-1.5 text-left text-xs text-gray-300 hover:bg-gray-700"
          >
            <span>{entry.label}</span>
            {entry.shortcut && (
              <span className="ml-6 text-gray-500">{entry.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
