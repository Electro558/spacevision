"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useCadProject, type CadProjectState } from "../hooks/useCadProject";
import { useOcctWorker, type OcctStatus } from "../hooks/useOcctWorker";
import type { CadProject } from "../engine/types";

interface CadContextValue extends CadProjectState {
  occtStatus: OcctStatus;
  occtLoadProgress: number;
  occtLoadMessage: string;
  occtError: string | null;
}

const CadCtx = createContext<CadContextValue | null>(null);

export function CadProvider({
  children,
  initialProject,
}: {
  children: ReactNode;
  initialProject?: CadProject;
}) {
  const projectState = useCadProject(initialProject);
  const worker = useOcctWorker();

  // Auto-rebuild when features change and worker is ready
  useEffect(() => {
    if (worker.status !== "ready") return;

    let cancelled = false;
    projectState.setIsRebuilding(true);

    worker
      .rebuild({
        features: projectState.project.features,
        parameters: projectState.project.parameters,
      })
      .then((result) => {
        if (cancelled || !result) return;
        projectState.setMeshes(result.meshes);
      })
      .finally(() => {
        if (!cancelled) projectState.setIsRebuilding(false);
      });

    return () => {
      cancelled = true;
    };
    // Only rebuild when features or parameters change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    projectState.project.features,
    projectState.project.parameters,
    worker.status,
  ]);

  const value: CadContextValue = {
    ...projectState,
    occtStatus: worker.status,
    occtLoadProgress: worker.loadProgress,
    occtLoadMessage: worker.loadMessage,
    occtError: worker.error,
  };

  return <CadCtx.Provider value={value}>{children}</CadCtx.Provider>;
}

export function useCad(): CadContextValue {
  const ctx = useContext(CadCtx);
  if (!ctx) {
    throw new Error("useCad must be used within a CadProvider");
  }
  return ctx;
}
