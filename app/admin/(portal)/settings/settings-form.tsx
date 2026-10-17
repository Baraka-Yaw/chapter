"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { slugify } from "@/lib/admin/product-schema";
import { saveShopSettings } from "@/lib/admin/actions";
import type { ShopSettings } from "@/lib/settings-schema";
import { toWhatsAppNumber } from "@/lib/whatsapp";

type Zone = { uid: string; id: string | null; label: string; fee: string };
let n = 0;
const uid = () => `z${++n}`;

export function SettingsForm({ initial }: { initial: ShopSettings }) {
  const router = useRouter();
  const [s, setS] = useState({
    ...initial,
    whatsappTyped: initial.phoneDisplay,
    zones: initial.deliveryZones.map<Zone>((z) => ({ uid: uid(), id: z.id, label: z.label, fee: String(z.fee) })),
    payments: initial.paymentOptions.map((p) => ({ uid: uid(), label: p })),
  });
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof typeof s>(key: K, value: (typeof s)[K]) => setS((prev) => ({ ...prev, [key]: value }));

  function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const used = new Set(s.zones.flatMap((z) => (z.id ? [z.id] : [])));
    const payload: ShopSettings = {
      // The number customers see is also the one orders go to.
      whatsapp: toWhatsAppNumber(s.whatsappTyped),
      phoneDisplay: s.whatsappTyped.trim(),
      instagram: s.instagram.replace(/^@/, "").trim(),
      tiktok: s.tiktok.replace(/^@/, "").trim(),
      location: s.location,
      preorderNotice: s.preorderNotice,
      deliveryZones: s.zones.map((z) => {
        let id = z.id;
        if (!id) {
          const base = slugify(z.label) || "area";
          id = base;
          for (let i = 2; used.has(id); i++) id = `${base}-${i}`;
          used.add(id);
        }
        return { id, label: z.label, fee: Number(z.fee || 0) };
      }),
      paymentOptions: s.payments.map((p) => p.label.trim()).filter(Boolean),
    };
    startTransition(async () => {
      const result = await saveShopSettings(payload);
      if (!result.ok) return setMessage({ tone: "error", text: result.error });
      setMessage({ tone: "ok", text: "Saved. The shop is updated." });
      router.refresh();
    });
  }

  return (
    <form onSubmit={save} className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Section title="Contact" hint="Orders are sent to this WhatsApp number.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="WhatsApp number">
              <input className={input} type="tel" required value={s.whatsappTyped} placeholder="055 967 2901" onChange={(e) => set("whatsappTyped", e.target.value)} />
            </Field>
            <Field label="Location">
              <input className={input} value={s.location} maxLength={60} placeholder="Accra, Ghana" onChange={(e) => set("location", e.target.value)} />
            </Field>
            <Field label="Instagram">
              <input className={input} value={s.instagram} maxLength={40} placeholder="chapterowear" onChange={(e) => set("instagram", e.target.value)} />
            </Field>
            <Field label="TikTok">
              <input className={input} value={s.tiktok} maxLength={40} placeholder="chapterowear" onChange={(e) => set("tiktok", e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="Notice bar" hint="The line at the very top of the shop. Leave empty to hide it.">
          <input className={input} value={s.preorderNotice} maxLength={160} onChange={(e) => set("preorderNotice", e.target.value)} />
        </Section>

        <Section title="Delivery areas" hint="Customers pick one at checkout. A fee of 0 shows as free or “confirmed on WhatsApp”.">
          <div className="space-y-2">
            {s.zones.map((z) => (
              <div key={z.uid} className="flex items-center gap-2">
                <input
                  className={`${input} flex-1`}
                  value={z.label}
                  required
                  maxLength={80}
                  aria-label="Area name"
                  placeholder="e.g. Accra – East Legon"
                  onChange={(e) => set("zones", s.zones.map((x) => (x.uid === z.uid ? { ...x, label: e.target.value } : x)))}
                />
                <div className="relative w-32">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-ink-soft">GH₵</span>
                  <input
                    className={`${input} pl-12`}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    aria-label="Fee"
                    value={z.fee}
                    onChange={(e) => set("zones", s.zones.map((x) => (x.uid === z.uid ? { ...x, fee: e.target.value } : x)))}
                  />
                </div>
                <RemoveButton disabled={s.zones.length <= 1} onClick={() => set("zones", s.zones.filter((x) => x.uid !== z.uid))} />
              </div>
            ))}
          </div>
          <button type="button" className="btn glass px-4! py-2!" onClick={() => set("zones", [...s.zones, { uid: uid(), id: null, label: "", fee: "0" }])}>
            + Add area
          </button>
        </Section>

        <Section title="Payment options" hint="Shown at checkout. Payment itself happens on WhatsApp.">
          <div className="space-y-2">
            {s.payments.map((p) => (
              <div key={p.uid} className="flex items-center gap-2">
                <input
                  className={`${input} flex-1`}
                  value={p.label}
                  required
                  maxLength={40}
                  aria-label="Payment option"
                  onChange={(e) => set("payments", s.payments.map((x) => (x.uid === p.uid ? { ...x, label: e.target.value } : x)))}
                />
                <RemoveButton disabled={s.payments.length <= 1} onClick={() => set("payments", s.payments.filter((x) => x.uid !== p.uid))} />
              </div>
            ))}
          </div>
          {s.payments.length < 6 && (
            <button type="button" className="btn glass px-4! py-2!" onClick={() => set("payments", [...s.payments, { uid: uid(), label: "" }])}>
              + Add option
            </button>
          )}
        </Section>
      </div>

      <aside className="xl:sticky xl:top-6 xl:self-start">
        <div className="glass glass-thick space-y-3 rounded-[1.5rem] p-5">
          {message && (
            <p role={message.tone === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${message.tone === "error" ? "bg-[#c8402f]/10 text-[#a5321f]" : "bg-[#1f7a4d]/10 text-[#1f7a4d]"}`}>
              {message.text}
            </p>
          )}
          <button type="submit" disabled={pending} className="btn btn-dark w-full">
            {pending ? "Saving…" : "Save settings"}
          </button>
        </div>
      </aside>
    </form>
  );
}

const input = "glass w-full rounded-xl px-4 py-2.5 text-sm";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="glass glass-thick space-y-4 rounded-[1.5rem] p-5 sm:p-6">
      <div>
        <h2 className="font-display text-xl">{title}</h2>
        {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs tracking-[0.16em] uppercase">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function RemoveButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label="Remove" className="h-10 w-10 shrink-0 rounded-full text-xl text-ink-soft hover:bg-ink/8 disabled:opacity-30">
      ×
    </button>
  );
}
