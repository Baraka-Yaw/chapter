"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const next = useSearchParams().get("next") ?? "";
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="mt-8 space-y-4 text-left">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="text-xs tracking-[0.18em] uppercase">Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          autoFocus
          className="glass mt-2 w-full rounded-xl px-4 py-3"
        />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-[#c8402f]">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn btn-dark w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
