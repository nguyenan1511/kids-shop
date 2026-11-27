"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { IconAlert, IconBag, IconClose, IconMinus, IconPlus, IconTrash } from "@/components/icons";
import { formatVnd } from "@/lib/format";
import { refreshCart } from "@/app/(shop)/actions";
import { useCart } from "./cart";
import { MediaImage } from "./media";

export function CartDrawer() {
  const { lines, open, setOpen, setQty, remove, subtotal, replace } = useCart();
  const checkedRef = useRef(false);

  // Re-check prices/stock each time the drawer opens.
  useEffect(() => {
    if (!open || lines.length === 0) {
      checkedRef.current = false;
      return;
    }
    if (checkedRef.current) return;
    checkedRef.current = true;
    refreshCart(lines)
      .then(replace)
      .catch(() => {});
  }, [open, lines, replace]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  if (!open) return null;
  const hasUnavailable = lines.some((l) => l.unavailable);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Giỏ hàng">
      <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-white">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-2xl font-bold">Giỏ hàng</h2>
          <button className="grid h-10 w-10 place-items-center rounded-full bg-cream" aria-label="Đóng" onClick={() => setOpen(false)}>
            <IconClose />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center text-ink-soft">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-cream text-ink">
              <IconBag size={36} />
            </span>
            <p>Giỏ hàng đang trống</p>
            <Link
              href="/san-pham"
              onClick={() => setOpen(false)}
              className="rounded-full bg-coral px-6 py-3 font-semibold text-white"
            >
              Xem đồ chơi
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {lines.map((l) => (
                <li key={`${l.productId}-${l.option}`} className={`flex gap-3 py-4 ${l.unavailable ? "opacity-60" : ""}`}>
                  <Link href={`/san-pham/${l.slug}`} onClick={() => setOpen(false)} className="shrink-0">
                    <MediaImage path={l.image} alt={l.name} className="h-20 w-20 rounded-xl border border-line" sizes="80px" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug">{l.name}</p>
                    {l.option && <p className="text-xs text-ink-soft">Mẫu: {l.option}</p>}
                    {l.unavailable ? (
                      <p className="flex items-center gap-1 text-xs font-semibold text-coral-dark">
                        <IconAlert size={14} /> Hết hàng / không còn bán — vui lòng xoá
                      </p>
                    ) : l.priceChanged ? (
                      <p className="text-xs font-semibold text-coral-dark">Giá đã cập nhật</p>
                    ) : null}
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-line">
                        <button
                          className="grid h-8 w-8 place-items-center"
                          aria-label="Giảm"
                          onClick={() => setQty(l.productId, l.option, l.qty - 1)}
                        >
                          <IconMinus size={16} />
                        </button>
                        <span className="w-7 text-center text-sm font-semibold">{l.qty}</span>
                        <button
                          className="grid h-8 w-8 place-items-center"
                          aria-label="Tăng"
                          disabled={l.unavailable}
                          onClick={() => setQty(l.productId, l.option, l.qty + 1)}
                        >
                          <IconPlus size={16} />
                        </button>
                      </div>
                      <span className="font-display text-lg font-bold text-coral">{formatVnd(l.price * l.qty)}</span>
                    </div>
                  </div>
                  <button
                    className="self-start p-1 text-ink-soft hover:text-coral"
                    aria-label="Xoá"
                    onClick={() => remove(l.productId, l.option)}
                  >
                    <IconTrash size={18} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-line px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Tạm tính</span>
                <span className="font-display text-2xl font-bold">{formatVnd(subtotal)}</span>
              </div>
              <p className="mb-4 text-sm text-ink-soft">Phí ship shop sẽ báo qua Zalo khi xác nhận đơn.</p>
              {hasUnavailable ? (
                <p className="rounded-full bg-cream py-3.5 text-center text-sm font-semibold text-coral-dark">
                  Xoá sản phẩm hết hàng để tiếp tục
                </p>
              ) : (
                <Link
                  href="/thanh-toan"
                  onClick={() => setOpen(false)}
                  className="block rounded-full bg-coral py-3.5 text-center font-semibold text-white hover:bg-coral-dark"
                >
                  Đặt hàng
                </Link>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
