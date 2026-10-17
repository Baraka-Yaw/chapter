import type { Metadata } from "next";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10 text-center">
        <p className="eyebrow">Checkout</p>
        <h1 className="mt-2 font-display text-4xl">Place your order</h1>
        <span className="brush mt-3" />
      </div>
      <CheckoutForm />
    </div>
  );
}
