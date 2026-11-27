"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { IconAlert, IconBag, IconMapPin, IconNote, IconUser, IconZalo } from "@/components/icons";
import { placeOrder, refreshCart } from "@/app/(shop)/actions";
import { formatVnd } from "@/lib/format";
import { isValidPhone } from "@/lib/validation";
import { useCart } from "./cart";
import { MediaImage } from "./media";

export const LAST_ORDER_KEY = "thanhchi-last-order";

export function CheckoutForm() {
  const { lines, ready, subtotal, replace, clear } = useCart();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ phone: "", address: "", name: "", note: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [checked, setChecked] = useState(false);

  // Re-validate cart against the server once on load.
  useEffect(() => {
    if (!ready || checked || lines.length === 0) return;
    setChecked(true);
    refreshCart(lines).then(replace).catch(() => {});
  }, [ready, checked, lines, replace]);

  if (!ready) return <div className="h-64 rounded-[20px] bg-white" />;

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[20px] border border-line bg-white p-10 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-cream">
          <IconBag size={36} />
        </span>
        <p className="text-ink-soft">Giỏ hàng đang trống.</p>
        <Link href="/san-pham" className="rounded-full bg-coral px-6 py-3 font-semibold text-white">
          Xem đồ chơi
        </Link>
      </div>
    );
  }

  const unavailable = lines.filter((l) => l.unavailable);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: "" }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const errs: Record<string, string> = {};
    if (!isValidPhone(form.phone)) errs.phone = "Số điện thoại chưa đúng (10 số, bắt đầu bằng 0)";
    if (form.address.trim().length < 5) errs.address = "Vui lòng nhập địa chỉ nhận hàng";
    setErrors(errs);
    if (Object.keys(errs).length || unavailable.length) return;

    start(async () => {
      try {
        const res = await placeOrder({
          ...form,
          items: lines.map((l) => ({ productId: l.productId, option: l.option, qty: l.qty })),
        });
        if (res.ok) {
          try {
            sessionStorage.setItem(
              LAST_ORDER_KEY,
              JSON.stringify({ code: res.code, total: res.total, lines, phone: form.phone, address: form.address }),
            );
          } catch {
            /* ignore */
          }
          clear();
          router.push(`/dat-hang-thanh-cong?ma=${encodeURIComponent(res.code)}`);
          return;
        }
        setFormError(res.error);
        if (res.fieldErrors) setErrors(res.fieldErrors);
        if (res.unavailableIds) replace(await refreshCart(lines));
      } catch {
        setFormError("Mất kết nối. Thông tin của bạn vẫn còn — vui lòng bấm Đặt hàng lại.");
      }
    });
  };

  const input =
    "w-full rounded-xl border bg-white px-4 py-3 text-[16px] outline-none focus:border-ink";

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 md:grid-cols-[1.1fr_1fr] md:gap-8">
      <div className="rounded-[20px] border border-line bg-white p-5 md:p-6">
        <h2 className="mb-1 text-xl font-bold">Thông tin nhận hàng</h2>
        <p className="mb-5 flex items-center gap-1.5 text-sm text-ink-soft">
          <IconZalo size={18} className="text-teal" /> Shop sẽ nhắn Zalo số điện thoại này để xác nhận đơn.
        </p>

        <label className="mb-4 block">
          <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
            <IconZalo size={18} /> Số điện thoại (Zalo) <span className="text-coral">*</span>
          </span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={set("phone")}
            placeholder="0912 345 678"
            className={`${input} ${errors.phone ? "border-coral" : "border-line"}`}
            aria-invalid={Boolean(errors.phone)}
          />
          {errors.phone && <span className="mt-1 block text-sm text-coral-dark">{errors.phone}</span>}
        </label>

        <label className="mb-4 block">
          <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
            <IconMapPin size={18} /> Địa chỉ nhận hàng <span className="text-coral">*</span>
          </span>
          <textarea
            rows={3}
            autoComplete="street-address"
            value={form.address}
            onChange={set("address")}
            placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
            className={`${input} resize-none ${errors.address ? "border-coral" : "border-line"}`}
            aria-invalid={Boolean(errors.address)}
          />
          {errors.address && <span className="mt-1 block text-sm text-coral-dark">{errors.address}</span>}
        </label>

        <label className="mb-4 block">
          <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
            <IconUser size={18} /> Tên người nhận <span className="font-normal text-ink-soft">(không bắt buộc)</span>
          </span>
          <input autoComplete="name" value={form.name} onChange={set("name")} className={`${input} border-line`} maxLength={60} />
        </label>

        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
            <IconNote size={18} /> Ghi chú <span className="font-normal text-ink-soft">(không bắt buộc)</span>
          </span>
          <textarea
            rows={2}
            value={form.note}
            onChange={set("note")}
            placeholder="VD: giao giờ hành chính, gọi trước khi giao..."
            className={`${input} resize-none border-line`}
            maxLength={300}
          />
        </label>

        {/* Honeypot — hidden from people, bots fill it. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
          </label>
        </div>
      </div>

      <div className="h-fit rounded-[20px] border border-line bg-white p-5 md:sticky md:top-24 md:p-6">
        <h2 className="mb-4 text-xl font-bold">Đơn hàng ({lines.reduce((s, l) => s + l.qty, 0)})</h2>
        <ul className="mb-4 divide-y divide-line">
          {lines.map((l) => (
            <li key={`${l.productId}-${l.option}`} className={`flex gap-3 py-3 ${l.unavailable ? "opacity-60" : ""}`}>
              <MediaImage path={l.image} alt={l.name} className="h-14 w-14 shrink-0 rounded-lg border border-line" sizes="56px" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="line-clamp-2 font-semibold">{l.name}</p>
                <p className="text-ink-soft">
                  {l.option ? `${l.option} · ` : ""}x{l.qty}
                </p>
                {l.unavailable && <p className="font-semibold text-coral-dark">Hết hàng — vui lòng xoá khỏi giỏ</p>}
                {l.priceChanged && !l.unavailable && <p className="font-semibold text-coral-dark">Giá đã cập nhật</p>}
              </div>
              <span className="text-sm font-semibold">{formatVnd(l.price * l.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mb-1 flex justify-between text-sm">
          <span className="text-ink-soft">Tiền hàng</span>
          <span className="font-semibold">{formatVnd(subtotal)}</span>
        </div>
        <div className="mb-4 flex justify-between text-sm">
          <span className="text-ink-soft">Phí ship</span>
          <span>Shop báo qua Zalo</span>
        </div>
        <div className="mb-5 flex items-baseline justify-between border-t border-line pt-4">
          <span className="font-semibold">Tạm tính</span>
          <span className="font-display text-[28px] font-bold text-coral">{formatVnd(subtotal)}</span>
        </div>

        {(formError || unavailable.length > 0) && (
          <p className="mb-4 flex gap-2 rounded-xl bg-tint-coral p-3 text-sm text-coral-dark">
            <IconAlert size={18} className="mt-0.5 shrink-0" />
            {formError || "Một số sản phẩm đã hết hàng. Mở giỏ hàng để xoá trước khi đặt."}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || unavailable.length > 0}
          className="w-full rounded-full bg-coral py-4 text-[17px] font-semibold text-white hover:bg-coral-dark disabled:opacity-60"
        >
          {pending ? "Đang gửi đơn..." : "Đặt hàng"}
        </button>
        <p className="mt-3 text-center text-xs text-ink-soft">Thanh toán khi nhận hàng · Không cần tạo tài khoản</p>
      </div>
    </form>
  );
}
