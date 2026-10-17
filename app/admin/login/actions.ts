"use server";

import { redirect } from "next/navigation";
import { endSession, startSession } from "@/lib/admin/session";
import { passwordMatches } from "@/lib/admin/token";

export type LoginState = { error?: string };

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const password = String(form.get("password") ?? "");
  if (!passwordMatches(password)) {
    // Slow down guessing.
    await new Promise((r) => setTimeout(r, 800));
    return { error: "That password isn't right." };
  }
  await startSession();
  const next = String(form.get("next") ?? "");
  // Only return to admin pages, never an outside URL.
  redirect(next.startsWith("/admin/") ? next : "/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}
