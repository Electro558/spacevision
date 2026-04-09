"use client";

import { useState, useRef, useEffect } from "react";
import { useCad } from "../context/CadContext";
import {
  createSketch,
  createExtrude,
  createRevolve,
  createFillet,
  createChamfer,
} from "../engine/featureTree";
import { createParameter } from "../engine/parameterRegistry";
import { downloadProject, loadProjectFromFile } from "../engine/projectSerializer";
import type { SketchPlane, SketchFeature } from "../engine/types";

type MenuId = "file" | "sketch" | "features" | "view" | null;

export function TopToolbar() {
  const cad = useCad();
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNewSketch = (plane: SketchPlane) => {
    const sketchFeature = createSketch(`Sketch ${cad.project.features.length + 1}`, plane);
    cad.addFeature(sketchFeature);
    cad.setSelectedFeatureId(sketchFeature.id);
    cad.setSketchModeActive(true, sketchFeature.id);
    setOpenMenu(null);
  };

  const handleExtrude = () => {
    // Find the last sketch feature
    const sketches = cad.project.features.filter(
      (f): f is SketchFeature => f.type === "sketch"
    );
    if (sketches.length === 0) {
      alert("Create a sketch first before extruding.");
      return;
    }
    const lastSketch = sketches[sketches.length - 1];
    const extrude = createExtrude(
      `Extrude ${cad.project.features.filter((f) => f.type === "extrude").length + 1}`,
      lastSketch.id,
      10, // default 10mm depth
      "add"
    );
    cad.addFeature(extrude);
    cad.setSelectedFeatureId(extrude.id);
    setOpenMenu(null);
  };

  const handleRevolve = () => {
    // Find the last sketch feature (same pattern as extrude)
    const sketches = cad.project.features.filter(
      (f): f is SketchFeature => f.type === "sketch"
    );
    if (sketches.length === 0) {
      alert("Create a sketch first before revolving.");
      return;
    }
    const lastSketch = sketches[sketches.length - 1];
    const revolve = createRevolve(lastSketch.id, 360, "x");
    cad.addFeature(revolve);
    cad.setSelectedFeatureId(revolve.id);
    setOpenMenu(null);
  };

  const handleFillet = () => {
    // Fillet applies to the current solid — no sketch needed
    const hasSolid = cad.project.features.some(
      (f) => (f.type === "extrude" || f.type === "revolve") && !f.suppressed
    );
    if (!hasSolid) {
      alert("Create a solid feature (Extrude or Revolve) before adding a Fillet.");
      return;
    }
    const fillet = createFillet(2);
    cad.addFeature(fillet);
    cad.setSelectedFeatureId(fillet.id);
    setOpenMenu(null);
  };

  const handleChamfer = () => {
    // Chamfer applies to the current solid — no sketch needed
    const hasSolid = cad.project.features.some(
      (f) => (f.type === "extrude" || f.type === "revolve") && !f.suppressed
    );
    if (!hasSolid) {
      alert("Create a solid feature (Extrude or Revolve) before adding a Chamfer.");
      return;
    }
    const chamfer = createChamfer(1);
    cad.addFeature(chamfer);
    cad.setSelectedFeatureId(chamfer.id);
    setOpenMenu(null);
  };

  const handleSaveFile = () => {
    downloadProject(cad.project);
    setOpenMenu(null);
  };

  const handleOpenFile = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".svcp,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const project = await loadProjectFromFile(file);
        cad.setProjectName(project.name);
        cad.setFeatures(project.features);
        cad.setParameters(project.parameters);
      } catch (err: any) {
        alert(`Failed to open file: ${err.message}`);
      }
    };
    input.click();
    setOpenMenu(null);
  };

  const menus: { id: MenuId; label: string; items: { label: string; action: () => void; shortcut?: string }[] }[] = [
    {
      id: "file",
      label: "File",
      items: [
        { label: "New Project", action: () => { window.location.reload(); }, shortcut: "Ctrl+N" },
        { label: "Open .svcp...", action: handleOpenFile, shortcut: "Ctrl+O" },
        { label: "Save to File", action: handleSaveFile, shortcut: "Ctrl+S" },
        { label: "Export STEP", action: () => { cad.exportProject("step"); setOpenMenu(null); } },
        { label: "Export STL", action: () => { cad.exportProject("stl"); setOpenMenu(null); } },
      ],
    },
    {
      id: "sketch",
      label: "Sketch",
      items: [
        { label: "New Sketch on XY Plane", action: () => handleNewSketch("XY") },
        { label: "New Sketch on XZ Plane", action: () => handleNewSketch("XZ") },
        { label: "New Sketch on YZ Plane", action: () => handleNewSketch("YZ") },
        { label: "Finish Sketch", action: () => cad.setSketchModeActive(false) },
      ],
    },
    {
      id: "features",
      label: "Features",
      items: [
        { label: "Extrude", action: handleExtrude, shortcut: "E" },
        { label: "Revolve", action: handleRevolve, shortcut: "R" },
        { label: "Fillet", action: handleFillet },
        { label: "Chamfer", action: handleChamfer },
      ],
    },
    {
      id: "view",
      label: "View",
      items: [
        { label: cad.uiState.gridVisible ? "Hide Grid" : "Show Grid", action: cad.toggleGrid },
        { label: cad.uiState.snapEnabled ? "Disable Snap" : "Enable Snap", action: cad.toggleSnap },
      ],
    },
  ];

  return (
    <div ref={menuRef} className="flex h-10 items-center border-b border-gray-800 bg-[#1a1a2e] px-4 text-xs">
      <span className="mr-4 font-bold text-indigo-400">SpaceVision CAD</span>

      {menus.map((menu) => (
        <div key={menu.id} className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === menu.id ? null : menu.id)}
            className={`px-3 py-2 ${
              openMenu === menu.id
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {menu.label}
          </button>

          {openMenu === menu.id && (
            <div className="absolute left-0 top-full z-50 min-w-48 rounded-b border border-gray-700 bg-[#1a1a2e] py-1 shadow-xl">
              {menu.items.map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  className="flex w-full items-center justify-between px-4 py-1.5 text-left text-gray-300 hover:bg-gray-700"
                >
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <span className="ml-4 text-gray-500">{item.shortcut}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="flex-1" />

      {/* Undo/Redo */}
      <button
        onClick={cad.undo}
        disabled={!cad.canUndo}
        className="mr-1 rounded px-2 py-1 text-gray-400 hover:bg-gray-700 disabled:opacity-30"
        title="Undo (Ctrl+Z)"
      >
        ↩
      </button>
      <button
        onClick={cad.redo}
        disabled={!cad.canRedo}
        className="mr-4 rounded px-2 py-1 text-gray-400 hover:bg-gray-700 disabled:opacity-30"
        title="Redo (Ctrl+Shift+Z)"
      >
        ↪
      </button>

      <span className="rounded bg-green-900/50 px-2 py-0.5 text-green-400">
        ● OCCT Ready
      </span>
    </div>
  );
}
