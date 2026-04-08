// src/cad/engine/projectSerializer.ts

import type { CadProject, Feature, Parameter } from "./types";

const CURRENT_VERSION = "1.0";

/**
 * Creates a new empty project.
 */
export function createEmptyProject(name = "Untitled"): CadProject {
  return {
    version: CURRENT_VERSION,
    name,
    units: "mm",
    parameters: {},
    features: [],
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      author: "",
      material: "",
    },
  };
}

/**
 * Serializes a project to a JSON string (.svcp format).
 */
export function serializeProject(project: CadProject): string {
  const updated: CadProject = {
    ...project,
    metadata: {
      ...project.metadata,
      modified: new Date().toISOString(),
    },
  };
  return JSON.stringify(updated, null, 2);
}

/**
 * Deserializes a .svcp JSON string into a CadProject.
 * Validates the structure and migrates old versions if needed.
 */
export function deserializeProject(json: string): CadProject {
  let data: any;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("Invalid .svcp file: not valid JSON");
  }

  if (!data.version) {
    throw new Error("Invalid .svcp file: missing version field");
  }

  if (!data.features || !Array.isArray(data.features)) {
    throw new Error("Invalid .svcp file: missing or invalid features array");
  }

  // Ensure required fields exist with sensible defaults
  if (!data.name || typeof data.name !== "string") data.name = "Untitled";
  if (!data.units || typeof data.units !== "string") data.units = "mm";
  if (!data.parameters || typeof data.parameters !== "object") data.parameters = {};
  if (!data.metadata || typeof data.metadata !== "object") {
    data.metadata = { created: new Date().toISOString(), modified: new Date().toISOString(), author: "", material: "" };
  }

  // Version migration would go here for future versions

  return data as CadProject;
}

/**
 * Downloads a project as a .svcp file.
 */
export function downloadProject(project: CadProject): void {
  const json = serializeProject(project);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.name.replace(/[^a-zA-Z0-9-_]/g, "_")}.svcp`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Reads a .svcp file from a File input.
 */
export async function loadProjectFromFile(file: File): Promise<CadProject> {
  const text = await file.text();
  return deserializeProject(text);
}

/**
 * Saves a project to localStorage (for Phase 1, before database).
 */
export function saveToLocalStorage(project: CadProject): void {
  const key = `svcp_${project.name}`;
  localStorage.setItem(key, serializeProject(project));
  // Update project index
  const index: string[] = JSON.parse(
    localStorage.getItem("svcp_index") || "[]"
  );
  if (!index.includes(key)) {
    index.push(key);
    localStorage.setItem("svcp_index", JSON.stringify(index));
  }
}

/**
 * Loads a project from localStorage.
 */
export function loadFromLocalStorage(name: string): CadProject | null {
  const json = localStorage.getItem(`svcp_${name}`);
  if (!json) return null;
  return deserializeProject(json);
}

/**
 * Lists all projects in localStorage.
 */
export function listLocalProjects(): string[] {
  const index: string[] = JSON.parse(
    localStorage.getItem("svcp_index") || "[]"
  );
  return index.map((key) => key.replace("svcp_", ""));
}
