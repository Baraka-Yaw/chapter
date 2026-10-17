"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setProductPublished } from "@/lib/admin/actions";

// Quick publish / unpublish from the product list. Publishing an unfinished draft is refused with the reason.
export function PublishToggle({ id, published }: { id: string; published: boolean }) {
  const router = useRouter();
  const [isLive, setIsLive] = useState(published);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={isLive}
        aria-label={isLive ? "Live in shop — tap to move to drafts" : "Draft — tap to publish"}
        title={isLive ? "Live in shop" : "Draft"}
        disabled={pending}
        onClick={() => {
          const next = !isLive;
          setError(null);
          setIsLive(next);
          startTransition(async () => {
            const result = await setProductPublished(id, next);
            if (!result.ok) {
              setIsLive(!next);
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
        className={`relative h-7 w-12 rounded-full transition ${isLive ? "bg-[#1f7a4d]" : "bg-ink/15"}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${isLive ? "left-6" : "left-1"}`} />
      </button>
      {error && (
        <p role="alert" className="max-w-48 text-right text-xs text-[#c8402f]">
          {error}
        </p>
      )}
    </div>
  );
}
