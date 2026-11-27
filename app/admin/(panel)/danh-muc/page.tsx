import { CategoryManager } from "@/components/admin/category-manager";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Danh mục" };

export default async function CategoriesPage() {
  const { supabase } = await requireAdmin();
  const [{ data: cats }, { data: prods }] = await Promise.all([
    supabase.from("categories").select("id, name, slug, image_path, sort_order").order("sort_order"),
    supabase.from("products").select("category_id"),
  ]);
  const counts: Record<string, number> = {};
  for (const p of prods ?? []) if (p.category_id) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;

  return (
    <div className="mx-auto max-w-[800px]">
      <h1 className="mb-1 text-[30px] font-extrabold">Danh mục</h1>
      <p className="mb-5 text-ink-soft">Hiện ở trang chủ theo thứ tự bên dưới. Nên giữ 6 danh mục cho đẹp.</p>
      <CategoryManager categories={(cats ?? []).map((c) => ({ ...c, count: counts[c.id] ?? 0 }))} />
    </div>
  );
}
