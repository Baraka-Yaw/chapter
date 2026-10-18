"use client";

import { upload } from "@vercel/blob/client";
import Image from "next/image";
import { useRef, useState } from "react";

export const MAX_PHOTOS = 5;
const MAX_MB = 8;

// Up to five photos for one colour, uploaded straight from the browser to Vercel Blob
// (/api/admin/upload signs each request). The first photo is the cover.
export function PhotosInput({
  value,
  onChange,
  label,
  enabled,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  label: string;
  enabled: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number; pct: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pick(files: File[]) {
    setError(null);
    const room = MAX_PHOTOS - value.length;
    if (files.length > room) setError(`Only ${MAX_PHOTOS} photos per colour — the first ${room} were added.`);
    const chosen = files.slice(0, room);
    const bad = chosen.find((f) => !f.type.startsWith("image/") || f.size > MAX_MB * 1024 * 1024);
    if (bad) {
      setError(bad.type.startsWith("image/") ? `Photos must be under ${MAX_MB} MB.` : "Choose photos (JPG, PNG or WebP).");
      return;
    }
    const urls = [...value];
    try {
      for (const [i, file] of chosen.entries()) {
        setUploading({ done: i, total: chosen.length, pct: 0 });
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const blob = await upload(`products/${Date.now()}-${i}.${ext}`, file, {
          access: "public",
          handleUploadUrl: "/api/admin/upload",
          onUploadProgress: ({ percentage }) => setUploading({ done: i, total: chosen.length, pct: percentage }),
        });
        urls.push(blob.url);
        onChange([...urls]);
      }
    } catch {
      setError("An upload failed. Check your connection and try again.");
    } finally {
      setUploading(null);
      if (input.current) input.current.value = "";
    }
  }

  const remove = (url: string) => onChange(value.filter((u) => u !== url));
  const makeCover = (url: string) => onChange([url, ...value.filter((u) => u !== url)]);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs tracking-[0.16em] uppercase">Photos</span>
        <span className="text-xs text-ink-soft">
          {value.length}/{MAX_PHOTOS} · first is the cover
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {value.map((url, i) => (
          <figure key={url} className="group relative w-20 overflow-hidden rounded-xl ring-1 ring-ink/10">
            <div className="relative aspect-[5/6] bg-cream-deep">
              <Image src={url} alt={`${label} photo ${i + 1}`} fill sizes="80px" className="object-cover" />
            </div>
            {i === 0 && (
              <figcaption className="absolute bottom-1 left-1 rounded-full bg-night/70 px-1.5 py-0.5 text-[0.6rem] tracking-wider text-paper uppercase">
                Cover
              </figcaption>
            )}
            <button
              type="button"
              onClick={() => remove(url)}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-night/70 text-sm text-paper"
            >
              ×
            </button>
            {i > 0 && (
              <button
                type="button"
                onClick={() => makeCover(url)}
                className="absolute inset-x-1 bottom-1 rounded-full bg-paper/90 py-0.5 text-[0.6rem] tracking-wider text-night uppercase opacity-0 transition group-hover:opacity-100 focus:opacity-100"
              >
                Make cover
              </button>
            )}
          </figure>
        ))}

        {enabled && value.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={uploading !== null}
            className="flex aspect-[5/6] w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink/25 text-xs text-ink-soft transition hover:border-ink hover:text-ink"
          >
            {uploading ? (
              <span className="px-1 text-center">
                {uploading.done + 1}/{uploading.total}
                <br />
                {Math.round(uploading.pct)}%
              </span>
            ) : (
              <>
                <span className="text-xl leading-none">+</span>
                Add photo
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        aria-label={`Add photos for ${label}`}
        onChange={(e) => e.target.files && pick([...e.target.files])}
      />
      {!enabled && (
        <p className="mt-2 text-sm text-ink-soft">Photo uploads aren&apos;t switched on yet — they need photo storage (Vercel Blob) connected to the shop.</p>
      )}
      {error && <p className="mt-2 text-sm text-[#c8402f]">{error}</p>}
    </div>
  );
}
