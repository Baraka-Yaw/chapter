import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ADMIN_COOKIE, createToken, verifyToken } from "./token";

export async function startSession() {
  const { token, expires } = createToken();
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function endSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin() {
  // Admin pages are per-request: the expiry check and dashboard date ranges use the current time.
  await connection();
  return verifyToken((await cookies()).get(ADMIN_COOKIE)?.value);
}

// Product photo uploads need a Vercel Blob store connected to the project.
export function uploadsEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

// Every admin page and action calls this; proxy.ts is only the first gate.
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
