// src/cad/worker/workerApi.ts

import type {
  WorkerRequest,
  WorkerResponse,
  RebuildPayload,
  RebuildResultPayload,
  ExportPayload,
  ExportResultPayload,
  ReadyPayload,
  ProgressPayload,
  ErrorPayload,
  Feature,
  Parameter,
} from "../engine/types";

type RequestCallback = {
  resolve: (response: WorkerResponse) => void;
  reject: (error: Error) => void;
};

/**
 * Typed wrapper around the OCCT Web Worker.
 * Handles request/response matching via message IDs.
 */
export class OcctWorkerApi {
  private worker: Worker | null = null;
  private pending = new Map<string, RequestCallback>();
  private nextId = 0;
  private onProgress?: (percent: number, message: string) => void;
  private onReady?: (version: string) => void;

  constructor(opts?: {
    onProgress?: (percent: number, message: string) => void;
    onReady?: (version: string) => void;
  }) {
    this.onProgress = opts?.onProgress;
    this.onReady = opts?.onReady;
  }

  /**
   * Start the worker and initialize OCCT WASM.
   */
  async init(): Promise<void> {
    // Create worker from the worker entry file
    this.worker = new Worker(
      new URL("../engine/occtWorker.ts", import.meta.url),
      { type: "module" }
    );

    this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      this.handleMessage(e.data);
    };

    this.worker.onerror = (err) => {
      console.error("[OcctWorker] Worker error:", err);
    };

    // Send init command and wait for ready
    return new Promise((resolve, reject) => {
      let initComplete = false;

      // Temporarily intercept messages for init, then restore normal handler
      this.worker!.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const resp = e.data;

        // Once init is complete, use normal handler for all messages
        if (initComplete) {
          this.handleMessage(resp);
          return;
        }

        if (resp.id === "__init__" && resp.type === "ready") {
          const payload = resp.payload as ReadyPayload;
          this.onReady?.(payload.version);
          initComplete = true;
          // Restore normal message handler
          this.worker!.onmessage = (ev: MessageEvent<WorkerResponse>) => {
            this.handleMessage(ev.data);
          };
          resolve();
          return;
        }
        if (resp.id === "__init__" && resp.type === "progress") {
          const payload = resp.payload as ProgressPayload;
          this.onProgress?.(payload.percent, payload.message);
          return;
        }
        if (resp.id === "__init__" && resp.type === "error") {
          const payload = resp.payload as ErrorPayload;
          initComplete = true;
          reject(new Error(payload.message));
          return;
        }

        // Non-init messages during init: forward to normal handler
        this.handleMessage(resp);
      };

      this.send({ id: "__init__", type: "init", payload: {} });
    });
  }

  /**
   * Rebuild geometry from the full feature tree.
   */
  async rebuild(payload: RebuildPayload): Promise<RebuildResultPayload> {
    const response = await this.request("rebuild", payload);
    if (response.type === "error") {
      const err = response.payload as ErrorPayload;
      throw new Error(err.message);
    }
    return response.payload as RebuildResultPayload;
  }

  /**
   * Export the shape to STEP or STL format.
   */
  async exportShape(
    format: "step" | "stl",
    features: Feature[],
    parameters: Record<string, Parameter>
  ): Promise<ExportResultPayload> {
    const response = await this.request("export", {
      format,
      features,
      parameters,
    } satisfies ExportPayload);
    if (response.type === "error") {
      const err = response.payload as ErrorPayload;
      throw new Error(err.message);
    }
    return response.payload as ExportResultPayload;
  }

  /**
   * Terminate the worker.
   */
  dispose() {
    this.worker?.terminate();
    this.worker = null;
    this.pending.clear();
  }

  private request(type: string, payload: unknown): Promise<WorkerResponse> {
    const id = `req_${this.nextId++}`;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.send({ id, type, payload } as WorkerRequest);
    });
  }

  private send(msg: WorkerRequest) {
    if (!this.worker) throw new Error("Worker not initialized");
    this.worker.postMessage(msg);
  }

  private handleMessage(msg: WorkerResponse) {
    const callback = this.pending.get(msg.id);
    if (callback) {
      this.pending.delete(msg.id);
      callback.resolve(msg);
    }
  }
}
