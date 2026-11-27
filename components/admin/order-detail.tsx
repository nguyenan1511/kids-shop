"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  IconAlert,
  IconCheck,
  IconCopy,
  IconEdit,
  IconMapPin,
  IconMinus,
  IconNote,
  IconPhone,
  IconPlus,
  IconTrash,
  IconUser,
  IconZalo,
} from "@/components/icons";
import { MediaImage } from "@/components/shop/media";
import { changeStatus, setItemQty, updateOrderFields } from "@/app/admin/actions";
import { formatDateTime, formatVnd } from "@/lib/format";
import {
  ACTION_LABEL,
  CANCEL_REASONS,
  NEXT_STATUSES,
  STATUS_LABEL,
  fillZaloTemplate,
  isEditable,
  isFinal,
  zaloLink,
  type OrderStatus,
} from "@/lib/orders";

export type OrderDetailData = {
  id: string;
  code: string;
  phone: string;
  address: string;
  customer_name: string | null;
  note: string | null;
  subtotal: number;
  shipping_fee: number | null;
  total: number;
  status: OrderStatus;
  cancel_reason: string | null;
  tracking_code: string | null;
  admin_note: string | null;
  created_at: string;
  order_items: {
    id: string;
    product_id: string | null;
    product_name: string;
    option: string | null;
    unit_price: number;
    qty: number;
    image_path: string | null;
  }[];
  order_status_history: {
    id: string;
    from_status: OrderStatus | null;
    to_status: OrderStatus;
    changed_by_email: string | null;
    note: string | null;
    created_at: string;
  }[];
};

const card = "rounded-[20px] border border-line bg-white p-5";
const btn = "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-50";

export function OrderDetail({ order, template }: { order: OrderDetailData; template: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const editable = isEditable(order.status);
  const final = isFinal(order.status);

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? (r.message ? { ok: true, text: r.message } : null) : { ok: false, text: r.error ?? "Lỗi" });
      if (r.ok) {
        after?.();
        router.refresh();
      }
    });

  return (
    <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
      <div className="grid h-fit gap-5">
        {msg && (
          <p className={`flex items-center gap-2 rounded-xl p-3 text-sm ${msg.ok ? "bg-tint-teal" : "bg-tint-coral text-coral-dark"}`}>
            {msg.ok ? <IconCheck size={18} /> : <IconAlert size={18} />} {msg.text}
          </p>
        )}

        <Customer order={order} editable={editable} pending={pending} run={run} />

        {/* Items */}
        <section className={card}>
          <h2 className="mb-3 text-lg font-bold">Sản phẩm</h2>
          <ul className="divide-y divide-line">
            {order.order_items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-3">
                <MediaImage path={i.image_path} alt={i.product_name} className="h-14 w-14 shrink-0 rounded-lg border border-line" sizes="56px" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold">{i.product_name}</p>
                  <p className="text-ink-soft">
                    {i.option ? `${i.option} · ` : ""}
                    {formatVnd(i.unit_price)}
                  </p>
                </div>
                {editable ? (
                  <div className="flex items-center rounded-full border border-line">
                    <button
                      className="grid h-8 w-8 place-items-center"
                      aria-label={i.qty === 1 ? "Xoá" : "Giảm"}
                      disabled={pending}
                      onClick={() => run(() => setItemQty(i.id, i.qty - 1))}
                    >
                      {i.qty === 1 ? <IconTrash size={15} /> : <IconMinus size={15} />}
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{i.qty}</span>
                    <button
                      className="grid h-8 w-8 place-items-center"
                      aria-label="Tăng"
                      disabled={pending}
                      onClick={() => run(() => setItemQty(i.id, i.qty + 1))}
                    >
                      <IconPlus size={15} />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm">x{i.qty}</span>
                )}
                <span className="w-24 text-right text-sm font-semibold">{formatVnd(i.unit_price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <Totals order={order} final={final} pending={pending} run={run} />
        </section>

        <ZaloMessage order={order} template={template} />
      </div>

      <div className="grid h-fit gap-5">
        <StatusPanel order={order} pending={pending} run={run} />
        <AdminNote order={order} pending={pending} run={run} />
        <History order={order} />
      </div>
    </div>
  );
}

type Run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string }>, after?: () => void) => void;

function Customer({ order, editable, pending, run }: { order: OrderDetailData; editable: boolean; pending: boolean; run: Run }) {
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState({ phone: order.phone, address: order.address, name: order.customer_name ?? "" });
  const [copied, setCopied] = useState(false);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className={card}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">Khách hàng</h2>
        {editable && !editing && (
          <button className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-coral" onClick={() => setEditing(true)}>
            <IconEdit size={16} /> Sửa
          </button>
        )}
      </div>

      {editing ? (
        <div className="grid gap-3">
          <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="rounded-xl border border-line px-3 py-2.5" placeholder="Số điện thoại" />
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="rounded-xl border border-line px-3 py-2.5" placeholder="Tên (không bắt buộc)" />
          <textarea value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} rows={3} className="resize-none rounded-xl border border-line px-3 py-2.5" />
          <div className="flex gap-2">
            <button
              className={`${btn} bg-ink text-white`}
              disabled={pending}
              onClick={() =>
                run(
                  () => updateOrderFields({ orderId: order.id, phone: f.phone, address: f.address, customerName: f.name }),
                  () => setEditing(false),
                )
              }
            >
              Lưu
            </button>
            <button className={`${btn} bg-cream`} onClick={() => setEditing(false)}>
              Huỷ
            </button>
          </div>
        </div>
      ) : (
        <>
          <ul className="mb-4 grid gap-2.5 text-[15px]">
            <li className="flex items-center gap-2.5">
              <IconPhone size={18} className="shrink-0 text-ink-soft" />
              <span className="font-display text-xl font-bold tracking-wide">{order.phone}</span>
            </li>
            {order.customer_name && (
              <li className="flex items-center gap-2.5">
                <IconUser size={18} className="shrink-0 text-ink-soft" /> {order.customer_name}
              </li>
            )}
            <li className="flex gap-2.5">
              <IconMapPin size={18} className="mt-0.5 shrink-0 text-ink-soft" /> <span>{order.address}</span>
            </li>
            {order.note && (
              <li className="flex gap-2.5 rounded-xl bg-tint-sun p-2.5 text-sm">
                <IconNote size={18} className="mt-0.5 shrink-0" /> <span>Khách ghi chú: {order.note}</span>
              </li>
            )}
          </ul>
          <div className="flex flex-wrap gap-2">
            <a href={zaloLink(order.phone)} target="_blank" rel="noopener noreferrer" className={`${btn} bg-teal text-white`}>
              <IconZalo size={18} /> Nhắn Zalo
            </a>
            <a href={`tel:${order.phone}`} className={`${btn} bg-cream`}>
              <IconPhone size={18} /> Gọi
            </a>
            <button className={`${btn} bg-cream`} onClick={() => copy(`${order.customer_name ? order.customer_name + " - " : ""}${order.phone}\n${order.address}`)}>
              {copied ? <IconCheck size={18} /> : <IconCopy size={18} />} {copied ? "Đã chép" : "Chép địa chỉ"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function Totals({ order, final, pending, run }: { order: OrderDetailData; final: boolean; pending: boolean; run: Run }) {
  const [fee, setFee] = useState(order.shipping_fee == null ? "" : String(order.shipping_fee / 1000));
  const parsed = fee.trim() === "" ? null : Math.round(Number(fee.replace(",", ".")) * 1000);
  const valid = parsed === null || (Number.isFinite(parsed) && parsed >= 0);
  const changed = parsed !== order.shipping_fee;

  return (
    <div className="mt-2 grid gap-2 border-t border-line pt-4 text-sm">
      <div className="flex justify-between">
        <span className="text-ink-soft">Tiền hàng</span>
        <span className="font-semibold">{formatVnd(order.subtotal)}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-ink-soft">Phí ship</span>
        {final ? (
          <span>{order.shipping_fee == null ? "—" : formatVnd(order.shipping_fee)}</span>
        ) : (
          <div className="flex items-center gap-2">
            <label className="flex items-center rounded-xl border border-line bg-white pr-3 focus-within:border-ink">
              <input
                inputMode="decimal"
                value={fee}
                onChange={(e) => setFee(e.target.value.replace(/[^\d.,]/g, ""))}
                placeholder="VD: 30"
                className="w-20 rounded-xl px-3 py-2 text-right outline-none"
                aria-label="Phí ship (nghìn đồng)"
              />
              <span className="text-ink-soft">.000đ</span>
            </label>
            {changed && valid && (
              <button
                className={`${btn} bg-ink py-2 text-white`}
                disabled={pending}
                onClick={() => run(() => updateOrderFields({ orderId: order.id, shippingFee: parsed }))}
              >
                Lưu
              </button>
            )}
          </div>
        )}
      </div>
      {!final && <p className="text-right text-xs text-ink-soft">Nhập theo nghìn đồng: 30 = 30.000đ · 0 = miễn phí</p>}
      <div className="flex items-baseline justify-between border-t border-line pt-3">
        <span className="font-semibold">Tổng thu khi giao</span>
        <span className="font-display text-2xl font-bold text-coral">{formatVnd(order.total)}</span>
      </div>
    </div>
  );
}

function ZaloMessage({ order, template }: { order: OrderDetailData; template: string }) {
  const [copied, setCopied] = useState(false);
  const text = fillZaloTemplate(template, { ...order, items: order.order_items }, formatVnd);
  return (
    <section className={card}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Tin nhắn xác nhận Zalo</h2>
        <button
          className={`${btn} bg-teal text-white`}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              /* ignore */
            }
          }}
        >
          {copied ? <IconCheck size={18} /> : <IconCopy size={18} />} {copied ? "Đã chép" : "Chép tin nhắn"}
        </button>
      </div>
      {order.shipping_fee == null && (
        <p className="mb-2 text-xs text-coral-dark">Chưa nhập phí ship — tin nhắn sẽ ghi “shop báo sau”.</p>
      )}
      <pre className="whitespace-pre-wrap rounded-xl bg-cream p-3 font-sans text-sm">{text}</pre>
    </section>
  );
}

function StatusPanel({ order, pending, run }: { order: OrderDetailData; pending: boolean; run: Run }) {
  const next = NEXT_STATUSES[order.status];
  const [mode, setMode] = useState<OrderStatus | null>(null);
  const [reason, setReason] = useState<string>(CANCEL_REASONS[0]);
  const [other, setOther] = useState("");
  const [tracking, setTracking] = useState("");
  const [note, setNote] = useState("");

  const confirmBlocked = mode === "confirmed" && order.shipping_fee == null;

  return (
    <section className={card}>
      <h2 className="mb-3 text-lg font-bold">Trạng thái</h2>
      {order.status === "cancelled" && order.cancel_reason && (
        <p className="mb-3 rounded-xl bg-cream p-3 text-sm">Lý do huỷ: {order.cancel_reason}</p>
      )}
      {order.tracking_code && <p className="mb-3 rounded-xl bg-cream p-3 text-sm">Mã vận đơn: <strong>{order.tracking_code}</strong></p>}

      {next.length === 0 ? (
        <p className="text-sm text-ink-soft">Đơn đã kết thúc ({STATUS_LABEL[order.status]}).</p>
      ) : mode === null ? (
        <div className="grid gap-2">
          {next.map((s) => (
            <button
              key={s}
              onClick={() => setMode(s)}
              className={`${btn} py-3 ${
                s === "cancelled" || s === "returned" ? "border border-line bg-white text-ink-soft hover:border-coral hover:text-coral-dark" : "bg-ink text-white hover:bg-coral"
              }`}
            >
              {ACTION_LABEL[s]} → {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 rounded-xl bg-cream p-3">
          <p className="text-sm font-semibold">
            Chuyển sang: <span className="text-coral-dark">{STATUS_LABEL[mode]}</span>
          </p>
          {mode === "cancelled" && (
            <div className="grid gap-1.5 text-sm">
              {[...CANCEL_REASONS, "Khác"].map((r) => (
                <label key={r} className="flex items-center gap-2">
                  <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} /> {r}
                </label>
              ))}
              {reason === "Khác" && (
                <input value={other} onChange={(e) => setOther(e.target.value)} placeholder="Lý do..." className="rounded-xl border border-line px-3 py-2" />
              )}
            </div>
          )}
          {mode === "shipping" && (
            <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Mã vận đơn (không bắt buộc)" className="rounded-xl border border-line bg-white px-3 py-2 text-sm" />
          )}
          {mode !== "cancelled" && (
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú (không bắt buộc)" className="rounded-xl border border-line bg-white px-3 py-2 text-sm" />
          )}
          {confirmBlocked && (
            <p className="flex items-center gap-1.5 text-xs text-coral-dark">
              <IconAlert size={14} /> Nhập phí ship trước khi xác nhận (0 nếu miễn phí).
            </p>
          )}
          <div className="flex gap-2">
            <button
              className={`${btn} flex-1 bg-coral text-white`}
              disabled={pending || confirmBlocked || (mode === "cancelled" && reason === "Khác" && !other.trim())}
              onClick={() =>
                run(
                  () =>
                    changeStatus({
                      orderId: order.id,
                      to: mode,
                      note,
                      cancelReason: mode === "cancelled" ? (reason === "Khác" ? other : reason) : undefined,
                      trackingCode: tracking,
                    }),
                  () => {
                    setMode(null);
                    setNote("");
                  },
                )
              }
            >
              {pending ? "Đang lưu..." : "Xác nhận"}
            </button>
            <button className={`${btn} bg-white`} onClick={() => setMode(null)}>
              Quay lại
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function AdminNote({ order, pending, run }: { order: OrderDetailData; pending: boolean; run: Run }) {
  const [v, setV] = useState(order.admin_note ?? "");
  const changed = v !== (order.admin_note ?? "");
  return (
    <section className={card}>
      <h2 className="mb-2 text-lg font-bold">Ghi chú nội bộ</h2>
      <textarea
        value={v}
        onChange={(e) => setV(e.target.value)}
        rows={3}
        placeholder="Chỉ admin thấy. VD: khách hẹn giao chiều thứ 7"
        className="mb-2 w-full resize-none rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-ink"
      />
      {changed && (
        <button className={`${btn} bg-ink text-white`} disabled={pending} onClick={() => run(() => updateOrderFields({ orderId: order.id, adminNote: v }))}>
          Lưu ghi chú
        </button>
      )}
    </section>
  );
}

function History({ order }: { order: OrderDetailData }) {
  return (
    <section className={card}>
      <h2 className="mb-3 text-lg font-bold">Lịch sử</h2>
      <ol className="relative grid gap-4 border-l-2 border-line pl-4">
        {order.order_status_history.map((h) => (
          <li key={h.id} className="relative text-sm">
            <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white bg-coral" />
            <p className="font-semibold">{STATUS_LABEL[h.to_status]}</p>
            <p className="text-xs text-ink-soft">
              {formatDateTime(h.created_at)}
              {h.changed_by_email ? ` · ${h.changed_by_email}` : " · Khách hàng"}
            </p>
            {h.note && <p className="mt-0.5 text-ink-soft">{h.note}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
