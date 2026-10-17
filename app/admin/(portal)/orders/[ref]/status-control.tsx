"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setOrderStatus } from "@/lib/admin/actions";
import { orderStatuses, orderStatusHint, orderStatusLabel, type OrderStatus } from "@/lib/admin/order-status";

export function StatusControl({ orderRef, status }: { orderRef: string; status: OrderStatus }) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(next: OrderStatus) {
    if (next === current) return;
    if (next === "cancelled" && !confirm(`Cancel order ${orderRef}?`)) return;
    const previous = current;
    setCurrent(next);
    setError(null);
    startTransition(async () => {
      const result = await setOrderStatus(orderRef, next);
      if (!result.ok) {
        setCurrent(previous);
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Order status">
        {orderStatuses.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={current === s}
            disabled={pending}
            onClick={() => choose(s)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              current === s ? (s === "cancelled" ? "bg-[#c8402f] text-white" : "bg-ink text-cream") : "glass"
            }`}
          >
            {orderStatusLabel[s]}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-ink-soft">{orderStatusHint[current]}</p>
      {error && <p className="mt-2 text-sm text-[#c8402f]">{error}</p>}
    </div>
  );
}
