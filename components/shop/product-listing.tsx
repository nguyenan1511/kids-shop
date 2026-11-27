import Link from "next/link";
import { IconSearch } from "@/components/icons";
import type { Category, Product } from "@/lib/catalog";
import { AGE_RANGES } from "@/lib/format";
import { ProductCard } from "./product-card";

export const SORTS = [
  { value: "", label: "Nổi bật" },
  { value: "moi", label: "Mới nhất" },
  { value: "gia-tang", label: "Giá thấp → cao" },
  { value: "gia-giam", label: "Giá cao → thấp" },
] as const;

export function sortParam(v: string | undefined) {
  return v === "moi" ? "newest" : v === "gia-tang" ? "price-asc" : v === "gia-giam" ? "price-desc" : "default";
}

/** Filters are plain links/forms (works without JS, shareable URLs). */
export function ProductListing({
  title,
  basePath,
  products,
  categories,
  activeCategory,
  params,
}: {
  title: string;
  basePath: string;
  products: Product[];
  categories: Category[];
  activeCategory?: string;
  params: { q?: string; tuoi?: string; "sap-xep"?: string };
}) {
  const href = (patch: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    const merged = { ...params, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const s = sp.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium ${
      active ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"
    }`;

  return (
    <section className="px-4 py-8 md:py-10">
      <div className="mx-auto max-w-[1200px]">
        <nav className="mb-3 text-sm text-ink-soft">
          <Link href="/" className="hover:text-coral">
            Trang chủ
          </Link>{" "}
          / <span className="text-ink">{title}</span>
        </nav>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-[32px] font-extrabold md:text-[40px]">
            {params.q ? `Kết quả cho “${params.q}”` : title}
          </h1>
          <form action={basePath} className="w-full md:w-[320px]">
            {params.tuoi && <input type="hidden" name="tuoi" value={params.tuoi} />}
            <label className="flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm focus-within:border-ink">
              <IconSearch size={18} className="text-ink-soft" />
              <input name="q" defaultValue={params.q} placeholder="Tìm theo tên..." className="w-full bg-transparent outline-none" />
            </label>
          </form>
        </div>

        <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
          <Link href="/san-pham" className={chip(!activeCategory)}>
            Tất cả
          </Link>
          {categories.map((c) => (
            <Link key={c.id} href={`/danh-muc/${c.slug}`} className={chip(activeCategory === c.slug)}>
              {c.name}
            </Link>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
            <Link href={href({ tuoi: undefined })} className={chip(!params.tuoi)}>
              Mọi lứa tuổi
            </Link>
            {AGE_RANGES.map((a) => (
              <Link key={a.value} href={href({ tuoi: a.value })} className={chip(params.tuoi === a.value)}>
                {a.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-ink-soft">Sắp xếp:</span>
            {SORTS.map((s) => (
              <Link
                key={s.value}
                href={href({ "sap-xep": s.value || undefined })}
                className={`rounded-full px-3 py-1.5 ${
                  (params["sap-xep"] ?? "") === s.value ? "bg-tint-coral font-semibold text-coral-dark" : "hover:text-coral"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-line bg-white p-10 text-center text-ink-soft">
            Không tìm thấy đồ chơi phù hợp.{" "}
            <Link href={basePath} className="font-semibold text-coral">
              Xoá bộ lọc
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-ink-soft">{products.length} sản phẩm</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} priority={i < 4} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
