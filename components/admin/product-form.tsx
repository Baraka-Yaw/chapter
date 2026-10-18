"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProduct, saveProduct } from "@/lib/admin/actions";
import { slugify, type ProductInput } from "@/lib/admin/product-schema";
import { categories, sortSizes, statusLabel, type Pattern, type Product, type ProductStatus } from "@/lib/products";
import { ProductArt } from "../product-art";
import { PhotosInput } from "./photo-input";

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const PATTERNS: { id: Pattern; label: string }[] = [
  { id: "plain", label: "Plain" },
  { id: "stripes", label: "Stripes" },
  { id: "dots", label: "Dots" },
  { id: "tiedye", label: "Tie-dye" },
  { id: "collage", label: "Collage" },
  { id: "prism", label: "Geometric" },
  { id: "brush", label: "Brushstrokes" },
];
const STATUSES: ProductStatus[] = ["available", "preorder", "coming-soon"];

// One size of a colour with its stock. `original` is the saved count (null for a new size).
type SizeState = { size: string; qty: string; original: number | null };

type ColourState = {
  uid: string;
  // Existing keys never change, so saved bags and links keep working.
  key: string | null;
  name: string;
  price: string;
  salePrice: string;
  palette: [string, string, string];
  images: string[];
  sizes: SizeState[];
  soldOut: boolean;
};

const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"];

let uidCounter = 0;
const uid = () => `c${++uidCounter}`;

function fromProduct(p?: Product) {
  return {
    name: p?.name ?? "",
    slug: p?.slug ?? "",
    category: p?.category ?? categories[0].slug,
    collection: p?.collection ?? "",
    pattern: p?.pattern ?? ("plain" as Pattern),
    status: p?.status ?? ("available" as ProductStatus),
    description: p?.description ?? "",
    details: (p?.details ?? []).join("\n"),
    featured: !!p?.featured,
    colourways: (p?.colourways ?? []).map<ColourState>((c) => ({
      uid: uid(),
      key: c.id,
      name: c.name,
      // 0 means a draft colour without a price yet.
      price: c.price ? String(c.price) : "",
      salePrice: c.salePrice == null ? "" : String(c.salePrice),
      palette: c.palette,
      images: c.images ?? [],
      sizes: c.sizes.map((size) => {
        const n = c.inventory?.[size] ?? 0;
        return { size, qty: String(n), original: n };
      }),
      soldOut: !!c.soldOut,
    })),
  };
}

// A new colour starts with the previous colour's sizes (stock empty) so they needn't be retyped.
const blankColour = (sizes: string[] = DEFAULT_SIZES): ColourState => ({
  uid: uid(),
  key: null,
  name: "",
  price: "",
  salePrice: "",
  palette: ["#f4f2ee", "#111111", "#b8965a"],
  images: [],
  sizes: sizes.map((size) => ({ size, qty: "", original: null })),
  soldOut: false,
});

export function ProductForm({ product, uploadsEnabled }: { product?: Product; uploadsEnabled: boolean }) {
  const router = useRouter();
  const isNew = !product?.id;
  const [form, setForm] = useState(() => {
    const f = fromProduct(product);
    if (f.colourways.length === 0) f.colourways = [blankColour()];
    return f;
  });
  const [slugEdited, setSlugEdited] = useState(!isNew);
  const [customSize, setCustomSize] = useState<Record<string, string>>({});
  // Whether the saved product is live; changes only after a successful save.
  const [live, setLive] = useState(!isNew && !product?.draft);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setColour = (id: string, patch: Partial<ColourState>) =>
    setForm((f) => ({ ...f, colourways: f.colourways.map((c) => (c.uid === id ? { ...c, ...patch } : c)) }));

  function toInput(published: boolean): ProductInput {
    const used = new Set(form.colourways.flatMap((c) => (c.key ? [c.key] : [])));
    return {
      id: product?.id ?? null,
      name: form.name,
      slug: form.slug,
      category: form.category,
      collection: form.collection,
      pattern: form.pattern,
      status: form.status,
      description: form.description,
      details: form.details.split("\n").map((d) => d.trim()).filter(Boolean),
      featured: form.featured,
      published,
      // Rows left completely empty are skipped rather than saved.
      colourways: form.colourways.filter((c) => c.name.trim() || c.price.trim() || c.images.length).map((c) => {
        let key = c.key;
        if (!key) {
          // New colours get a key from their name, made unique within this product.
          const base = slugify(c.name) || "colour";
          key = base;
          for (let n = 2; used.has(key); n++) key = `${base}-${n}`;
          used.add(key);
        }
        return {
          key,
          name: c.name,
          price: c.price.trim() === "" ? null : Number(c.price),
          salePrice: c.salePrice.trim() === "" ? null : Number(c.salePrice),
          palette: c.palette,
          images: c.images,
          sizes: c.sizes.map((s) => ({ size: s.size, quantity: Math.max(0, Math.floor(Number(s.qty) || 0)), original: s.original })),
          soldOut: c.soldOut,
        };
      }),
    };
  }

  // The button pressed decides the outcome: "draft" keeps or moves the product out of the shop,
  // "publish" puts it live (after the server checks it's complete).
  function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const intent = ((e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value;
    const publish = intent === "publish";
    if (intent === "draft" && live && !confirm("Move this product to drafts? It will disappear from the shop until you publish it again.")) return;
    setMessage(null);
    const input = toInput(publish);
    // Which saved colour key each form row got (empty rows are skipped by toInput).
    const sent = form.colourways.filter((c) => c.name.trim() || c.price.trim() || c.images.length);
    const keys = new Map(sent.map((c, i) => [c.uid, input.colourways[i].key]));
    startTransition(async () => {
      const result = await saveProduct(input);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      if (isNew) {
        router.replace(`/admin/products/${result.data!.id}?saved=${publish ? "published" : "draft"}`);
        return;
      }
      setLive(publish);
      // What was saved is now the baseline: new colours keep their key, and stock counts become
      // the "original" so the next save only applies further changes.
      setForm((f) => ({
        ...f,
        colourways: f.colourways.map((c) => ({
          ...c,
          key: c.key ?? keys.get(c.uid) ?? null,
          sizes: c.sizes.map((s) => {
            const n = Math.max(0, Math.floor(Number(s.qty) || 0));
            return { ...s, qty: String(n), original: n };
          }),
        })),
      }));
      setMessage({
        tone: "ok",
        text: publish ? (live ? "Saved. The shop is updated." : "Published — it's live in the shop.") : "Draft saved. It isn't visible in the shop.",
      });
      // Drop any "?saved=…" notice from creating the product; it no longer describes the state.
      router.replace(`/admin/products/${product!.id}`, { scroll: false });
    });
  }

  function remove() {
    if (!product?.id || !confirm(`Delete “${product.name}”? Past orders keep their details.`)) return;
    startTransition(async () => {
      const result = await deleteProduct(product.id!);
      if (result.ok) router.push("/admin/products");
      else setMessage({ tone: "error", text: result.error });
    });
  }

  // Turning a size off asks first when it still has pieces, since saving removes them from inventory.
  function toggleSize(c: ColourState, size: string) {
    const existing = c.sizes.find((s) => s.size === size);
    if (existing) {
      const pieces = existing.original ?? 0;
      if (pieces > 0 && !confirm(`Remove size ${size} from ${c.name || "this colour"}? Its ${pieces} piece${pieces === 1 ? "" : "s"} will leave inventory when you save.`)) return;
      setColour(c.uid, { sizes: c.sizes.filter((s) => s.size !== size) });
      return;
    }
    const order = sortSizes([...c.sizes.map((s) => s.size), size]);
    const next = [...c.sizes, { size, qty: "", original: null }];
    setColour(c.uid, { sizes: order.map((o) => next.find((s) => s.size === o)!) });
  }

  const setQty = (c: ColourState, size: string, qty: string) =>
    setColour(c.uid, { sizes: c.sizes.map((s) => (s.size === size ? { ...s, qty } : s)) });

  function addCustomSize(c: ColourState) {
    const size = (customSize[c.uid] ?? "").trim().toUpperCase();
    if (size && !c.sizes.some((s) => s.size === size)) toggleSize(c, size);
    setCustomSize((v) => ({ ...v, [c.uid]: "" }));
  }

  return (
    <form onSubmit={save} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Section title="Basics">
          <Field label="Name">
            <input
              className={input}
              value={form.name}
              required
              maxLength={100}
              placeholder="e.g. Classic Stripe Shirt"
              onChange={(e) => {
                set("name", e.target.value);
                if (!slugEdited) set("slug", slugify(e.target.value));
              }}
            />
          </Field>
          <Field label="Web address" hint={`/product/${form.slug || "…"}`}>
            <input
              className={input}
              value={form.slug}
              required
              maxLength={120}
              onChange={(e) => {
                setSlugEdited(true);
                set("slug", slugify(e.target.value));
              }}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <select className={input} value={form.category} onChange={(e) => set("category", e.target.value as typeof form.category)}>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Release / collection" hint="Shown above the name">
              <input className={input} value={form.collection} maxLength={60} placeholder="e.g. Release 01" onChange={(e) => set("collection", e.target.value)} />
            </Field>
          </div>
          <Field label="Description">
            <textarea className={`${input} min-h-24`} value={form.description} maxLength={1000} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <Field label="Details" hint="One per line, e.g. “Camp collar, short sleeves”">
            <textarea className={`${input} min-h-28`} value={form.details} onChange={(e) => set("details", e.target.value)} />
          </Field>
        </Section>

        <Section title="Availability">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Status">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={form.status === s}
                onClick={() => set("status", s)}
                className={`rounded-full px-4 py-2 text-sm ${form.status === s ? "bg-ink text-cream" : "glass"}`}
              >
                {statusLabel[s]}
              </button>
            ))}
          </div>
          <p className="text-sm text-ink-soft">
            {form.status === "available" && "Ready to deliver — customers can order now."}
            {form.status === "preorder" && "Made to order — customers are told it's ready in about 2 weeks."}
            {form.status === "coming-soon" && "Shown in Next Release. Customers can't order yet; they tap “Notify me”."}
          </p>
          {form.status !== "coming-soon" && (
            <p className="rounded-xl bg-gold/10 px-4 py-3 text-sm text-ink-soft">
              {form.status === "preorder"
                ? "Pre-orders are a limited run: under each colour, enter how many you'll make of each size. Each order takes one; at 0 it shows Sold out."
                : "Under each colour, enter how many pieces you have of each size. Each order takes one; sizes at 0 show as Sold out."}
            </p>
          )}
          <div className="flex flex-wrap gap-6 pt-2">
            <Toggle label="Featured on home page" checked={form.featured} onChange={(v) => set("featured", v)} />
          </div>
        </Section>


        <Section
          title="Colours, sizes & stock"
          action={
            <button
              type="button"
              className="btn glass px-4! py-2!"
              onClick={() => set("colourways", [...form.colourways, blankColour(form.colourways.at(-1)?.sizes.map((s) => s.size))])}
            >
              + Add colour
            </button>
          }
        >
          <div className="space-y-4">
            {form.colourways.map((c, i) => (
              <div key={c.uid} className="grid gap-4 rounded-2xl border border-ink/10 p-4 sm:grid-cols-[120px_1fr]">
                <div className="w-28 overflow-hidden rounded-xl sm:w-full">
                  <ProductArt pattern={form.pattern} colourway={{ id: c.key ?? c.uid, name: c.name || "New colour", price: 0, palette: c.palette, sizes: [], images: c.images }} />
                </div>
                <div className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Colour name">
                      <input className={input} value={c.name} maxLength={60} placeholder="e.g. Black / White" onChange={(e) => setColour(c.uid, { name: e.target.value })} />
                    </Field>
                    <Field label="Price (GH₵)">
                      <input className={input} type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="Later" value={c.price} onChange={(e) => setColour(c.uid, { price: e.target.value })} />
                    </Field>
                    <Field label="Sale price (GH₵)" hint="Optional">
                      <input className={input} type="number" inputMode="decimal" min="0.01" step="0.01" value={c.salePrice} onChange={(e) => setColour(c.uid, { salePrice: e.target.value })} />
                    </Field>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs tracking-[0.16em] uppercase">Sizes &amp; stock</span>
                      <span className="text-xs text-ink-soft tabular-nums">
                        {c.sizes.reduce((n, s) => n + (Math.floor(Number(s.qty) || 0)), 0)} pieces
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5" aria-label={`Sizes for ${c.name || `colour ${i + 1}`}`}>
                      {[...new Set([...PRESET_SIZES, ...c.sizes.map((s) => s.size)])].map((size) => {
                        const on = c.sizes.some((s) => s.size === size);
                        return (
                          <button
                            key={size}
                            type="button"
                            aria-pressed={on}
                            onClick={() => toggleSize(c, size)}
                            className={`h-8 min-w-10 rounded-full px-2.5 text-xs transition ${on ? "bg-ink text-cream" : "glass text-ink-soft"}`}
                          >
                            {size}
                          </button>
                        );
                      })}
                      <span className="inline-flex items-center gap-1">
                        <input
                          className="glass h-8 w-20 rounded-full px-3 text-xs"
                          value={customSize[c.uid] ?? ""}
                          maxLength={12}
                          placeholder="Other"
                          aria-label="Other size"
                          onChange={(e) => setCustomSize((v) => ({ ...v, [c.uid]: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addCustomSize(c);
                            }
                          }}
                        />
                        <button type="button" onClick={() => addCustomSize(c)} className="h-8 rounded-full px-2 text-xs text-ink-soft underline">
                          Add
                        </button>
                      </span>
                    </div>
                    {c.sizes.length === 0 ? (
                      <p className="mt-3 text-sm text-ink-soft">Tap the sizes this colour comes in.</p>
                    ) : (
                      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {c.sizes.map((s) => {
                          const typed = Math.floor(Number(s.qty) || 0);
                          const diff = s.original === null ? null : typed - s.original;
                          return (
                            <label key={s.size} className="rounded-xl bg-ink/4 p-2 text-center">
                              <span className="block text-xs font-medium">{s.size}</span>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                inputMode="numeric"
                                placeholder="0"
                                value={s.qty}
                                aria-label={`${c.name || "Colour"} ${s.size}: pieces in stock`}
                                onChange={(e) => setQty(c, s.size, e.target.value)}
                                className="glass mt-1 w-full rounded-lg px-2 py-1.5 text-center text-sm tabular-nums"
                              />
                              <span className={`mt-1 block text-[0.65rem] ${diff ? (diff > 0 ? "text-[#1f7a4d]" : "text-[#c8402f]") : "text-ink-soft"}`}>
                                {s.original === null ? "new" : diff ? `${diff > 0 ? "+" : ""}${diff} on save` : "in stock"}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    {!isNew && <p className="mt-2 text-xs text-ink-soft">Changes are recorded in the Inventory history.</p>}
                  </div>

                  <PhotosInput enabled={uploadsEnabled} label={c.name || `colour ${i + 1}`} value={c.images} onChange={(images) => setColour(c.uid, { images })} />
                  {c.images.length === 0 && (
                    <div className="flex flex-wrap items-center gap-3 text-sm text-ink-soft">
                      <span>No photo yet — drawing colours:</span>
                      {c.palette.map((hex, n) => (
                        <input
                          key={n}
                          type="color"
                          aria-label={["Base", "Print", "Accent"][n]}
                          value={hex}
                          onChange={(e) => {
                            const palette = [...c.palette] as [string, string, string];
                            palette[n] = e.target.value;
                            setColour(c.uid, { palette });
                          }}
                          className="h-8 w-10 cursor-pointer rounded-lg border border-ink/10 bg-transparent"
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <Toggle label="Sold out" checked={c.soldOut} onChange={(soldOut) => setColour(c.uid, { soldOut })} />
                    {form.colourways.length > 1 && (
                      <button type="button" className="text-sm text-[#c8402f] underline" onClick={() => set("colourways", form.colourways.filter((x) => x.uid !== c.uid))}>
                        Remove colour
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Field label="Drawing style" hint="Used for colours without a photo">
            <select className={`${input} max-w-60`} value={form.pattern} onChange={(e) => set("pattern", e.target.value as Pattern)}>
              {PATTERNS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
        </Section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <div className="glass glass-thick space-y-3 rounded-[1.5rem] p-5">
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${live ? "bg-[#1f7a4d]/10 text-[#1f7a4d]" : "bg-gold/15 text-gold-deep"}`}>
            <span className={`h-2 w-2 rounded-full ${live ? "bg-[#1f7a4d]" : "bg-gold"}`} />
            {live ? "Published — live in the shop" : isNew ? "New product — not saved yet" : "Draft — not visible in the shop"}
          </div>
          {message && (
            <p role={message.tone === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${message.tone === "error" ? "bg-[#c8402f]/10 text-[#a5321f]" : "bg-[#1f7a4d]/10 text-[#1f7a4d]"}`}>
              {message.text}
            </p>
          )}
          {/* DOM order sets what Enter does (the first submit button): saving a draft, or saving a live product. */}
          {live ? (
            <div className="flex flex-col gap-2">
              <button type="submit" name="intent" value="publish" disabled={pending} className="btn btn-dark w-full">
                {pending ? "Saving…" : "Save changes"}
              </button>
              <button type="submit" name="intent" value="draft" disabled={pending} className="py-1 text-sm text-ink-soft underline">
                Move to drafts
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button type="submit" name="intent" value="draft" disabled={pending} className="btn glass order-2 w-full">
                {pending ? "Saving…" : "Save draft"}
              </button>
              <button type="submit" name="intent" value="publish" disabled={pending} className="btn btn-dark order-1 w-full">
                Publish
              </button>
              <p className="order-3 text-xs text-ink-soft">Drafts can be unfinished — prices, sizes and stock can wait. Publishing needs every colour to have a price and at least one size.</p>
            </div>
          )}
          {live && (
            <Link href={`/product/${product!.slug}`} target="_blank" className="btn glass w-full">
              View in shop ↗
            </Link>
          )}
          {!isNew && (
            <button type="button" onClick={remove} disabled={pending} className="w-full py-2 text-sm text-[#c8402f] underline">
              Delete product
            </button>
          )}
        </div>
      </aside>
    </form>
  );
}

const input = "glass w-full rounded-xl px-4 py-2.5 text-sm";

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="glass glass-thick space-y-4 rounded-[1.5rem] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs tracking-[0.16em] uppercase">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-ink" : "bg-ink/15"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
      </button>
      {label}
    </label>
  );
}
