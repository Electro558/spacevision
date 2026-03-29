"use client";

import { useState, useCallback } from "react";
import {
  Box, Circle, Triangle, Cylinder, Hexagon, Star,
  Heart, ArrowUp, Type, ChevronDown, ChevronRight,
  Diamond,
} from "lucide-react";
import type { SceneObject } from "@/lib/cadStore";

const SHAPE_CATEGORIES = [
  {
    name: "Basic",
    shapes: [
      { type: "box" as const, icon: Box, label: "Cube" },
      { type: "sphere" as const, icon: Circle, label: "Sphere" },
      { type: "cylinder" as const, icon: Cylinder, label: "Cylinder" },
      { type: "cone" as const, icon: Triangle, label: "Cone" },
      { type: "wedge" as const, icon: Triangle, label: "Wedge" },
      { type: "tube" as const, icon: Hexagon, label: "Tube" },
      { type: "star" as const, icon: Star, label: "Star" },
      { type: "torus" as const, icon: Circle, label: "Torus" },
      { type: "torusKnot" as const, icon: Circle, label: "Knot" },
      { type: "dodecahedron" as const, icon: Hexagon, label: "Dodeca" },
      { type: "octahedron" as const, icon: Diamond, label: "Octa" },
      { type: "plane" as const, icon: Box, label: "Plane" },
      { type: "capsule" as const, icon: Circle, label: "Capsule" },
    ],
  },
  {
    name: "Extended",
    shapes: [
      { type: "roundedBox" as const, icon: Box, label: "Rounded Box" },
      { type: "halfSphere" as const, icon: Circle, label: "Half Sphere" },
      { type: "pyramid" as const, icon: Triangle, label: "Pyramid" },
      { type: "roof" as const, icon: Triangle, label: "Roof" },
      { type: "ring" as const, icon: Circle, label: "Ring" },
      { type: "arrow" as const, icon: ArrowUp, label: "Arrow" },
    ],
  },
  {
    name: "Text & Mechanical",
    shapes: [
      { type: "text3d" as const, icon: Type, label: "Text" },
      { type: "heart" as const, icon: Heart, label: "Heart" },
      { type: "spring" as const, icon: Circle, label: "Spring" },
      { type: "screw" as const, icon: Cylinder, label: "Screw" },
    ],
  },
];

interface ShapeDrawerProps {
  onAddShape: (type: SceneObject["type"], asHole?: boolean) => void;
  onDragStart?: (type: SceneObject["type"], asHole: boolean) => void;
}

export default function ShapeDrawer({ onAddShape, onDragStart }: ShapeDrawerProps) {
  const [open, setOpen] = useState(true);
  const [holeMode, setHoleMode] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    Basic: true,
    Extended: false,
    "Text & Mechanical": false,
  });

  const toggleCategory = useCallback((name: string) => {
    setExpandedCategories(prev => ({ ...prev, [name]: !prev[name] }));
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="absolute top-2 right-2 z-20 bg-surface border border-surface-border rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-surface-lighter transition-all shadow-lg"
      >
        Shapes
      </button>
    );
  }

  return (
    <div className="absolute top-2 right-2 z-20 w-52 bg-surface border border-surface-border rounded-lg shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border">
        <span className="text-xs font-bold text-gray-300 tracking-wider">SHAPES</span>
        <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white text-xs">
          ✕
        </button>
      </div>

      <div className="flex mx-2 mt-2 mb-1 bg-surface-dark rounded-md overflow-hidden border border-surface-border">
        <button
          onClick={() => setHoleMode(false)}
          className={`flex-1 text-[10px] font-medium py-1.5 transition-all ${
            !holeMode ? "bg-blue-500/20 text-blue-400" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Solid
        </button>
        <button
          onClick={() => setHoleMode(true)}
          className={`flex-1 text-[10px] font-medium py-1.5 transition-all ${
            holeMode ? "bg-red-500/20 text-red-400" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Hole
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto px-2 pb-2">
        {SHAPE_CATEGORIES.map(category => (
          <div key={category.name} className="mt-1.5">
            <button
              onClick={() => toggleCategory(category.name)}
              className="flex items-center gap-1 w-full text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider py-1 hover:text-gray-300"
            >
              {expandedCategories[category.name]
                ? <ChevronDown className="w-3 h-3" />
                : <ChevronRight className="w-3 h-3" />
              }
              {category.name}
            </button>

            {expandedCategories[category.name] && (
              <div className="grid grid-cols-3 gap-1">
                {category.shapes.map(shape => (
                  <button
                    key={shape.type}
                    onClick={() => onAddShape(shape.type, holeMode)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", shape.type);
                      onDragStart?.(shape.type, holeMode);
                    }}
                    title={`${holeMode ? "Hole: " : ""}${shape.label}`}
                    className={`flex flex-col items-center gap-0.5 p-1.5 rounded-md transition-all cursor-grab active:cursor-grabbing ${
                      holeMode
                        ? "hover:bg-red-500/10 text-gray-500 hover:text-red-400"
                        : "hover:bg-surface-lighter text-gray-500 hover:text-white"
                    }`}
                  >
                    <shape.icon className="w-4 h-4" />
                    <span className="text-[8px] leading-tight">{shape.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
