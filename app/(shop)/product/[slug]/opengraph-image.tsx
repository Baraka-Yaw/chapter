import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { ShirtArt } from "@/components/product-art";
import { getShopProduct } from "@/lib/catalog";
import { statusLabel, type Colourway, type Product } from "@/lib/products";
import { siteUrl } from "@/lib/site";
import { shareLine } from "@/lib/share";
import { svgMarkup } from "@/lib/svg-markup";
import { brand } from "@/lib/store-config";

// The picture shown when a product link is shared on WhatsApp, Facebook, X and the like:
// the cover photo (or drawn art) beside the name, the price and an "Order on WhatsApp" button.

export const alt = `${brand.name} product`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Noto Sans has the cedi sign (₵); Cinzel matches the shop's headings.
const fontDir = join(process.cwd(), "assets/fonts");
const [cinzel, noto, notoBold] = await Promise.all([
  readFile(join(fontDir, "Cinzel-Medium.ttf")),
  readFile(join(fontDir, "NotoSans-Regular.ttf")),
  readFile(join(fontDir, "NotoSans-Bold.ttf")),
]);

const cream = "#f5f1ea";
const gold = "#b8965a";
const ink = "#111111";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getShopProduct((await params).slug);
  const picture = product ? await pictureFor(product) : null;
  const price = product ? shareLine(product) : "";
  const host = siteUrl().replace(/^https?:\/\//, "");

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: cream, fontFamily: "Noto Sans", color: ink }}>
        <div style={{ display: "flex", width: 504, height: 630, background: "#ebe4d8" }}>
          {picture && <img src={picture} width={504} height={630} alt="" style={{ objectFit: "cover" }} />}
        </div>

        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "56px 60px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 22, letterSpacing: 6, color: gold }}>
            <span style={{ fontFamily: "Cinzel" }}>{brand.name.toUpperCase()}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
            <div style={{ display: "flex", fontFamily: "Cinzel", fontSize: titleSize(product?.name ?? brand.name), lineHeight: 1.1 }}>
              {product?.name ?? brand.name}
            </div>
            {price && <div style={{ display: "flex", marginTop: 22, fontSize: 52, fontWeight: 700 }}>{price}</div>}
            {product && (
              <div style={{ display: "flex", marginTop: 10, fontSize: 24, color: "#5c5650" }}>
                {statusLine(product)}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div
              style={{
                display: "flex",
                background: ink,
                color: cream,
                borderRadius: 999,
                padding: "18px 36px",
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              Order on WhatsApp
            </div>
            <div style={{ display: "flex", fontSize: 22, color: "#5c5650" }}>{host}</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Cinzel", data: cinzel, weight: 400, style: "normal" },
        { name: "Noto Sans", data: noto, weight: 400, style: "normal" },
        { name: "Noto Sans", data: notoBold, weight: 700, style: "normal" },
      ],
    },
  );
}

function statusLine(p: Product) {
  return p.colourways.length > 1 ? `${statusLabel[p.status]} · ${p.colourways.length} colours` : statusLabel[p.status];
}

function titleSize(name: string) {
  return name.length > 28 ? 50 : name.length > 18 ? 60 : 72;
}

// The first colour's cover photo as a data URI, or its drawn art when it has no photo
// (or the photo is a format the image renderer can't read, like WebP).
async function pictureFor(product: Product) {
  const colour = product.colourways[0];
  if (!colour) return null;
  const photo = colour.images?.[0];
  if (photo) {
    try {
      const res = await fetch(photo);
      const type = res.headers.get("content-type") ?? "";
      if (res.ok && /image\/(jpeg|png)/.test(type)) {
        return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
      }
    } catch {
      // Fall through to the drawn art.
    }
  }
  return drawnArt(product, colour);
}

function drawnArt(product: Product, colour: Colourway) {
  const svg = svgMarkup(<ShirtArt pattern={product.pattern} colourway={colour} uid="og" />).replace(
    "<svg ",
    '<svg xmlns="http://www.w3.org/2000/svg" width="504" height="605" ',
  );
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
