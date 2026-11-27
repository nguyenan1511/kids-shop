import { notFound } from "next/navigation";
import { ProductForm, type ProductFormValue } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Sửa sản phẩm" };

const EMPTY: ProductFormValue = {
  name: "",
  slug: "",
  description: "",
  price: 0,
  oldPrice: null,
  ageRange: null,
  categoryId: null,
  options: [],
  isVisible: true,
  isOutOfStock: false,
  isFeatured: false,
  images: [],
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: categories } = await supabase.from("categories").select("id, name").order("sort_order");

  if (id === "moi") {
    return <ProductForm initial={EMPTY} categories={categories ?? []} />;
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data: p } = await supabase
    .from("products")
    .select("*, product_images(path, sort_order)")
    .eq("id", id)
    .maybeSingle();
  if (!p) notFound();

  const initial: ProductFormValue = {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    oldPrice: p.old_price,
    ageRange: p.age_range,
    categoryId: p.category_id,
    options: p.options ?? [],
    isVisible: p.is_visible,
    isOutOfStock: p.is_out_of_stock,
    isFeatured: p.is_featured,
    images: [...(p.product_images ?? [])]
      .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
      .map((i: { path: string }) => i.path),
  };
  return <ProductForm key={p.id} initial={initial} categories={categories ?? []} />;
}
