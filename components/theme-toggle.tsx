"use client";

import { useEffect, useState } from "react";

export type ThemePref = "light" | "dark" | "system";

export const THEME_KEY = "chapter-o-theme";

// Runs in <head> before paint so a stored choice never flashes the wrong theme.
// "system" stores nothing and leaves the attribute off, so the CSS media query decides.
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

const order: ThemePref[] = ["light", "dark", "system"];
const label: Record<ThemePref, string> = { light: "Light", dark: "Dark", system: "System" };

function apply(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", pref);
  try {
    if (pref === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, pref);
  } catch {
    // Storage blocked: the choice still applies for this visit.
  }
}

export function ThemeToggle() {
  const [pref, setPref] = useState<ThemePref | null>(null);

  useEffect(() => {
    const stored = document.documentElement.getAttribute("data-theme");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPref(stored === "light" || stored === "dark" ? stored : "system");
  }, []);

  const current = pref ?? "system";
  const next = order[(order.indexOf(current) + 1) % order.length];

  return (
    <button
      type="button"
      onClick={() => {
        apply(next);
        setPref(next);
      }}
      className="group relative flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-ink/8"
      aria-label={`Theme: ${label[current]}. Switch to ${label[next]}`}
      title={`Theme: ${label[current]}`}
    >
      {/* Render nothing theme-specific until mounted, so server and client markup match. */}
      <span className={`transition duration-300 ${pref ? "scale-100 rotate-0 opacity-100" : "scale-75 opacity-0"}`} key={current}>
        {current === "light" && <SunIcon />}
        {current === "dark" && <MoonIcon />}
        {current === "system" && <SystemIcon />}
      </span>
    </button>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  className: "h-[22px] w-[22px]",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  "aria-hidden": true,
};

function SunIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
      <path d="M12 7a3 3 0 0 0 0 6z" fill="currentColor" stroke="none" />
    </svg>
  );
}
