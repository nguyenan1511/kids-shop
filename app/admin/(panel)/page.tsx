import Link from "next/link";
import { IconChevronRight, IconSearch } from "@/components/icons";
import { requireAdmin } from "@/lib/admin";
import { formatVnd, timeAgo } from "@/lib/format";
import { StatusPill } from "@/components/admin/status-pill";
import { STATUS_TABS, type OrderStatus } from "@/lib/orders";
import { normalizePhone } from "@/lib/validation";

export const metadata = { title: "Đơn hàng" };

type SP = Promise<{ tab?: string; q?: string; tu?: string; den?: string }>;

type OrderRow = {
  id: string;
  code: string;
  phone: string;
  address: string;
  customer_name: string | null;
  subtotal: number;
  shipping_fee: number | null;
  total: number;
  status: OrderStatus;
  created_at: string;
  order_items: { qty: number }[];
};

/** Start of "today" in Vietnam time, as ISO. */
function vnDayStart(offsetDays = 0): string {
  const now = new Date(Date.now() + 7 * 3600 * 1000);
  const d = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offsetDays) - 7 * 3600 * 1000;
  return new Date(d).toISOString();
}
function vnMonthStart(): string {
  const now = new Date(Date.now() + 7 * 3600 * 1000);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) - 7 * 3600 * 1000).toISOString();
}
function vnDateToIso(date: string, endOfDay = false): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + (endOfDay ? 1 : 0)) - 7 * 3600 * 1000).toISOString();
}

export default async function OrdersPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const q = (sp.q ?? "").trim();
  const tab = STATUS_TABS.find((t) => t.key === sp.tab) ?? (q ? null : STATUS_TABS[0]);

  // Counts per status + dashboard numbers
  const [statusRows, todayCount, monthRows] = await Promise.all([
    supabase.from("orders").select("status"),
    supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", vnDayStart()),
    supabase.from("orders").select("total").eq("status", "completed").gte("created_at", vnMonthStart()),
  ]);
  const counts: Record<string, number> = {};
  for (const r of statusRows.data ?? []) counts[r.status] = (counts[r.status] ?? 0) + 1;
  const waiting = (counts.new ?? 0) + (counts.contacted ?? 0);
  const revenue = (monthRows.data ?? []).reduce((s, r) => s + r.total, 0);

  let query = supabase
    .from("orders")
    .select("id, code, phone, address, customer_name, subtotal, shipping_fee, total, status, created_at, order_items(qty)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (tab) query = query.in("status", tab.statuses);
  if (q) {
    const code = q.toUpperCase();
    const phone = normalizePhone(q);
    if (/^TC-?[0-9A-Z]{1,5}$/.test(code)) query = query.ilike("code", `%${code.replace(/^TC-?/, "")}%`);
    else if (phone.length >= 3) query = query.like("phone", `%${phone}%`);
    else query = query.ilike("customer_name", `%${q.replace(/[%_,()]/g, " ")}%`);
  }
  const from = sp.tu ? vnDateToIso(sp.tu) : null;
  const to = sp.den ? vnDateToIso(sp.den, true) : null;
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lt("created_at", to);

  const { data, error } = await query;
  const orders = (data ?? []) as OrderRow[];

  return (
    <div className="mx-auto max-w-[1100px]">
      <h1 className="mb-5 text-[30px] font-extrabold">Đơn hàng</h1>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat label="Đơn hôm nay" value={String(todayCount.count ?? 0)} />
        <Stat label="Đang chờ xử lý" value={String(waiting)} accent={waiting > 0} />
        <Stat label="Doanh thu tháng" value={formatVnd(revenue)} small />
      </div>

      <form className="mb-4 flex flex-wrap gap-2">
        {tab && <input type="hidden" name="tab" value={tab.key} />}
        <label className="flex h-11 min-w-[220px] flex-1 items-center gap-2 rounded-full border border-line bg-white px-4 focus-within:border-ink">
          <IconSearch size={18} className="text-ink-soft" />
          <input name="q" defaultValue={q} placeholder="Tìm SĐT, mã đơn, tên..." className="w-full bg-transparent outline-none" />
        </label>
        <input type="date" name="tu" defaultValue={sp.tu} aria-label="Từ ngày" className="h-11 rounded-full border border-line bg-white px-3 text-sm" />
        <input type="date" name="den" defaultValue={sp.den} aria-label="Đến ngày" className="h-11 rounded-full border border-line bg-white px-3 text-sm" />
        <button className="h-11 rounded-full bg-ink px-5 text-sm font-semibold text-white">Lọc</button>
        {(q || sp.tu || sp.den) && (
          <Link href={tab ? `/admin?tab=${tab.key}` : "/admin"} className="grid h-11 place-items-center px-2 text-sm text-coral">
            Xoá lọc
          </Link>
        )}
      </form>

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {STATUS_TABS.map((t) => {
          const n = t.statuses.reduce((s, st) => s + (counts[st] ?? 0), 0);
          const on = tab?.key === t.key;
          return (
            <Link
              key={t.key}
              href={`/admin?tab=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${
                on ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-1.5 text-xs font-bold ${
                  on ? "bg-white/20" : t.key === "new" && n > 0 ? "bg-coral text-white" : "bg-cream"
                }`}
              >
                {n}
              </span>
            </Link>
          );
        })}
        {q && (
          <Link href={`/admin?q=${encodeURIComponent(q)}`} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${!tab ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>
            Tất cả
          </Link>
        )}
      </div>

      {error && <p className="mb-4 rounded-xl bg-tint-coral p-3 text-sm">Lỗi tải đơn: {error.message}</p>}

      {orders.length === 0 ? (
        <p className="rounded-[20px] border border-dashed border-line bg-white p-10 text-center text-ink-soft">
          Không có đơn nào{tab ? ` ở mục “${tab.label}”` : ""}.
        </p>
      ) : (
        <div className="overflow-hidden rounded-[20px] border border-line bg-white">
          <table className="hidden w-full text-sm md:table">
            <thead className="bg-cream text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-3">Mã đơn</th>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3 text-center">SL</th>
                <th className="px-4 py-3 text-right">Tổng</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-cream/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/don/${o.code}`} className="font-display text-base font-bold hover:text-coral">
                      {o.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{timeAgo(o.created_at)}</td>
                  <td className="max-w-[320px] px-4 py-3">
                    <Link href={`/admin/don/${o.code}`} className="block">
                      <span className="font-semibold">{o.phone}</span>
                      {o.customer_name && <span className="text-ink-soft"> · {o.customer_name}</span>}
                      <span className="block truncate text-ink-soft">{o.address}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center">{o.order_items.reduce((s, i) => s + i.qty, 0)}</td>
                  <td className="px-4 py-3 text-right font-semibold">
                    {formatVnd(o.total)}
                    {o.shipping_fee == null && <span className="block text-xs font-normal text-ink-soft">chưa ship</span>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="divide-y divide-line md:hidden">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/don/${o.code}`} className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-display text-base font-bold">{o.code}</span>
                      <StatusPill status={o.status} />
                    </div>
                    <p className="text-sm font-semibold">
                      {o.phone}
                      {o.customer_name && <span className="font-normal text-ink-soft"> · {o.customer_name}</span>}
                    </p>
                    <p className="truncate text-sm text-ink-soft">{o.address}</p>
                    <p className="mt-1 text-xs text-ink-soft">
                      {timeAgo(o.created_at)} · {o.order_items.reduce((s, i) => s + i.qty, 0)} sp ·{" "}
                      <strong className="text-ink">{formatVnd(o.total)}</strong>
                    </p>
                  </div>
                  <IconChevronRight className="shrink-0 text-ink-soft" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {orders.length === 100 && <p className="mt-3 text-center text-sm text-ink-soft">Hiển thị 100 đơn mới nhất — dùng bộ lọc để tìm đơn cũ hơn.</p>}
    </div>
  );
}

function Stat({ label, value, accent, small }: { label: string; value: string; accent?: boolean; small?: boolean }) {
  return (
    <div className={`rounded-[20px] border p-3 md:p-4 ${accent ? "border-coral bg-tint-coral" : "border-line bg-white"}`}>
      <p className="text-xs text-ink-soft md:text-sm">{label}</p>
      <p className={`font-display font-bold ${small ? "text-lg md:text-2xl" : "text-2xl md:text-3xl"}`}>{value}</p>
    </div>
  );
}
