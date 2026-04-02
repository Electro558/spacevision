import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Allow up to 60s for large model downloads
export const maxDuration = 60;

/**
 * Proxy the GLB model through our server as a stream.
 * This avoids CORS issues with Tripo's CDN (no Access-Control-Allow-Origin).
 * Using streaming to handle large GLB files (10-20MB+).
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
    // Fetch the GLB from Tripo's CDN server-side
    const modelRes = await fetch(meshGen.resultUrl);

    if (!modelRes.ok || !modelRes.body) {
      return NextResponse.json(
        { error: "Failed to fetch model from provider" },
        { status: 502 }
      );
    }

    // Stream the response body directly through to the client
    // This avoids buffering the entire file in memory (important for large GLBs)
    return new NextResponse(modelRes.body as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": "model/gltf-binary",
        "Cache-Control": "public, max-age=86400, s-maxage=86400, immutable",
        "Access-Control-Allow-Origin": "*",
        // Forward content-length if available
        ...(modelRes.headers.get("content-length")
          ? { "Content-Length": modelRes.headers.get("content-length")! }
          : {}),
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
