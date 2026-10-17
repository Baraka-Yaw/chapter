import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAdmin } from "@/lib/admin/session";

// Signs browser uploads of product photos to Vercel Blob. Admin only (proxy.ts checks too).
export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      { error: { code: "uploads_not_configured", message: "Photo storage isn't set up: add a Vercel Blob store (BLOB_READ_WRITE_TOKEN)." } },
      { status: 503 },
    );
  }
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!(await isAdmin())) throw new Error("Not signed in");
        if (!pathname.startsWith("products/")) throw new Error("Invalid upload path");
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
          maximumSizeInBytes: 8 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return Response.json({ error: { code: "upload_failed", message } }, { status: 400 });
  }
}
