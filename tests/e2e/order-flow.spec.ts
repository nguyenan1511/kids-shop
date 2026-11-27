import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import path from "node:path";
import { loadEnv } from "../../scripts/env.mjs";

loadEnv(path.resolve(__dirname, "../.."));

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_EMAIL = "e2e-admin@example.test";
const ADMIN_PASS = "e2e-password-123";

// A random valid VN mobile number so rate limits don't collide between runs.
const phone = `09${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`;

test.beforeAll(async () => {
  const db = createClient(URL, SERVICE, { auth: { persistSession: false } });
  const { data } = await db.auth.admin.listUsers({ perPage: 1000 });
  let user = data?.users.find((u) => u.email === ADMIN_EMAIL);
  if (!user) {
    const { data: created, error } = await db.auth.admin.createUser({ email: ADMIN_EMAIL, password: ADMIN_PASS, email_confirm: true });
    if (error) throw error;
    user = created.user;
  }
  await db.from("admins").upsert({ user_id: user!.id, email: ADMIN_EMAIL });
});

test("security: anonymous visitors cannot read or create orders directly", async () => {
  const anon = createClient(URL, ANON, { auth: { persistSession: false } });
  const { data } = await anon.from("orders").select("*");
  expect(data ?? []).toHaveLength(0);
  const { error: insertErr } = await anon.from("orders").insert({ code: "TC-HACK1", phone, address: "x", subtotal: 0, total: 0 });
  expect(insertErr).not.toBeNull();
  const { error: rpcErr } = await anon.rpc("place_order", { p_phone: phone, p_address: "12345", p_name: "", p_note: "", p_items: [] });
  expect(rpcErr).not.toBeNull();
  const { data: hidden } = await anon.from("products").select("id").eq("is_visible", false);
  expect(hidden ?? []).toHaveLength(0);
});

test("customer orders → admin moves it to Hoàn thành", async ({ page }) => {
  // --- Shop: add a product with options + one without ---
  await page.goto("/san-pham/xe-dieu-khien-bien-hinh-robot");
  await page.getByRole("button", { name: "Thêm vào giỏ" }).click();
  await expect(page.getByRole("dialog", { name: "Giỏ hàng" })).toBeVisible();
  await page.getByRole("button", { name: "Đóng" }).click();

  await page.goto("/san-pham/dan-piano-kem-micro");
  await page.getByRole("button", { name: "Mua ngay" }).click();
  await expect(page.getByText("Vui lòng chọn mẫu")).toBeVisible(); // option required
  await page.getByRole("button", { name: "Hồng", exact: true }).click();
  await page.getByRole("button", { name: "Mua ngay" }).click();

  // --- Checkout ---
  await expect(page).toHaveURL(/thanh-toan/);
  await expect(page.getByText("350.000đ").first()).toBeVisible(); // 125k + 225k
  await page.getByRole("button", { name: "Đặt hàng" }).click();
  await expect(page.getByText(/Số điện thoại chưa đúng/)).toBeVisible();

  await page.getByPlaceholder("0912 345 678").fill(phone);
  await page.getByPlaceholder(/Số nhà, đường/).fill("12 Lê Lợi, P. Bến Nghé, Q.1, TP.HCM");
  await page.getByRole("button", { name: "Đặt hàng" }).click();

  await expect(page).toHaveURL(/dat-hang-thanh-cong\?ma=TC-/);
  await expect(page.getByRole("heading", { name: "Đặt hàng thành công!" })).toBeVisible();
  const code = new globalThis.URL(page.url()).searchParams.get("ma")!;

  // --- Admin ---
  await page.goto("/admin");
  await expect(page).toHaveURL(/dang-nhap/);
  await page.getByLabel("Tên đăng nhập").fill(ADMIN_EMAIL);
  await page.getByLabel("Mật khẩu").fill(ADMIN_PASS);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByRole("heading", { name: "Đơn hàng" })).toBeVisible();

  await page.goto(`/admin/don/${code}`);
  await expect(page.getByText(phone).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Nhắn Zalo" })).toHaveAttribute("href", `https://zalo.me/${phone}`);

  const step = async (button: RegExp, status: string) => {
    await page.getByRole("button", { name: button }).click();
    await page.getByRole("button", { name: "Xác nhận" }).click();
    await expect(page.locator("h1 + span", { hasText: status })).toBeVisible();
  };

  await step(/Đã nhắn Zalo/, "Đã liên hệ Zalo");

  // confirming requires a shipping fee
  await page.getByRole("button", { name: /Khách đã xác nhận/ }).click();
  await expect(page.getByText("Nhập phí ship trước khi xác nhận")).toBeVisible();
  await page.getByRole("button", { name: "Quay lại" }).click();
  await page.getByLabel("Phí ship (nghìn đồng)").fill("30");
  await page.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page.getByText("380.000đ", { exact: true })).toBeVisible();

  await step(/Khách đã xác nhận/, "Đã xác nhận");
  await step(/Đã giao cho shipper/, "Đang giao");
  await step(/Đã giao xong/, "Hoàn thành");
  await expect(page.getByText("Đơn đã kết thúc")).toBeVisible();
});
