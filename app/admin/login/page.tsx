import type { Metadata } from "next";
import { Suspense } from "react";
import { LogoMark } from "@/components/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="glass glass-thick w-full max-w-sm rounded-[2rem] p-8 text-center">
        <LogoMark className="mx-auto h-14 w-14" />
        <p className="eyebrow mt-4">Chapter O Wear</p>
        <h1 className="mt-2 font-display text-2xl">Shop admin</h1>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
