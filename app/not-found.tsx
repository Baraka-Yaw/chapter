import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 font-display text-3xl">This chapter doesn&apos;t exist</h1>
      <Link href="/shop" className="btn btn-dark mt-8">Back to the shop</Link>
    </div>
  );
}
