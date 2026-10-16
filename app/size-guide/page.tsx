import type { Metadata } from "next";

export const metadata: Metadata = { title: "Size Guide" };

// Placeholder measurements (inches) — replace with Eddy's real chart.
const shirtChart = [
  ["S", "38–40", "28", "8"],
  ["M", "40–42", "29", "8.5"],
  ["L", "42–44", "30", "9"],
  ["XL", "44–46", "31", "9.5"],
  ["XXL", "46–48", "32", "10"],
];

export default function SizeGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <div className="text-center">
        <p className="eyebrow">Help</p>
        <h1 className="mt-2 font-display text-4xl">Size guide</h1>
        <span className="brush mt-3" />
        <p className="mt-6 text-ink-soft">Shirts have a relaxed fit. Between sizes? Take the smaller one for a neater look.</p>
      </div>

      <h2 className="mt-12 font-display text-xl tracking-wider">Shirts (inches)</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="bg-ink text-left text-cream">
              {["Size", "Chest", "Length", "Sleeve"].map((h) => (
                <th key={h} className="px-4 py-3 font-normal tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shirtChart.map((row) => (
              <tr key={row[0]} className="odd:bg-cream-deep">
                {row.map((cell, i) => (
                  <td key={i} className="px-4 py-3">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-sm text-ink-soft">Need a custom fit? Add your measurements in the order note at checkout.</p>
    </div>
  );
}
