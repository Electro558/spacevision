import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Proxy the GLB model file through our server to avoid CORS issues
 * with Tripo's CDN URLs when loading in model-viewer.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const meshGen = await prisma.meshGeneration.findUnique({
    where: { id },
  });

  if (!meshGen || meshGen.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (meshGen.status !== "success" || !meshGen.resultUrl) {
    return NextResponse.json({ error: "Model not ready" }, { status: 400 });
  }

  try {
    // Fetch the GLB file from Tripo's CDN
    const modelRes = await fetch(meshGen.resultUrl);

    if (!modelRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch model from provider" },
        { status: 502 }
      );
    }

    const modelBuffer = await modelRes.arrayBuffer();

    // Return the GLB binary with proper headers
    return new NextResponse(modelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "model/gltf-binary",
        "Content-Length": modelBuffer.byteLength.toString(),
        "Cache-Control": "public, max-age=86400, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    console.error("[MeshProxy] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to proxy model" },
      { status: 500 }
    );
  }
}
