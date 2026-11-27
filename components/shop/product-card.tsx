import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { ageLabel, formatVnd } from "@/lib/format";
import { MediaImage } from "./media";
import { QuickAdd } from "./quick-add";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const cover = product.product_images[0]?.path;
  const discount =
    product.old_price && product.old_price > product.price
      ? Math.round((1 - product.price / product.old_price) * 100)
      : 0;

  return (
    <div className="flex flex-col overflow-hidden rounded-[20px] border border-line bg-white">
      <Link href={`/san-pham/${product.slug}`} className="relative block p-2.5 pb-0 md:p-3 md:pb-0">
        <MediaImage path={cover} alt={product.name} className="aspect-square rounded-xl" priority={priority} />
        <div className="absolute left-4 top-4 flex flex-col gap-1 md:left-5 md:top-5">
          {product.is_out_of_stock ? (
            <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-white">HẾT HÀNG</span>
          ) : discount > 0 ? (
            <span className="rounded-full bg-coral px-2.5 py-1 text-[11px] font-bold text-white">-{discount}%</span>
          ) : product.is_featured ? (
            <span className="rounded-full bg-sun px-2.5 py-1 text-[11px] font-bold text-ink">HOT</span>
          ) : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1 px-3 pb-3 pt-3 md:px-4 md:pb-4">
        {product.age_range && <span className="text-xs font-semibold text-teal">{ageLabel(product.age_range)}</span>}
        <Link href={`/san-pham/${product.slug}`} className="line-clamp-2 text-sm font-semibold leading-snug md:text-[15px]">
          {product.name}
        </Link>
        {product.options.length > 0 && (
          <span className="text-xs text-ink-soft">{product.options.length} lựa chọn</span>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="leading-tight">
            <div className="font-display text-lg font-bold text-coral md:text-[22px]">{formatVnd(product.price)}</div>
            {product.old_price && product.old_price > product.price && (
              <s className="text-xs text-ink-soft">{formatVnd(product.old_price)}</s>
            )}
          </div>
          {!product.is_out_of_stock && <QuickAdd product={product} />}
        </div>
      </div>
    </div>
  );
}
