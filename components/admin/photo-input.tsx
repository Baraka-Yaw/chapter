"use client";

import { upload } from "@vercel/blob/client";
import { useRef, useState } from "react";

const MAX_MB = 8;

// Uploads a product photo straight from the browser to Vercel Blob; /api/admin/upload signs the request.
export function PhotoInput({
  value,
  onChange,
  label,
  enabled,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  label: string;
  enabled: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pick(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) return setError("Choose a photo (JPG, PNG or WebP).");
    if (file.size > MAX_MB * 1024 * 1024) return setError(`Photos must be under ${MAX_MB} MB.`);
    setProgress(0);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const blob = await upload(`products/${Date.now()}.${ext}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
        onUploadProgress: ({ percentage }) => setProgress(percentage),
      });
      onChange(blob.url);
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setProgress(null);
      if (input.current) input.current.value = "";
    }
  }

  if (!enabled) {
    return (
      <p className="text-sm text-ink-soft">
        Photo uploads aren&apos;t switched on yet — they need photo storage (Vercel Blob) connected to the shop. Until then,
        the drawing below is shown.
      </p>
    );
  }

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        aria-label={label}
        onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => input.current?.click()} disabled={progress !== null} className="btn glass px-4! py-2!">
          {progress !== null ? `Uploading ${Math.round(progress)}%` : value ? "Replace photo" : "Upload photo"}
        </button>
        {value && progress === null && (
          <button type="button" onClick={() => onChange(null)} className="text-sm text-ink-soft underline">
            Remove photo
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-[#c8402f]">{error}</p>}
    </div>
  );
}
