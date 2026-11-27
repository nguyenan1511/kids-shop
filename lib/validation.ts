import { z } from "zod";

/** Normalize "+84 912 345 678" / "0912.345.678" → "0912345678". */
export function normalizePhone(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("84") && digits.length === 11) digits = "0" + digits.slice(2);
  return digits;
}

export const VN_PHONE = /^0[35789][0-9]{8}$/;

export function isValidPhone(input: string): boolean {
  return VN_PHONE.test(normalizePhone(input));
}

export const checkoutSchema = z.object({
  phone: z
    .string()
    .transform(normalizePhone)
    .refine((v) => VN_PHONE.test(v), "Số điện thoại chưa đúng"),
  address: z.string().trim().min(5, "Vui lòng nhập địa chỉ nhận hàng").max(300, "Địa chỉ quá dài"),
  name: z.string().trim().max(60).optional().default(""),
  note: z.string().trim().max(300).optional().default(""),
  website: z.string().optional().default(""), // honeypot — must stay empty
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        option: z.string().max(60).nullable(),
        qty: z.number().int().min(1).max(99),
      }),
    )
    .min(1, "Giỏ hàng đang trống")
    .max(50),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
