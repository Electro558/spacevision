// src/cad/worker/workerApi.ts

import type {
  WorkerRequest,
  WorkerResponse,
  RebuildPayload,
  RebuildResultPayload,
  ReadyPayload,
  ProgressPayload,
  ErrorPayload,
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
      // Listen for the __init__ ready message
      const initHandler = (resp: WorkerResponse) => {
        if (resp.id === "__init__" && resp.type === "ready") {
          const payload = resp.payload as ReadyPayload;
          this.onReady?.(payload.version);
          resolve();
          return true; // handled
        }
        if (resp.id === "__init__" && resp.type === "progress") {
          const payload = resp.payload as ProgressPayload;
          this.onProgress?.(payload.percent, payload.message);
          return true;
        }
        if (resp.id === "__init__" && resp.type === "error") {
          const payload = resp.payload as ErrorPayload;
          reject(new Error(payload.message));
          return true;
        }
        return false;
      };

      // Temporarily intercept messages for init
      const originalHandler = this.worker!.onmessage;
      this.worker!.onmessage = (e: MessageEvent<WorkerResponse>) => {
        if (!initHandler(e.data)) {
          this.handleMessage(e.data);
        }
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
