import Image from "next/image";
import { useId } from "react";
import type { Colourway, Pattern } from "@/lib/products";

// Placeholder product picture: a shirt on a mannequin, drawn in the
// colourway's palette. A colourway with photos shows its first (cover) photo instead.
export function ProductArt({
  pattern,
  colourway,
  className = "",
  priority = false,
}: {
  pattern: Pattern;
  colourway: Colourway;
  className?: string;
  priority?: boolean;
}) {
  const uid = useId().replace(/:/g, "");

  const photo = colourway.images?.[0];
  if (photo) {
    return (
      <div className={`relative aspect-[5/6] overflow-hidden bg-art ${className}`}>
        <Image src={photo} alt={colourway.name} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover" priority={priority} />
      </div>
    );
  }

  const [base, print, accent] = colourway.palette;
  const ink = "#111111";

  if (pattern === "plain") {
    return (
      <svg viewBox="0 0 300 360" className={`aspect-[5/6] w-full bg-art ${className}`} role="img" aria-label={colourway.name}>
        <Mannequin />
        <path
          d="M108 70 Q150 92 192 70 L250 96 L236 150 L210 140 L212 318 L88 318 L90 140 L64 150 L50 96 Z"
          fill={base}
          stroke="#00000022"
          strokeWidth="1.5"
        />
        <path d="M118 72 Q150 90 182 72" fill="none" stroke="#00000033" strokeWidth="3" />
      </svg>
    );
  }

  const leftPanel = "M95 62 L130 52 L140 92 L140 320 L82 320 L85 115 Z";
  const rightPanel = "M205 62 L170 52 L160 92 L160 320 L218 320 L215 115 Z";

  return (
    <svg viewBox="0 0 300 360" className={`aspect-[5/6] w-full bg-art ${className}`} role="img" aria-label={colourway.name}>
      <defs>
        <clipPath id={`panels-${uid}`}>
          <path d={leftPanel} />
          <path d={rightPanel} />
        </clipPath>
        <filter id={`soft-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      <Mannequin />

      {/* Sleeves and back: solid black, like the posters. */}
      <polygon points="95,62 45,85 25,150 68,160 85,115" fill={ink} />
      <polygon points="205,62 255,85 275,150 232,160 215,115" fill={ink} />
      <path d="M95 62 L205 62 L218 320 L82 320 Z" fill={ink} />

      {/* White tee showing through the open front. */}
      <path d="M128 54 Q150 74 172 54 L162 320 L138 320 Z" fill="#fbfaf7" />

      <g clipPath={`url(#panels-${uid})`}>
        <rect x="80" y="40" width="140" height="290" fill={base} />
        <PatternFill pattern={pattern} print={print} accent={accent} base={base} blurId={`soft-${uid}`} />
      </g>

      {/* Camp collar */}
      <polygon points="130,52 110,60 126,112 141,93" fill={ink} />
      <polygon points="170,52 190,60 174,112 159,93" fill={ink} />

      {[130, 170, 210, 250, 290].map((y) => (
        <circle key={y} cx="157" cy={y} r="2.4" fill={ink} opacity="0.8" />
      ))}
    </svg>
  );
}

function Mannequin() {
  return (
    <g>
      <ellipse cx="150" cy="26" rx="17" ry="21" fill="#111" />
      <ellipse cx="144" cy="18" rx="5" ry="8" fill="#ffffff" opacity="0.18" />
      <rect x="142" y="42" width="16" height="16" fill="#111" />
      <rect x="146" y="318" width="8" height="30" fill="#111" />
    </g>
  );
}

function PatternFill({
  pattern,
  base,
  print,
  accent,
  blurId,
}: {
  pattern: Pattern;
  base: string;
  print: string;
  accent: string;
  blurId: string;
}) {
  switch (pattern) {
    case "stripes":
      return (
        <g>
          {Array.from({ length: 10 }, (_, i) => (
            <rect key={i} x={80 + i * 14} y="40" width="7" height="290" fill={print} />
          ))}
        </g>
      );
    case "dots":
      return (
        <g>
          {Array.from({ length: 40 }, (_, i) => (
            <line key={`t${i}`} x1={80 + ((i * 37) % 140)} y1={40 + ((i * 53) % 290)} x2={92 + ((i * 37) % 140)} y2={46 + ((i * 53) % 290)} stroke={print} strokeWidth="1" opacity="0.25" />
          ))}
          {[
            [100, 80], [128, 120], [96, 165], [124, 215], [98, 265], [126, 300],
            [180, 78], [204, 125], [176, 170], [202, 220], [178, 268], [206, 305],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="14" fill={print} />
          ))}
        </g>
      );
    case "tiedye":
      return (
        <g filter={`url(#${blurId})`}>
          {[
            [100, 90, 22], [130, 150, 18], [95, 210, 26], [125, 280, 20],
            [190, 100, 24], [170, 170, 16], [205, 230, 22], [180, 295, 18],
          ].map(([cx, cy, r], i) => (
            <ellipse key={i} cx={cx} cy={cy} rx={r} ry={r * 1.4} fill={print} opacity={0.75} transform={`rotate(${i * 23} ${cx} ${cy})`} />
          ))}
        </g>
      );
    case "collage":
      return (
        <g>
          {[
            [82, 70, 40, 60, print], [118, 100, 26, 50, accent], [84, 150, 50, 36, "#3b3b3b"],
            [100, 200, 36, 70, accent], [84, 270, 56, 50, print],
            [166, 60, 48, 50, "#3b3b3b"], [172, 120, 40, 66, print], [190, 200, 28, 44, accent],
            [164, 240, 50, 40, print], [180, 285, 40, 40, "#3b3b3b"],
          ].map(([x, y, w, h, fill], i) => (
            <rect key={i} x={x as number} y={y as number} width={w as number} height={h as number} fill={fill as string} opacity="0.85" />
          ))}
          {[[96, 130, 130, 140], [176, 210, 204, 250]].map(([x1, y1, x2, y2], i) => (
            <line key={`l${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={base} strokeWidth="2" />
          ))}
        </g>
      );
    case "prism":
      return (
        <g>
          {[
            "82,60 130,60 106,110", "110,110 140,160 82,170", "84,190 130,210 96,250",
            "120,240 140,300 90,300", "100,140 120,170 90,180",
            "160,60 218,70 180,120", "200,120 218,180 166,160", "162,200 210,210 180,260",
            "190,260 218,320 160,310",
          ].map((points, i) => (
            <polygon key={i} points={points} fill={i % 4 === 1 ? accent : print} opacity={i % 3 === 2 ? 0.45 : 0.95} />
          ))}
        </g>
      );
    case "brush":
      return (
        <g fill="none" strokeLinecap="round">
          <path d="M84 80 Q120 60 140 110" stroke={print} strokeWidth="18" />
          <path d="M86 180 Q110 140 138 190" stroke={print} strokeWidth="12" opacity="0.8" />
          <path d="M90 250 Q130 230 136 290" stroke={accent} strokeWidth="14" />
          <path d="M162 90 Q200 120 216 80" stroke={accent} strokeWidth="16" />
          <path d="M164 170 Q190 210 216 160" stroke={print} strokeWidth="20" />
          <path d="M168 260 Q196 240 214 300" stroke={print} strokeWidth="10" opacity="0.7" />
        </g>
      );
    default:
      return null;
  }
}
