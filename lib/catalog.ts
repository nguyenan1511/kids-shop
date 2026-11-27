import "server-only";
import { createPublicClient } from "@/lib/supabase/server";

export type Category = {
  id: string;
  name: string;
  slug: string;
  image_path: string | null;
  sort_order: number;
};

export type ProductImage = { id: string; path: string; sort_order: number };

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  old_price: number | null;
  age_range: string | null;
  category_id: string | null;
  options: string[];
  is_visible: boolean;
  is_out_of_stock: boolean;
  is_featured: boolean;
  sort_order: number;
  product_images: ProductImage[];
};

export type Video = {
  id: string;
  path: string;
  poster_path: string | null;
  product_id: string | null;
  sort_order: number;
  products: { slug: string; name: string } | null;
};

export type Settings = {
  shop_name: string;
  hotline: string;
  zalo_phone: string;
  topbar_text: string;
  promo_title: string;
  promo_text: string;
  zalo_message_template: string;
};

const PRODUCT_FIELDS =
  "id, slug, name, description, price, old_price, age_range, category_id, options, is_visible, is_out_of_stock, is_featured, sort_order, product_images(id, path, sort_order)";

function sortImages(p: Product): Product {
  return { ...p, product_images: [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order) };
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await createPublicClient()
    .from("categories")
    .select("id, name, slug, image_path, sort_order")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export type ProductQuery = {
  categoryId?: string;
  age?: string;
  featured?: boolean;
  search?: string;
  sort?: "default" | "price-asc" | "price-desc" | "newest";
  limit?: number;
  excludeId?: string;
};

export async function getProducts(q: ProductQuery = {}): Promise<Product[]> {
  let query = createPublicClient().from("products").select(PRODUCT_FIELDS).eq("is_visible", true);
  if (q.categoryId) query = query.eq("category_id", q.categoryId);
  if (q.age) query = query.eq("age_range", q.age);
  if (q.featured) query = query.eq("is_featured", true);
  if (q.excludeId) query = query.neq("id", q.excludeId);
  if (q.search) query = query.ilike("name", `%${q.search.replace(/[%_,()]/g, " ").trim()}%`);
  switch (q.sort) {
    case "price-asc":
      query = query.order("price", { ascending: true });
      break;
    case "price-desc":
      query = query.order("price", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query.order("is_out_of_stock").order("sort_order");
  }
  if (q.limit) query = query.limit(q.limit);
  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as unknown as Product[]).map(sortImages);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await createPublicClient()
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("slug", slug)
    .eq("is_visible", true)
    .maybeSingle();
  if (error) throw error;
  return data ? sortImages(data as unknown as Product) : null;
}

export async function getVideos(): Promise<Video[]> {
  const { data, error } = await createPublicClient()
    .from("videos")
    .select("id, path, poster_path, product_id, sort_order, products(slug, name, is_visible)")
    .order("sort_order");
  if (error) throw error;
  type Row = Omit<Video, "products"> & { products: { slug: string; name: string; is_visible: boolean } | null };
  return ((data ?? []) as unknown as Row[]).map((v) => ({
    ...v,
    products: v.products?.is_visible ? { slug: v.products.slug, name: v.products.name } : null,
  }));
}

export async function getSettings(): Promise<Settings> {
  const { data, error } = await createPublicClient().from("settings").select("*").eq("id", 1).single();
  if (error) throw error;
  return data as Settings;
}

/** Minimal product info for the cart (re-validates prices/stock on the client). */
export async function getCartProducts(ids: string[]) {
  if (ids.length === 0) return [];
  const { data, error } = await createPublicClient()
    .from("products")
    .select("id, slug, name, price, options, is_out_of_stock, product_images(path, sort_order)")
    .in("id", ids)
    .eq("is_visible", true);
  if (error) throw error;
  return data ?? [];
}
