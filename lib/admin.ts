import "server-only";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";

/** Use at the top of every admin page/action. Redirects if not an admin. */
export async function requireAdmin() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/dang-nhap");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin/dang-nhap?loi=khong-co-quyen");

  return { supabase, user };
}

/** For server actions: returns an error instead of redirecting. */
export async function adminOrError() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Phiên đăng nhập đã hết. Vui lòng đăng nhập lại." };
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return { ok: false as const, error: "Bạn không có quyền admin." };
  return { ok: true as const, supabase, user };
}

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const DB_ERRORS: Record<string, string> = {
  NOT_ADMIN: "Bạn không có quyền admin.",
  ORDER_NOT_FOUND: "Không tìm thấy đơn hàng.",
  CANCEL_REASON_REQUIRED: "Vui lòng chọn lý do huỷ.",
  ORDER_LOCKED: "Đơn đã xác nhận — không sửa được thông tin này nữa.",
  LAST_ITEM: "Đơn phải còn ít nhất 1 sản phẩm. Muốn bỏ hết thì huỷ đơn.",
  INVALID_QTY: "Số lượng không hợp lệ.",
  ITEM_NOT_FOUND: "Không tìm thấy sản phẩm trong đơn.",
};

export function dbError(message: string | undefined): string {
  if (!message) return "Có lỗi xảy ra.";
  if (message.startsWith("INVALID_TRANSITION")) return "Không thể chuyển sang trạng thái này (đơn vừa được người khác cập nhật?). Tải lại trang.";
  if (message.includes("duplicate key") && message.includes("slug")) return "Đường dẫn (slug) đã tồn tại, hãy đổi tên khác.";
  return DB_ERRORS[message] ?? message;
}
