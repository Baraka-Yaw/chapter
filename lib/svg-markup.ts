import { isValidElement, type ReactNode } from "react";

// Turns a small, hook-free SVG element tree (like ShirtArt) into SVG markup, for places where
// react-dom/server isn't allowed, such as share images.
const kebab = new Set(["strokeWidth", "strokeLinecap", "strokeLinejoin", "strokeOpacity", "fillOpacity", "fillRule", "clipPath", "clipRule", "stopColor", "stopOpacity"]);
const skip = new Set(["children", "key", "className", "role"]);

const escape = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function svgMarkup(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return escape(String(node));
  if (Array.isArray(node)) return node.map(svgMarkup).join("");
  if (!isValidElement<Record<string, unknown>>(node)) return "";
  const { type, props } = node;
  if (typeof type === "function") return svgMarkup((type as (p: unknown) => ReactNode)(props));
  if (typeof type !== "string") return svgMarkup(props.children as ReactNode);
  const attrs = Object.entries(props)
    .filter(([k, v]) => !skip.has(k) && !k.startsWith("aria-") && v != null && v !== false)
    .map(([k, v]) => ` ${kebab.has(k) ? k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`) : k}="${escape(String(v))}"`)
    .join("");
  return `<${type}${attrs}>${svgMarkup(props.children as ReactNode)}</${type}>`;
}
