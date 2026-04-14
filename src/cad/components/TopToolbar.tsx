"use client";

import { useState, useRef, useEffect } from "react";
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
  createHole,
  createPrimitive,
  createThread,
  createRib,
  createDome,
} from "../engine/featureTree";
import { createParameter } from "../engine/parameterRegistry";
import { downloadProject, loadProjectFromFile } from "../engine/projectSerializer";
import type { SketchPlane, SketchFeature, PrimitiveType } from "../engine/types";

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

  const handleLoft = () => {
    const sketches = cad.project.features.filter(f => f.type === "sketch" && !f.suppressed);
    if (sketches.length < 2) {
      alert("Loft requires at least 2 sketches. Create more sketches first.");
      return;
    }
    const sketchIds = sketches.slice(-2).map(s => s.id);
    const loft = createLoft(sketchIds);
    cad.addFeature(loft);
    cad.setSelectedFeatureId(loft.id);
    setOpenMenu(null);
  };

  const handleSweep = () => {
    const sketches = cad.project.features.filter(f => f.type === "sketch" && !f.suppressed);
    if (sketches.length < 2) {
      alert("Sweep requires a profile sketch and a path sketch. Create at least 2 sketches.");
      return;
    }
    const sweep = createSweep(sketches[sketches.length - 2].id, sketches[sketches.length - 1].id);
    cad.addFeature(sweep);
    cad.setSelectedFeatureId(sweep.id);
    setOpenMenu(null);
  };

  const handleShell = () => {
    const hasSolid = cad.project.features.some(
      f => (f.type === "extrude" || f.type === "revolve" || f.type === "loft" || f.type === "sweep") && !f.suppressed
    );
    if (!hasSolid) {
      alert("Shell requires an existing solid. Create an Extrude, Revolve, Loft, or Sweep first.");
      return;
    }
    const shell = createShell(1);
    cad.addFeature(shell);
    cad.setSelectedFeatureId(shell.id);
    setOpenMenu(null);
  };

  const handleLinearPattern = () => {
    const lastSolid = cad.project.features.filter(f => f.type !== "sketch" && !f.suppressed).pop();
    if (!lastSolid) {
      alert("Pattern requires an existing feature.");
      return;
    }
    const pattern = createLinearPattern(lastSolid.id);
    cad.addFeature(pattern);
    cad.setSelectedFeatureId(pattern.id);
    setOpenMenu(null);
  };

  const handleCircularPattern = () => {
    const lastSolid = cad.project.features.filter(f => f.type !== "sketch" && !f.suppressed).pop();
    if (!lastSolid) {
      alert("Pattern requires an existing feature.");
      return;
    }
    const pattern = createCircularPattern(lastSolid.id);
    cad.addFeature(pattern);
    cad.setSelectedFeatureId(pattern.id);
    setOpenMenu(null);
  };

  const handleMirrorBody = () => {
    const hasSolid = cad.project.features.some(f => f.type !== "sketch" && !f.suppressed);
    if (!hasSolid) {
      alert("Mirror requires an existing solid.");
      return;
    }
    const mirror = createMirrorBody("XY");
    cad.addFeature(mirror);
    cad.setSelectedFeatureId(mirror.id);
    setOpenMenu(null);
  };

  const handleHole = () => {
    const hasSolid = cad.project.features.some(
      f => (f.type === "extrude" || f.type === "revolve" || f.type === "loft" || f.type === "sweep") && !f.suppressed
    );
    if (!hasSolid) {
      alert("Hole requires an existing solid.");
      return;
    }
    const hole = createHole("simple", 5, 10, "XY");
    cad.addFeature(hole);
    cad.setSelectedFeatureId(hole.id);
    setOpenMenu(null);
  };

  const handlePrimitive = (primitiveType: PrimitiveType) => {
    const prim = createPrimitive(primitiveType);
    cad.addFeature(prim);
    cad.setSelectedFeatureId(prim.id);
    setOpenMenu(null);
  };

  const handleThread = () => {
    const hasSolid = cad.project.features.some(
      f => (f.type === "extrude" || f.type === "revolve" || f.type === "primitive") && !f.suppressed
    );
    if (!hasSolid) {
      alert("Thread requires an existing solid.");
      return;
    }
    const thread = createThread();
    cad.addFeature(thread);
    cad.setSelectedFeatureId(thread.id);
    setOpenMenu(null);
  };

  const handleRib = () => {
    const sketches = cad.project.features.filter(f => f.type === "sketch" && !f.suppressed);
    if (sketches.length === 0) {
      alert("Rib requires a sketch profile. Create a sketch first.");
      return;
    }
    const rib = createRib(sketches[sketches.length - 1].id);
    cad.addFeature(rib);
    cad.setSelectedFeatureId(rib.id);
    setOpenMenu(null);
  };

  const handleDome = () => {
    const hasSolid = cad.project.features.some(
      f => (f.type === "extrude" || f.type === "revolve" || f.type === "primitive") && !f.suppressed
    );
    if (!hasSolid) {
      alert("Dome requires an existing solid.");
      return;
    }
    const dome = createDome();
    cad.addFeature(dome);
    cad.setSelectedFeatureId(dome.id);
    setOpenMenu(null);
  };

  const handleImportStep = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".step,.stp,.STEP,.STP";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      alert("STEP import: File selected - " + file.name + ". Full STEP import requires OCCT WASM reader integration (coming soon).");
    };
    input.click();
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
        { label: "Import STEP...", action: handleImportStep },
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
        { label: "Loft", action: handleLoft },
        { label: "Sweep", action: handleSweep },
        { label: "─────────", action: () => {} },
        { label: "Fillet", action: handleFillet },
        { label: "Chamfer", action: handleChamfer },
        { label: "Shell", action: handleShell },
        { label: "─────────", action: () => {} },
        { label: "Linear Pattern", action: handleLinearPattern },
        { label: "Circular Pattern", action: handleCircularPattern },
        { label: "Mirror Body", action: handleMirrorBody },
        { label: "─────────", action: () => {} },
        { label: "Hole Wizard", action: handleHole },
        { label: "Thread", action: handleThread },
        { label: "Rib", action: handleRib },
        { label: "Dome", action: handleDome },
        { label: "─────────", action: () => {} },
        { label: "⊞ Box", action: () => handlePrimitive("box") },
        { label: "⊞ Cylinder", action: () => handlePrimitive("cylinder") },
        { label: "⊞ Sphere", action: () => handlePrimitive("sphere") },
        { label: "⊞ Cone", action: () => handlePrimitive("cone") },
        { label: "⊞ Torus", action: () => handlePrimitive("torus") },
        { label: "⊞ Wedge", action: () => handlePrimitive("wedge") },
        { label: "⊞ Pipe", action: () => handlePrimitive("pipe") },
      ],
    },
    {
      id: "view",
      label: "View",
      items: [
        { label: cad.uiState.gridVisible ? "Hide Grid" : "Show Grid", action: cad.toggleGrid },
        { label: cad.uiState.snapEnabled ? "Disable Snap" : "Enable Snap", action: cad.toggleSnap },
        { label: "Measure Distance", action: () => { cad.setViewMode("measure" as any); setOpenMenu(null); } },
        { label: "Toggle Section View", action: () => { window.dispatchEvent(new Event("cad-toggle-section")); setOpenMenu(null); } },
      ],
    },
  ];

  return (
    <div ref={menuRef} className="flex h-10 items-center border-b border-gray-800/50 bg-gradient-to-r from-[#0f0f24] via-[#151530] to-[#0f0f24] px-4 text-xs backdrop-blur-sm">
      <span className="mr-4 font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">SpaceVision CAD</span>

      {menus.map((menu) => (
        <div key={menu.id} className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === menu.id ? null : menu.id)}
            className={`cad-toolbar-btn rounded px-3 py-1.5 transition-all duration-200 ${
              openMenu === menu.id
                ? "bg-indigo-800/40 text-white border border-indigo-600/30"
                : "text-gray-400 hover:text-white hover:bg-indigo-900/20"
            }`}
          >
            {menu.label}
          </button>

          {openMenu === menu.id && (
            <div className="cad-menu-dropdown absolute left-0 top-full z-50 min-w-48 rounded-b-lg border border-indigo-800/30 bg-[#12122a]/95 py-1 shadow-2xl shadow-indigo-900/20 backdrop-blur-md">
              {menu.items.map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  className="flex w-full items-center justify-between px-4 py-1.5 text-left text-gray-300 transition-colors duration-150 hover:bg-indigo-800/20 hover:text-indigo-200"
                >
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <span className="ml-4 text-indigo-500/60 text-[10px]">{item.shortcut}</span>
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
        className="cad-toolbar-btn mr-1 rounded-lg px-2.5 py-1.5 text-gray-400 hover:bg-indigo-900/20 hover:text-indigo-300 disabled:opacity-20 disabled:hover:bg-transparent"
        title="Undo (Ctrl+Z)"
      >
        ↩
      </button>
      <button
        onClick={cad.redo}
        disabled={!cad.canRedo}
        className="cad-toolbar-btn mr-4 rounded-lg px-2.5 py-1.5 text-gray-400 hover:bg-indigo-900/20 hover:text-indigo-300 disabled:opacity-20 disabled:hover:bg-transparent"
        title="Redo (Ctrl+Shift+Z)"
      >
        ↪
      </button>

      <span className="flex items-center rounded-full border border-green-800/30 bg-green-950/30 px-2.5 py-0.5 text-green-400">
        <span className="cad-status-dot ready" />
        OCCT Ready
      </span>
    </div>
  );
}
