import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconCash, IconShield, IconTruck } from "@/components/icons";
import { Gallery } from "@/components/shop/gallery";
import { ProductCard } from "@/components/shop/product-card";
import { ProductBuy } from "@/components/shop/product-buy";
import { getCategories, getProductBySlug, getProducts } from "@/lib/catalog";
import { ageLabel, formatVnd, mediaUrl } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Không tìm thấy" };
  const img = p.product_images[0]?.path;
  return {
    title: p.name,
    description: `${p.name} — ${formatVnd(p.price)}. ${p.description}`.slice(0, 160),
    openGraph: img ? { images: [mediaUrl(img)] } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [categories, related] = await Promise.all([
    getCategories(),
    getProducts({ categoryId: product.category_id ?? undefined, excludeId: product.id, limit: 4 }),
  ]);
  const cat = categories.find((c) => c.id === product.category_id);
  const discount =
    product.old_price && product.old_price > product.price
      ? Math.round((1 - product.price / product.old_price) * 100)
      : 0;

  return (
    <section className="px-4 py-6 md:py-10">
      <div className="mx-auto max-w-[1200px]">
        <nav className="mb-4 line-clamp-1 text-sm text-ink-soft">
          <Link href="/" className="hover:text-coral">
            Trang chủ
          </Link>
          {cat && (
            <>
              {" / "}
              <Link href={`/danh-muc/${cat.slug}`} className="hover:text-coral">
                {cat.name}
              </Link>
            </>
          )}
          {" / "}
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <Gallery images={product.product_images} alt={product.name} />

          <div>
            {product.age_range && (
              <span className="mb-2 inline-block rounded-full bg-tint-teal px-3 py-1 text-xs font-semibold text-ink">
                {ageLabel(product.age_range)}
              </span>
            )}
            <h1 className="mb-3 text-[28px] font-extrabold md:text-[38px]">{product.name}</h1>
            <div className="mb-6 flex items-baseline gap-3">
              <span className="font-display text-[34px] font-bold text-coral">{formatVnd(product.price)}</span>
              {discount > 0 && (
                <>
                  <s className="text-ink-soft">{formatVnd(product.old_price!)}</s>
                  <span className="rounded-full bg-coral px-2.5 py-1 text-xs font-bold text-white">-{discount}%</span>
                </>
              )}
            </div>

            <ProductBuy
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                image: product.product_images[0]?.path ?? "",
                options: product.options,
                outOfStock: product.is_out_of_stock,
              }}
            />

            <ul className="my-6 grid gap-3 rounded-[20px] border border-line bg-white p-4 text-sm">
              <li className="flex items-center gap-3">
                <IconCash className="shrink-0 text-teal" /> Thanh toán khi nhận hàng (COD)
              </li>
              <li className="flex items-center gap-3">
                <IconTruck className="shrink-0 text-teal" /> Giao toàn quốc — phí ship shop báo qua Zalo
              </li>
              <li className="flex items-center gap-3">
                <IconShield className="shrink-0 text-teal" /> Đổi trả trong 7 ngày nếu hàng lỗi
              </li>
            </ul>

            {product.description && (
              <div>
                <h2 className="mb-2 text-xl font-bold">Mô tả</h2>
                <p className="whitespace-pre-line text-ink-soft">{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="mb-5 text-[26px] font-extrabold md:text-[30px]">Có thể bé cũng thích</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
