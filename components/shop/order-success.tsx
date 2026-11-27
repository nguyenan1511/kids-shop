"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconCheck, IconZalo } from "@/components/icons";
import { formatVnd } from "@/lib/format";
import { zaloLink } from "@/lib/orders";
import type { CartLine } from "./cart";
import { LAST_ORDER_KEY } from "./checkout-form";

type LastOrder = { code: string; total: number; lines: CartLine[]; phone: string; address: string };

export function OrderSuccess({ code, zaloPhone }: { code: string | null; zaloPhone: string }) {
  const [order, setOrder] = useState<LastOrder | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(LAST_ORDER_KEY);
      if (raw) {
        const o = JSON.parse(raw) as LastOrder;
        if (o.code === code) setOrder(o);
      }
    } catch {
      /* ignore */
    }
  }, [code]);

  return (
    <div className="rounded-[28px] border border-line bg-white p-6 text-center md:p-10">
      <span className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-teal text-white">
        <IconCheck size={40} strokeWidth={2.4} />
      </span>
      <h1 className="mb-2 text-[30px] font-extrabold md:text-[36px]">Đặt hàng thành công!</h1>
      {code && (
        <p className="mb-2 text-ink-soft">
          Mã đơn của bạn:{" "}
          <strong className="rounded-lg bg-tint-sun px-2 py-0.5 font-display text-xl tracking-wide text-ink">{code}</strong>
        </p>
      )}
      <p className="mx-auto mb-6 max-w-[440px] text-ink-soft">
        Shop sẽ nhắn <strong className="text-ink">Zalo</strong>
        {order ? (
          <>
            {" "}
            số <strong className="text-ink">{order.phone}</strong>
          </>
        ) : null}{" "}
        trong ít phút để xác nhận đơn và báo phí ship. Bạn thanh toán khi nhận hàng.
      </p>

      {order && (
        <div className="mb-6 rounded-[20px] bg-cream p-4 text-left text-sm">
          <ul className="mb-3 grid gap-1.5">
            {order.lines.map((l) => (
              <li key={`${l.productId}-${l.option}`} className="flex justify-between gap-3">
                <span>
                  {l.name}
                  {l.option ? ` (${l.option})` : ""} x{l.qty}
                </span>
                <span className="shrink-0 font-semibold">{formatVnd(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-line pt-2 font-semibold">
            <span>Tiền hàng (chưa gồm ship)</span>
            <span className="text-coral">{formatVnd(order.total)}</span>
          </div>
          <p className="mt-2 text-ink-soft">Giao đến: {order.address}</p>
        </div>
      )}

      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        {zaloPhone && (
          <a
            href={zaloLink(zaloPhone)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-teal px-6 py-3.5 font-semibold text-white"
          >
            <IconZalo size={20} /> Nhắn Zalo cho shop
          </a>
        )}
        <Link href="/" className="rounded-full border-2 border-ink px-6 py-3 font-semibold">
          Tiếp tục mua sắm
        </Link>
      </div>
    </div>
  );
}
