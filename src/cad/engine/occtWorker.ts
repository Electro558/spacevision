// src/cad/engine/occtWorker.ts

/// <reference lib="webworker" />

import { tessellateShape } from "../worker/tessellator";
import { rebuildFromFeatureTree } from "../worker/occtOperations";
import type {
  WorkerRequest,
  WorkerResponse,
  RebuildPayload,
  RebuildResultPayload,
  Feature,
  Parameter,
} from "./types";

declare const self: DedicatedWorkerGlobalScope;

let oc: any = null;

function respond(msg: WorkerResponse, transfer?: Transferable[]) {
  self.postMessage(msg, { transfer: transfer ?? [] });
}

async function initOCCT() {
  // Dynamic import so the worker bundle doesn't include WASM inline
  const initOpenCascade = (await import("opencascade.js")).default;

  respond({
    id: "__init__",
    type: "progress",
    payload: { percent: 10, message: "Downloading OpenCASCADE kernel..." },
  });

  oc = await initOpenCascade();

  respond({
    id: "__init__",
    type: "ready",
    payload: { version: "7.5.2" },
  });
}

function handleRebuild(requestId: string, payload: RebuildPayload) {
  try {
    const shape = rebuildFromFeatureTree(oc, payload.features, payload.parameters);

    if (!shape) {
      respond({
        id: requestId,
        type: "result",
        payload: { meshes: [] } satisfies RebuildResultPayload,
      });
      return;
    }

    const mesh = tessellateShape(oc, shape, 0.1);

    // Convert to typed arrays for transfer
    const vertices = new Float32Array(mesh.vertices);
    const normals = new Float32Array(mesh.normals);
    const indices = new Uint32Array(mesh.indices);

    const result: RebuildResultPayload = {
      meshes: [
        {
          featureId: "final",
          vertices,
          normals,
          indices,
        },
      ],
    };

    respond({ id: requestId, type: "result", payload: result }, [
      vertices.buffer,
      normals.buffer,
      indices.buffer,
    ]);
  } catch (err: any) {
    respond({
      id: requestId,
      type: "error",
      payload: { message: err.message || String(err) },
    });
  }
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { id, type, payload } = e.data;

  if (type === "init") {
    try {
      await initOCCT();
    } catch (err: any) {
      respond({
        id,
        type: "error",
        payload: { message: `OCCT init failed: ${err.message}` },
      });
    }
    return;
  }

  if (!oc) {
    respond({
      id,
      type: "error",
      payload: { message: "OCCT not initialized. Send 'init' first." },
    });
    return;
  }

  if (type === "rebuild") {
    handleRebuild(id, payload as RebuildPayload);
    return;
  }

  respond({
    id,
    type: "error",
    payload: { message: `Unknown request type: ${type}` },
  });
};
