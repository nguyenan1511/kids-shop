"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { adminOrError, dbError, type ActionResult } from "@/lib/admin";
import { slugify } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/orders";
import { createSessionClient } from "@/lib/supabase/server";
import { VN_PHONE, normalizePhone } from "@/lib/validation";

const fail = (error: string): ActionResult => ({ ok: false, error });
const done = (message?: string): ActionResult => ({ ok: true, message });

/** Shop pages are cached for 60s; refresh them right away after catalog edits. */
function revalidateShop() {
  revalidatePath("/", "layout");
}

export async function logout() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/dang-nhap");
}

/* ======================= Orders ======================= */

export async function changeStatus(input: {
  orderId: string;
  to: string;
  note?: string;
  cancelReason?: string;
  trackingCode?: string;
}): Promise<ActionResult> {
  const a = await adminOrError();
  if (!a.ok) return fail(a.error);
  if (!(ORDER_STATUSES as readonly string[]).includes(input.to)) return fail("Trạng thái không hợp lệ");
  const { error } = await a.supabase.rpc("change_order_status", {
    p_order_id: input.orderId,
    p_to: input.to,
    p_note: input.note ?? null,
    p_cancel_reason: input.cancelReason ?? null,
    p_tracking_code: input.trackingCode ?? null,
  });
  if (error) return fail(dbError(error.message));
  revalidatePath("/admin", "layout");
  return done("Đã cập nhật trạng thái");
}

export async function updateOrderFields(input: {
  orderId: string;
  shippingFee?: number | null;
  phone?: string;
  address?: string;
  customerName?: string;
  adminNote?: string;
}): Promise<ActionResult> {
  const a = await adminOrError();
  if (!a.ok) return fail(a.error);

  const patch: Record<string, unknown> = {};
  if (input.shippingFee !== undefined) {
    if (input.shippingFee !== null && (!Number.isInteger(input.shippingFee) || input.shippingFee < 0 || input.shippingFee > 10_000_000))
      return fail("Phí ship không hợp lệ");
    patch.shipping_fee = input.shippingFee;
  }
  if (input.phone !== undefined) {
    const p = normalizePhone(input.phone);
    if (!VN_PHONE.test(p)) return fail("Số điện thoại chưa đúng");
    patch.phone = p;
  }
  if (input.address !== undefined) {
    if (input.address.trim().length < 5) return fail("Địa chỉ quá ngắn");
    patch.address = input.address.trim().slice(0, 300);
  }
  if (input.customerName !== undefined) patch.customer_name = input.customerName.trim().slice(0, 60) || null;
  if (input.adminNote !== undefined) patch.admin_note = input.adminNote.trim().slice(0, 1000) || null;
  if (Object.keys(patch).length === 0) return done();

  const { error, count } = await a.supabase
    .from("orders")
    .update(patch, { count: "exact" })
    .eq("id", input.orderId);
  if (error) return fail(dbError(error.message));
  if (count === 0) return fail("Không tìm thấy đơn hàng");
  revalidatePath("/admin", "layout");
  return done("Đã lưu");
}

export async function setItemQty(itemId: string, qty: number): Promise<ActionResult> {
  const a = await adminOrError();
  if (!a.ok) return fail(a.error);
  if (!Number.isInteger(qty) || qty < 0 || qty > 99) return fail("Số lượng không hợp lệ");
  const { error } = await a.supabase.rpc("admin_set_item_qty", { p_item_id: itemId, p_qty: qty });
  if (error) return fail(dbError(error.message));
  revalidatePath("/admin", "layout");
  return done();
}

/* ======================= Products ======================= */

const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2, "Tên quá ngắn").max(120),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(3000).default(""),
  price: z.number().int().min(0).max(100_000_000),
  oldPrice: z.number().int().min(0).max(100_000_000).nullable(),
  ageRange: z.enum(["0-1", "1-3", "3-6", "6-12"]).nullable(),
  categoryId: z.string().uuid().nullable(),
  options: z.array(z.string().trim().min(1).max(60)).max(60),
  isVisible: z.boolean(),
  isOutOfStock: z.boolean(),
  isFeatured: z.boolean(),
  images: z.array(z.string().min(1).max(300)).max(20), // storage paths, in order
});
export type ProductInput = z.input<typeof productSchema>;

export async function saveProduct(input: ProductInput): Promise<ActionResult & { id?: string }> {
  const a = await adminOrError();
  if (!a.ok) return fail(a.error);
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ");
  const d = parsed.data;
  if (d.isVisible && d.price <= 0) return fail("Cần nhập giá trước khi hiện sản phẩm");
  if (d.oldPrice !== null && d.oldPrice <= d.price) d.oldPrice = null;

  const row = {
    name: d.name,
    slug: slugify(d.slug || d.name) || `sp-${Date.now()}`,
    description: d.description,
    price: d.price,
    old_price: d.oldPrice,
    age_range: d.ageRange,
    category_id: d.categoryId,
    options: [...new Set(d.options)],
    is_visible: d.isVisible,
    is_out_of_stock: d.isOutOfStock,
    is_featured: d.isFeatured,
  };

  let id = d.id;
  if (id) {
    const { error } = await a.supabase.from("products").update(row).eq("id", id);
    if (error) return fail(dbError(error.message));
  } else {
    const { data: last } = await a.supabase.from("products").select("sort_order").order("sort_order", { ascending: false }).limit(1);
    const { data, error } = await a.supabase
      .from("products")
      .insert({ ...row, sort_order: (last?.[0]?.sort_order ?? 0) + 1 })
      .select("id")
      .single();
    if (error) return fail(dbError(error.message));
    id = data.id;
  }

  // Replace image list (files are already uploaded to storage by the browser).
  const { error: delErr } = await a.supabase.from("product_images").delete().eq("product_id", id);
  if (delErr) return fail(dbError(delErr.message));
  if (d.images.length) {
    const { error: imgErr } = await a.supabase
      .from("product_images")
      .insert(d.images.map((path, i) => ({ product_id: id, path, sort_order: i })));
    if (imgErr) return fail(dbError(imgErr.message));
  }

  revalidateShop();
  return { ok: true, message: "Đã lưu sản phẩm", id };
}

export async function toggleProduct(
  id: string,
  field: "is_visible" | "is_out_of_stock" | "is_featured",
  value: boolean,
): Promise<ActionResult> {
  const a = await adminOrError();
  if (!a.ok) return fail(a.error);
  if (field === "is_visible" && value) {
    const { data } = await a.supabase.from("products").select("price").eq("id", id).single();
    if (!data || data.price <= 0) return fail("Cần nhập giá trước khi hiện sản phẩm");
  }
  const { error } = await a.supabase.from("products").update({ [field]: value }).eq("id", id);
  if (error) return fail(dbError(error.message));
  revalidateShop();
  return done();
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const a = await adminOrError();
  if (!a.ok) return fail(a.error);
  const { data: imgs } = await a.supabase.from("product_images").select("path").eq("product_id", id);
  const { error } = await a.supabase.from("products").delete().eq("id", id);
  if (error) return fail(dbError(error.message));
  const paths = (imgs ?? []).map((i) => i.path);
  if (paths.length) await a.supabase.storage.from("media").remove(paths);
  revalidateShop();
  return done("Đã xoá sản phẩm");
}

/* ======================= Categories ======================= */

export async function saveCategory(input: { id?: string; name: string; imagePath: string | null }): Promise<ActionResult> {
  const a = await adminOrError();
  if (!a.ok) return fail(a.error);
  const name = input.name.trim();
  if (name.length < 2 || name.length > 60) return fail("Tên danh mục 2–60 ký tự");
  const row = { name, slug: slugify(name), image_path: input.imagePath };
  if (input.id) {
    const { error } = await a.supabase.from("categories").update(row).eq("id", input.id);
    if (error) return fail(dbError(error.message));
  } else {
    const { data: last } = await a.supabase.from("categories").select("sort_order").order("sort_order", { ascending: false }).limit(1);
    const { error } = await a.supabase.from("categories").insert({ ...row, sort_order: (last?.[0]?.sort_order ?? 0) + 1 });
    if (error) return fail(dbError(error.message));
  }
  revalidateShop();
  return done("Đã lưu danh mục");
}

export async function moveRow(table: "categories" | "videos" | "products", id: string, dir: -1 | 1): Promise<ActionResult> {
  const a = await adminOrError();
  if (!a.ok) return fail(a.error);
  const { data } = await a.supabase.from(table).select("id, sort_order").order("sort_order");
  const rows = data ?? [];
  const i = rows.findIndex((r) => r.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= rows.length) return done();
  [rows[i], rows[j]] = [rows[j], rows[i]];
  for (const [k, r] of rows.entries()) {
    if (r.sort_order !== k) await a.supabase.from(table).update({ sort_order: k }).eq("id", r.id);
  }
  revalidateShop();
  return done();
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const a = await adminOrError();
  if (!a.ok) return fail(a.error);
  const { count } = await a.supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", id);
  if (count) return fail(`Danh mục còn ${count} sản phẩm — chuyển sản phẩm sang danh mục khác trước.`);
  const { error } = await a.supabase.from("categories").delete().eq("id", id);
  if (error) return fail(dbError(error.message));
  revalidateShop();
  return done("Đã xoá danh mục");
}

/* ======================= Videos ======================= */

export async function saveVideo(input: {
  id?: string;
  path: string;
  posterPath: string | null;
  productId: string | null;
}): Promise<ActionResult> {
  const a = await adminOrError();
  if (!a.ok) return fail(a.error);
  const row = { path: input.path, poster_path: input.posterPath, product_id: input.productId };
  if (input.id) {
    const { error } = await a.supabase.from("videos").update(row).eq("id", input.id);
    if (error) return fail(dbError(error.message));
  } else {
    const { data: last } = await a.supabase.from("videos").select("sort_order").order("sort_order", { ascending: false }).limit(1);
    const { error } = await a.supabase.from("videos").insert({ ...row, sort_order: (last?.[0]?.sort_order ?? 0) + 1 });
    if (error) return fail(dbError(error.message));
  }
  revalidateShop();
  return done("Đã lưu video");
}

export async function deleteVideo(id: string): Promise<ActionResult> {
  const a = await adminOrError();
  if (!a.ok) return fail(a.error);
  const { data } = await a.supabase.from("videos").select("path, poster_path").eq("id", id).single();
  const { error } = await a.supabase.from("videos").delete().eq("id", id);
  if (error) return fail(dbError(error.message));
  const paths = [data?.path, data?.poster_path].filter(Boolean) as string[];
  if (paths.length) await a.supabase.storage.from("media").remove(paths);
  revalidateShop();
  return done("Đã xoá video");
}

/* ======================= Settings ======================= */

const settingsSchema = z.object({
  shop_name: z.string().trim().min(1).max(80),
  hotline: z.string().trim().max(20),
  zalo_phone: z.string().trim().max(20),
  topbar_text: z.string().trim().max(160),
  promo_title: z.string().trim().max(80),
  promo_text: z.string().trim().max(240),
  zalo_message_template: z.string().trim().min(10).max(2000),
});

export async function saveSettings(input: z.input<typeof settingsSchema>): Promise<ActionResult> {
  const a = await adminOrError();
  if (!a.ok) return fail(a.error);
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ");
  const d = parsed.data;
  if (d.zalo_phone && !VN_PHONE.test(normalizePhone(d.zalo_phone))) return fail("Số Zalo chưa đúng");
  const { error } = await a.supabase
    .from("settings")
    .update({ ...d, zalo_phone: d.zalo_phone ? normalizePhone(d.zalo_phone) : "" })
    .eq("id", 1);
  if (error) return fail(dbError(error.message));
  revalidateShop();
  return done("Đã lưu cài đặt");
}
