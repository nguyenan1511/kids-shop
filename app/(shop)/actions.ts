"use server";

import { getCartProducts } from "@/lib/catalog";
import { createServiceClient } from "@/lib/supabase/server";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation";
import type { CartLine } from "@/components/shop/cart";

/** Re-check cart lines against the database: prices, visibility, stock, options. */
export async function refreshCart(lines: CartLine[]): Promise<CartLine[]> {
  const ids = [...new Set(lines.map((l) => l.productId))].filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  const products = await getCartProducts(ids);
  const byId = new Map(products.map((p) => [p.id, p]));
  return lines.map((l) => {
    const p = byId.get(l.productId);
    if (!p || p.is_out_of_stock || p.price <= 0) return { ...l, unavailable: true, priceChanged: false };
    const opts = (p.options as string[]) ?? [];
    const optionOk = opts.length === 0 ? l.option === null : l.option !== null && opts.includes(l.option);
    const imgs = [...((p.product_images as { path: string; sort_order: number }[]) ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    return {
      ...l,
      name: p.name,
      slug: p.slug,
      image: imgs[0]?.path ?? l.image,
      priceChanged: p.price !== l.price,
      price: p.price,
      unavailable: !optionOk,
    };
  });
}

export type PlaceOrderResult =
  | { ok: true; code: string; total: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; unavailableIds?: string[] };

const ERRORS: Record<string, string> = {
  INVALID_PHONE: "Số điện thoại chưa đúng",
  INVALID_ADDRESS: "Vui lòng nhập địa chỉ nhận hàng",
  EMPTY_CART: "Giỏ hàng đang trống",
  RATE_LIMITED: "Bạn đã đặt nhiều đơn trong 1 giờ qua. Vui lòng nhắn Zalo cho shop để được hỗ trợ.",
  INVALID_QTY: "Số lượng không hợp lệ",
  TOO_MANY_ITEMS: "Giỏ hàng quá nhiều sản phẩm",
};

export async function placeOrder(input: CheckoutInput): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = String(issue.path[0] ?? "form");
      fieldErrors[k] ??= issue.message;
    }
    return { ok: false, error: "Vui lòng kiểm tra lại thông tin", fieldErrors };
  }
  const d = parsed.data;

  // Honeypot: bots fill every field. Pretend success, store nothing.
  if (d.website) return { ok: true, code: "TC-00000", total: 0 };

  const { data, error } = await createServiceClient().rpc("place_order", {
    p_phone: d.phone,
    p_address: d.address,
    p_name: d.name,
    p_note: d.note,
    p_items: d.items.map((i) => ({ product_id: i.productId, option: i.option, qty: i.qty })),
  });

  if (error) {
    const msg = error.message ?? "";
    const m = msg.match(/^(PRODUCT_UNAVAILABLE|OUT_OF_STOCK|INVALID_OPTION):(.+)$/);
    if (m) {
      return {
        ok: false,
        error: "Một số sản phẩm vừa hết hàng hoặc thay đổi. Vui lòng kiểm tra lại giỏ hàng.",
        unavailableIds: [m[2]],
      };
    }
    const known = ERRORS[msg];
    if (known) {
      return {
        ok: false,
        error: known,
        fieldErrors: msg === "INVALID_PHONE" ? { phone: known } : msg === "INVALID_ADDRESS" ? { address: known } : undefined,
      };
    }
    console.error("place_order failed", error);
    return { ok: false, error: "Có lỗi khi đặt hàng. Vui lòng thử lại." };
  }

  const row = (data as { order_code: string; order_total: number }[])[0];
  return { ok: true, code: row.order_code, total: row.order_total };
}
