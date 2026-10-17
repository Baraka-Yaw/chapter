import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminNav, AdminNavView } from "@/components/admin/nav";

// Admin pages are private and per-request; letting them wait for the server is fine.
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Chapter O admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Suspense fallback={<AdminNavView pathname={null} />}>
        <AdminNav />
      </Suspense>
      <main className="min-w-0 flex-1 px-4 pt-4 pb-16 md:px-10 md:pt-10">
        {/* Pages read the session cookie, so they stream in behind this boundary. */}
        <Suspense fallback={<AdminSkeleton />}>{children}</Suspense>
      </main>
    </div>
  );
}

function AdminSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true">
      <div className="h-10 w-56 rounded-full bg-cream-deep" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-[1.5rem] bg-cream-deep" />
        ))}
      </div>
      <div className="h-64 rounded-[1.5rem] bg-cream-deep" />
    </div>
  );
}
