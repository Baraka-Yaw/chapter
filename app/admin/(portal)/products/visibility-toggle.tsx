"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setProductHidden } from "@/lib/admin/actions";

export function VisibilityToggle({ id, hidden }: { id: string; hidden: boolean }) {
  const router = useRouter();
  const [isHidden, setIsHidden] = useState(hidden);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={!isHidden}
      aria-label={isHidden ? "Hidden from shop — tap to show" : "Visible in shop — tap to hide"}
      title={isHidden ? "Hidden from shop" : "Visible in shop"}
      disabled={pending}
      onClick={() => {
        const next = !isHidden;
        setIsHidden(next);
        startTransition(async () => {
          const result = await setProductHidden(id, next);
          if (!result.ok) setIsHidden(!next);
          router.refresh();
        });
      }}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${isHidden ? "bg-ink/15" : "bg-[#1f7a4d]"}`}
    >
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${isHidden ? "left-1" : "left-6"}`} />
    </button>
  );
}
