import type { Metadata } from "next";
import { CheckoutForm } from "@/components/shop/checkout-form";

export const metadata: Metadata = { title: "Đặt hàng", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <section className="px-4 py-8 md:py-10">
      <div className="mx-auto max-w-[1000px]">
        <h1 className="mb-6 text-[32px] font-extrabold md:text-[40px]">Đặt hàng</h1>
        <CheckoutForm />
      </div>
    </section>
  );
}
