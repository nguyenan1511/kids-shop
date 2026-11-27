"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { IconAlert, IconChevronRight } from "@/components/icons";
import { MediaImage } from "@/components/shop/media";
import { toggleProduct } from "@/app/admin/actions";
import { formatVnd } from "@/lib/format";
import { Toggle } from "./toggle";

export type AdminProductRow = {
  id: string;
  slug: string;
  name: string;
  price: number;
  old_price: number | null;
  category_id: string | null;
  is_visible: boolean;
  is_out_of_stock: boolean;
  is_featured: boolean;
  options: string[];
  product_images: { path: string; sort_order: number }[];
};

export function ProductRow({ p, category }: { p: AdminProductRow; category: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const cover = [...p.product_images].sort((a, b) => a.sort_order - b.sort_order)[0]?.path;

  const flip = (field: "is_visible" | "is_out_of_stock" | "is_featured", value: boolean) =>
    start(async () => {
      setErr("");
      const r = await toggleProduct(p.id, field, value);
      if (!r.ok) setErr(r.error);
      router.refresh();
    });

  return (
    <li className={`flex flex-wrap items-center gap-3 p-3 md:flex-nowrap md:p-4 ${pending ? "opacity-60" : ""}`}>
      <Link href={`/admin/san-pham/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <MediaImage path={cover} alt={p.name} className="h-14 w-14 shrink-0 rounded-lg border border-line" sizes="56px" />
        <div className="min-w-0">
          <p className="line-clamp-1 font-semibold">{p.name}</p>
          <p className="text-sm text-ink-soft">
            {p.price > 0 ? (
              <span className="font-semibold text-coral">{formatVnd(p.price)}</span>
            ) : (
              <span className="font-semibold text-coral-dark">Chưa có giá</span>
            )}
            {category && ` · ${category}`}
            {p.options.length > 0 && ` · ${p.options.length} mẫu`}
          </p>
          {err && (
            <p className="flex items-center gap-1 text-xs text-coral-dark">
              <IconAlert size={13} /> {err}
            </p>
          )}
        </div>
      </Link>
      <div className="flex items-center gap-4 text-xs md:gap-5">
        <Toggle label="Hiện" on={p.is_visible} disabled={pending} onChange={(v) => flip("is_visible", v)} />
        <Toggle label="Hết hàng" on={p.is_out_of_stock} disabled={pending} onChange={(v) => flip("is_out_of_stock", v)} tone="ink" />
        <Toggle label="Nổi bật" on={p.is_featured} disabled={pending} onChange={(v) => flip("is_featured", v)} tone="sun" />
        <Link href={`/admin/san-pham/${p.id}`} aria-label="Sửa" className="hidden text-ink-soft md:block">
          <IconChevronRight />
        </Link>
      </div>
    </li>
  );
}
