import { describe, expect, it } from "vitest";
import { formatVnd, slugify, timeAgo } from "@/lib/format";
import {
  NEXT_STATUSES,
  ORDER_STATUSES,
  canTransition,
  fillZaloTemplate,
  isEditable,
  isFinal,
  orderTotal,
  zaloLink,
} from "@/lib/orders";
import { checkoutSchema, isValidPhone, normalizePhone } from "@/lib/validation";

describe("formatVnd", () => {
  it("formats with dots and đ", () => {
    expect(formatVnd(249000)).toBe("249.000đ");
    expect(formatVnd(0)).toBe("0đ");
    expect(formatVnd(1234567)).toBe("1.234.567đ");
  });
});

describe("slugify", () => {
  it("strips Vietnamese accents", () => {
    expect(slugify("Xe đua F1 drift điều khiển")).toBe("xe-dua-f1-drift-dieu-khien");
    expect(slugify("  Bộ bếp — Dream Kitchen!! ")).toBe("bo-bep-dream-kitchen");
    expect(slugify("Đàn piano")).toBe("dan-piano");
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-11-27T10:00:00Z");
  it("uses friendly units", () => {
    expect(timeAgo("2026-11-27T09:59:30Z", now)).toBe("vừa xong");
    expect(timeAgo("2026-11-27T09:55:00Z", now)).toBe("5 phút trước");
    expect(timeAgo("2026-11-27T07:00:00Z", now)).toBe("3 giờ trước");
    expect(timeAgo("2026-11-25T10:00:00Z", now)).toBe("2 ngày trước");
  });
});

describe("phone validation", () => {
  it("normalizes common formats", () => {
    expect(normalizePhone("0912 345 678")).toBe("0912345678");
    expect(normalizePhone("0912.345.678")).toBe("0912345678");
    expect(normalizePhone("+84 912 345 678")).toBe("0912345678");
  });
  it("accepts VN mobile numbers only", () => {
    expect(isValidPhone("0912345678")).toBe(true);
    expect(isValidPhone("0387654321")).toBe(true);
    expect(isValidPhone("091234567")).toBe(false); // 9 digits
    expect(isValidPhone("0212345678")).toBe(false); // landline prefix
    expect(isValidPhone("abc")).toBe(false);
  });
});

describe("checkoutSchema", () => {
  const item = { productId: "3f1c2a7e-1111-4222-8333-944455556666", option: null, qty: 1 };
  it("accepts a minimal order", () => {
    const r = checkoutSchema.safeParse({ phone: "0912 345 678", address: "12 Lê Lợi, Q1, HCM", items: [item] });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.phone).toBe("0912345678");
  });
  it("rejects bad phone, short address, empty cart, bad qty", () => {
    expect(checkoutSchema.safeParse({ phone: "123", address: "12 Lê Lợi", items: [item] }).success).toBe(false);
    expect(checkoutSchema.safeParse({ phone: "0912345678", address: "Q1", items: [item] }).success).toBe(false);
    expect(checkoutSchema.safeParse({ phone: "0912345678", address: "12 Lê Lợi", items: [] }).success).toBe(false);
    expect(
      checkoutSchema.safeParse({ phone: "0912345678", address: "12 Lê Lợi", items: [{ ...item, qty: 0 }] }).success,
    ).toBe(false);
  });
});

describe("order status rules", () => {
  it("follows the approved flow", () => {
    expect(canTransition("new", "contacted")).toBe(true);
    expect(canTransition("contacted", "confirmed")).toBe(true);
    expect(canTransition("confirmed", "shipping")).toBe(true);
    expect(canTransition("shipping", "completed")).toBe(true);
    expect(canTransition("shipping", "returned")).toBe(true);
    expect(canTransition("new", "cancelled")).toBe(true);
  });
  it("blocks skipping and going backwards", () => {
    expect(canTransition("new", "shipping")).toBe(false);
    expect(canTransition("confirmed", "new")).toBe(false);
    expect(canTransition("shipping", "cancelled")).toBe(false);
    expect(canTransition("completed", "returned")).toBe(false);
  });
  it("final statuses have no next step", () => {
    expect(isFinal("completed")).toBe(true);
    expect(isFinal("cancelled")).toBe(true);
    expect(isFinal("returned")).toBe(true);
    expect(isFinal("new")).toBe(false);
  });
  it("every status has a rule", () => {
    for (const s of ORDER_STATUSES) expect(NEXT_STATUSES[s]).toBeDefined();
  });
  it("only new/contacted orders are editable", () => {
    expect(isEditable("new")).toBe(true);
    expect(isEditable("contacted")).toBe(true);
    expect(isEditable("confirmed")).toBe(false);
  });
});

describe("totals + Zalo message", () => {
  it("adds shipping when set", () => {
    expect(orderTotal(250000, null)).toBe(250000);
    expect(orderTotal(250000, 30000)).toBe(280000);
  });
  it("fills the template", () => {
    const msg = fillZaloTemplate(
      "Chào {ten}, đơn {ma}:\n{san_pham}\nShip: {phi_ship}\nTổng: {tong}\n{dia_chi}",
      {
        code: "TC-AB2CD",
        customer_name: null,
        address: "12 Lê Lợi",
        subtotal: 264000,
        shipping_fee: 30000,
        items: [
          { product_name: "Xe đua F1", option: "Đỏ", qty: 1, unit_price: 249000 },
          { product_name: "Khủng long mini", option: null, qty: 1, unit_price: 15000 },
        ],
      },
      formatVnd,
    );
    expect(msg).toContain("Chào anh/chị, đơn TC-AB2CD");
    expect(msg).toContain("- Xe đua F1 (Đỏ) x1: 249.000đ");
    expect(msg).toContain("- Khủng long mini x1: 15.000đ");
    expect(msg).toContain("Ship: 30.000đ");
    expect(msg).toContain("Tổng: 294.000đ");
  });
  it("says 'shop báo sau' without a fee and 'Miễn phí' for 0", () => {
    const base = { code: "TC-X", customer_name: "Lan", address: "a", subtotal: 1000, items: [] };
    expect(fillZaloTemplate("{phi_ship}", { ...base, shipping_fee: null }, formatVnd)).toBe("(shop báo sau)");
    expect(fillZaloTemplate("{phi_ship}", { ...base, shipping_fee: 0 }, formatVnd)).toBe("Miễn phí");
  });
  it("builds zalo.me links", () => {
    expect(zaloLink("0912 345 678")).toBe("https://zalo.me/0912345678");
  });
});
