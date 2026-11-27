import type { Metadata } from "next";
import { OrderSuccess } from "@/components/shop/order-success";
import { getSettings } from "@/lib/catalog";

export const metadata: Metadata = { title: "Đặt hàng thành công", robots: { index: false } };

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ ma?: string }> }) {
  const [{ ma }, settings] = await Promise.all([searchParams, getSettings()]);
  const code = /^TC-[0-9A-Z]{5}$/.test(ma ?? "") ? ma! : null;
  return (
    <section className="px-4 py-10 md:py-14">
      <div className="mx-auto max-w-[620px]">
        <OrderSuccess code={code} zaloPhone={settings.zalo_phone} />
      </div>
    </section>
  );
}
