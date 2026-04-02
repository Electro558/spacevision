// Tripo3D API client — lazy init to avoid build-time errors

const TRIPO_API_BASE = "https://api.tripo3d.ai/v2/openapi";

function getApiKey(): string {
  const key = process.env.TRIPO_API_KEY;
  if (!key) throw new Error("TRIPO_API_KEY is not set");
  return key;
}

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getApiKey()}`,
  };
}

export interface TripoTask {
  task_id: string;
  type: string;
  status: "queued" | "running" | "success" | "failed" | "cancelled" | "unknown";
  progress: number;
  output?: {
    // Tripo v2.5 returns flat URL strings
    pbr_model?: string;
    rendered_image?: string;
    generated_image?: string;
    // Some versions may return objects
    model?: { url: string; type: string } | string;
  };
  create_time?: number;
}

// ── Create Tasks ──────────────────────────────────

export async function createTextToModel(
  prompt: string,
  options?: {
    style?: string; // null for realistic, or: "lego", "voxel", "voronoi", "minecraft"
    modelVersion?: string; // "v2.5-20250123" (default), "v2.0-20240919"
  }
): Promise<string> {
  const body: Record<string, unknown> = {
    type: "text_to_model",
    prompt,
    model_version: options?.modelVersion || "v2.5-20250123",
  };

  if (options?.style) {
    body.style = options.style;
  }

  const res = await fetch(`${TRIPO_API_BASE}/task`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Tripo API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`Tripo task creation failed: ${data.message || JSON.stringify(data)}`);
  }

  return data.data.task_id;
}

export async function createImageToModel(
  imageUrl: string,
  options?: {
    modelVersion?: string;
  }
): Promise<string> {
  const body: Record<string, unknown> = {
    type: "image_to_model",
    file: { url: imageUrl },
    model_version: options?.modelVersion || "v2.5-20250123",
  };

  const res = await fetch(`${TRIPO_API_BASE}/task`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Tripo API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`Tripo task creation failed: ${data.message || JSON.stringify(data)}`);
  }

  return data.data.task_id;
}

// ── Poll Task Status ──────────────────────────────────

export async function getTaskStatus(taskId: string): Promise<TripoTask> {
  const res = await fetch(`${TRIPO_API_BASE}/task/${taskId}`, {
    method: "GET",
    headers: headers(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Tripo API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`Tripo status check failed: ${data.message || JSON.stringify(data)}`);
  }

  return data.data as TripoTask;
}

// ── Download Model ──────────────────────────────────

export async function downloadModel(
  taskId: string,
  format: "glb" | "fbx" | "obj" | "stl" | "usdz" = "glb"
): Promise<string> {
  // For GLB, the URL is already in the task output
  // For other formats, we need to request conversion
  const task = await getTaskStatus(taskId);

  if (task.status !== "success") {
    throw new Error(`Task ${taskId} is not complete (status: ${task.status})`);
  }

  if (format === "glb") {
    // Tripo v2.5 returns flat URL strings
    const pbr = typeof task.output?.pbr_model === "string" ? task.output.pbr_model : null;
    const model = typeof task.output?.model === "string"
      ? task.output.model
      : typeof task.output?.model === "object" ? task.output.model?.url : null;
    const url = pbr || model;
    if (url) return url;
  }

  // Request format conversion
  const res = await fetch(`${TRIPO_API_BASE}/task`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      type: "convert_model",
      original_model_task_id: taskId,
      format,
      quad: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Tripo conversion error (${res.status}): ${err}`);
  }

  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`Tripo conversion failed: ${data.message || JSON.stringify(data)}`);
  }

  // Poll the conversion task
  const conversionTaskId = data.data.task_id;
  let conversionTask: TripoTask;
  let attempts = 0;

  do {
    await new Promise((r) => setTimeout(r, 2000));
    conversionTask = await getTaskStatus(conversionTaskId);
    attempts++;
  } while (
    conversionTask.status !== "success" &&
    conversionTask.status !== "failed" &&
    attempts < 30
  );

  if (conversionTask.status !== "success" || !conversionTask.output?.model) {
    throw new Error(`Format conversion failed for task ${taskId}`);
  }

  const convModel = conversionTask.output.model;
  const convUrl = typeof convModel === "string" ? convModel : convModel.url;
  if (!convUrl) {
    throw new Error(`Format conversion failed for task ${taskId}`);
  }

  return convUrl;
}

// ── Check Balance ──────────────────────────────────

export async function getBalance(): Promise<{ balance: number; frozen: number }> {
  const res = await fetch(`${TRIPO_API_BASE}/user/balance`, {
    method: "GET",
    headers: headers(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Tripo API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return {
    balance: data.data?.balance ?? 0,
    frozen: data.data?.frozen ?? 0,
  };
}

// ── Mesh Credits Logic ──────────────────────────────────

export const MESH_CREDITS = {
  FREE: 3,      // 3 per month
  PREMIUM: 50,  // 50 per month (Pro plan)
  BUSINESS: 200, // 200 per month
} as const;

export function getMeshCreditsForPlan(plan: string): number {
  switch (plan) {
    case "PREMIUM": return MESH_CREDITS.PREMIUM;
    case "BUSINESS": return MESH_CREDITS.BUSINESS;
    default: return MESH_CREDITS.FREE;
  }
}
