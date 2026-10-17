import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/session";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./settings-form";

// Private per-request page; navigation may wait for the server (see the admin layout).
export const instant = false;

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getSettings();
  return (
    <>
      <PageHeader eyebrow="Shop" title="Settings" />
      <SettingsForm initial={settings} />
    </>
  );
}
