"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { startTracking } from "@/lib/admin/actions";

export function StartTrackingButton({ productId, name }: { productId: string; name: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm(`Start tracking inventory for “${name}”? Every colour and size starts at 0 — use Restock to add pieces. Sizes at 0 show as sold out in the shop.`)) return;
          start(async () => {
            const result = await startTracking(productId);
            if (!result.ok) return setError(result.error);
            router.refresh();
          });
        }}
        className="btn btn-dark px-4! py-2!"
      >
        {pending ? "Starting…" : "Start tracking"}
      </button>
      {error && <p className="text-xs text-[#c8402f]">{error}</p>}
    </div>
  );
}
