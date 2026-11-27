import Link from "next/link";
import { IconPlus, IconSearch } from "@/components/icons";
import { ProductRow, type AdminProductRow } from "@/components/admin/product-row";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Sản phẩm" };

type SP = Promise<{ q?: string; dm?: string; loc?: string }>;

export default async function AdminProductsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const { data: categories } = await supabase.from("categories").select("id, name").order("sort_order");

  let query = supabase
    .from("products")
    .select("id, slug, name, price, old_price, category_id, is_visible, is_out_of_stock, is_featured, options, product_images(path, sort_order)")
    .order("sort_order");
  if (sp.q) query = query.ilike("name", `%${sp.q.replace(/[%_,()]/g, " ").trim()}%`);
  if (sp.dm) query = query.eq("category_id", sp.dm);
  if (sp.loc === "hien") query = query.eq("is_visible", true);
  if (sp.loc === "an") query = query.eq("is_visible", false);
  if (sp.loc === "het") query = query.eq("is_out_of_stock", true);
  if (sp.loc === "chua-gia") query = query.lte("price", 0);
  const { data } = await query;
  const rows = (data ?? []) as unknown as AdminProductRow[];
  const catName = new Map((categories ?? []).map((c) => [c.id, c.name]));

  const filters = [
    { v: "", l: "Tất cả" },
    { v: "hien", l: "Đang hiện" },
    { v: "an", l: "Đang ẩn" },
    { v: "chua-gia", l: "Chưa có giá" },
    { v: "het", l: "Hết hàng" },
  ];
  const link = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ ...(sp as Record<string, string>), ...patch });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    return `/admin/san-pham${p.size ? `?${p}` : ""}`;
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="text-[30px] font-extrabold">Sản phẩm</h1>
        <Link href="/admin/san-pham/moi" className="inline-flex items-center gap-2 rounded-full bg-coral px-5 py-2.5 font-semibold text-white">
          <IconPlus size={18} /> Thêm sản phẩm
        </Link>
      </div>

      <form className="mb-3 flex flex-wrap gap-2">
        {sp.loc && <input type="hidden" name="loc" value={sp.loc} />}
        <label className="flex h-11 min-w-[220px] flex-1 items-center gap-2 rounded-full border border-line bg-white px-4 focus-within:border-ink">
          <IconSearch size={18} className="text-ink-soft" />
          <input name="q" defaultValue={sp.q} placeholder="Tìm theo tên..." className="w-full bg-transparent outline-none" />
        </label>
        <select name="dm" defaultValue={sp.dm ?? ""} className="h-11 rounded-full border border-line bg-white px-4 text-sm">
          <option value="">Mọi danh mục</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button className="h-11 rounded-full bg-ink px-5 text-sm font-semibold text-white">Lọc</button>
      </form>
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {filters.map((f) => (
          <Link
            key={f.v}
            href={link({ loc: f.v })}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${
              (sp.loc ?? "") === f.v ? "border-ink bg-ink text-white" : "border-line bg-white"
            }`}
          >
            {f.l}
          </Link>
        ))}
      </div>

      <p className="mb-2 text-sm text-ink-soft">{rows.length} sản phẩm · bật/tắt nhanh ở cột bên phải</p>
      {rows.length === 0 ? (
        <p className="rounded-[20px] border border-dashed border-line bg-white p-10 text-center text-ink-soft">Không có sản phẩm nào.</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-white">
          {rows.map((p) => (
            <ProductRow key={p.id} p={p} category={p.category_id ? catName.get(p.category_id) ?? "" : ""} />
          ))}
        </ul>
      )}
    </div>
  );
}
