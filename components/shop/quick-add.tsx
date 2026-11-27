"use client";

import Link from "next/link";
import { IconPlus } from "@/components/icons";
import type { Product } from "@/lib/catalog";
import { useCart } from "./cart";

/** "+" on product cards. Products with options go to the detail page to pick one. */
export function QuickAdd({ product }: { product: Product }) {
  const { add, setOpen } = useCart();
  const cls =
    "grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-white hover:bg-coral";

  if (product.options.length > 0) {
    return (
      <Link href={`/san-pham/${product.slug}`} className={cls} aria-label={`Chọn mẫu ${product.name}`}>
        <IconPlus size={20} />
      </Link>
    );
  }
  return (
    <button
      className={cls}
      aria-label={`Thêm ${product.name} vào giỏ`}
      onClick={() => {
        add({
          productId: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: product.product_images[0]?.path ?? "",
          option: null,
        });
        setOpen(true);
      }}
    >
      <IconPlus size={20} />
    </button>
  );
}
