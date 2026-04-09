// src/cad/hooks/useOcctWorker.ts

"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { OcctWorkerApi } from "../worker/workerApi";
import type {
  RebuildPayload,
  RebuildResultPayload,
  ExportResultPayload,
  Feature,
  Parameter,
} from "../engine/types";

export type OcctStatus = "idle" | "loading" | "ready" | "error";

export function useOcctWorker() {
  const apiRef = useRef<OcctWorkerApi | null>(null);
  const [status, setStatus] = useState<OcctStatus>("idle");
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadMessage, setLoadMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const api = new OcctWorkerApi({
      onProgress: (percent, message) => {
        setLoadProgress(percent);
        setLoadMessage(message);
      },
      onReady: () => {
        setStatus("ready");
        setLoadProgress(100);
        setLoadMessage("Ready");
      },
    });
    apiRef.current = api;
    setStatus("loading");

    api.init().catch((err) => {
      setStatus("error");
      setError(err.message);
    });

    return () => {
      api.dispose();
      apiRef.current = null;
    };
  }, []);

  const rebuild = useCallback(
    async (payload: RebuildPayload): Promise<RebuildResultPayload | null> => {
      if (!apiRef.current || status !== "ready") return null;
      try {
        return await apiRef.current.rebuild(payload);
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    },
    [status]
  );

  const exportShape = useCallback(
    async (
      format: "step" | "stl",
      features: Feature[],
      parameters: Record<string, Parameter>
    ): Promise<ExportResultPayload | null> => {
      if (!apiRef.current || status !== "ready") return null;
      try {
        return await apiRef.current.exportShape(format, features, parameters);
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    },
    [status]
  );

  return { status, loadProgress, loadMessage, error, rebuild, exportShape };
}
