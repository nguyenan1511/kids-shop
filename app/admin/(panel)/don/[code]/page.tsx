import Link from "next/link";
import { notFound } from "next/navigation";
import { IconChevronLeft } from "@/components/icons";
import { OrderDetail, type OrderDetailData } from "@/components/admin/order-detail";
import { StatusPill } from "@/components/admin/status-pill";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props) {
  const { code } = await params;
  return { title: `Đơn ${code}` };
}

export default async function OrderPage({ params }: Props) {
  const { code } = await params;
  const { supabase } = await requireAdmin();
  const [{ data: order }, { data: settings }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, code, phone, address, customer_name, note, subtotal, shipping_fee, total, status, cancel_reason, tracking_code, admin_note, created_at, order_items(id, product_id, product_name, option, unit_price, qty, image_path), order_status_history(id, from_status, to_status, changed_by_email, note, created_at)",
      )
      .eq("code", code.toUpperCase())
      .maybeSingle(),
    supabase.from("settings").select("zalo_message_template, shop_name").eq("id", 1).single(),
  ]);
  if (!order) notFound();

  const data = order as unknown as OrderDetailData;
  data.order_status_history.sort((a, b) => a.created_at.localeCompare(b.created_at));

  return (
    <div className="mx-auto max-w-[1100px]">
      <Link href="/admin" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-coral">
        <IconChevronLeft size={18} /> Đơn hàng
      </Link>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-[30px] font-extrabold">{data.code}</h1>
        <StatusPill status={data.status} />
        <span className="text-sm text-ink-soft">Đặt lúc {formatDateTime(data.created_at)}</span>
      </div>
      <OrderDetail order={data} template={settings?.zalo_message_template ?? ""} />
    </div>
  );
}
