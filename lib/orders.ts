// Order status rules — mirrors public.change_order_status() in the database.

export const ORDER_STATUSES = [
  "new",
  "contacted",
  "confirmed",
  "shipping",
  "completed",
  "cancelled",
  "returned",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "Mới",
  contacted: "Đã liên hệ Zalo",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  completed: "Hoàn thành",
  cancelled: "Đã huỷ",
  returned: "Hoàn hàng",
};

/** Tailwind classes for the status pill. */
export const STATUS_STYLE: Record<OrderStatus, string> = {
  new: "bg-coral text-white",
  contacted: "bg-sky/30 text-ink",
  confirmed: "bg-tint-teal text-ink",
  shipping: "bg-tint-sun text-ink",
  completed: "bg-teal text-white",
  cancelled: "bg-line text-ink-soft",
  returned: "bg-tint-lilac text-ink",
};

/** Label for the button that moves an order INTO a status. */
export const ACTION_LABEL: Record<OrderStatus, string> = {
  new: "",
  contacted: "Đã nhắn Zalo",
  confirmed: "Khách đã xác nhận",
  shipping: "Đã giao cho shipper",
  completed: "Đã giao xong, thu tiền",
  cancelled: "Huỷ đơn",
  returned: "Hoàn hàng",
};

export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  new: ["contacted", "cancelled"],
  contacted: ["confirmed", "cancelled"],
  confirmed: ["shipping", "cancelled"],
  shipping: ["completed", "returned"],
  completed: [],
  cancelled: [],
  returned: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return NEXT_STATUSES[from].includes(to);
}

export function isFinal(status: OrderStatus): boolean {
  return NEXT_STATUSES[status].length === 0;
}

/** Phone / address / qty can be edited only before the customer confirms. */
export function isEditable(status: OrderStatus): boolean {
  return status === "new" || status === "contacted";
}

export const CANCEL_REASONS = [
  "Khách không phản hồi Zalo",
  "Khách huỷ đơn",
  "Hết hàng",
  "Đơn ảo / spam",
] as const;

/** Admin tab groups. */
export const STATUS_TABS: { key: string; label: string; statuses: OrderStatus[] }[] = [
  { key: "new", label: "Mới", statuses: ["new"] },
  { key: "contacted", label: "Đã liên hệ", statuses: ["contacted"] },
  { key: "confirmed", label: "Đã xác nhận", statuses: ["confirmed"] },
  { key: "shipping", label: "Đang giao", statuses: ["shipping"] },
  { key: "completed", label: "Hoàn thành", statuses: ["completed"] },
  { key: "closed", label: "Huỷ / Hoàn", statuses: ["cancelled", "returned"] },
];

export function orderTotal(subtotal: number, shippingFee: number | null): number {
  return subtotal + (shippingFee ?? 0);
}

/** Fill the Zalo confirmation template. */
export function fillZaloTemplate(
  template: string,
  o: {
    code: string;
    customer_name: string | null;
    address: string;
    subtotal: number;
    shipping_fee: number | null;
    items: { product_name: string; option: string | null; qty: number; unit_price: number }[];
  },
  fmt: (n: number) => string,
): string {
  const lines = o.items
    .map((i) => `- ${i.product_name}${i.option ? ` (${i.option})` : ""} x${i.qty}: ${fmt(i.unit_price * i.qty)}`)
    .join("\n");
  const map: Record<string, string> = {
    "{ten}": o.customer_name?.trim() || "anh/chị",
    "{ma}": o.code,
    "{san_pham}": lines,
    "{tien_hang}": fmt(o.subtotal),
    "{phi_ship}": o.shipping_fee == null ? "(shop báo sau)" : o.shipping_fee === 0 ? "Miễn phí" : fmt(o.shipping_fee),
    "{tong}": fmt(orderTotal(o.subtotal, o.shipping_fee)),
    "{dia_chi}": o.address,
  };
  return template.replace(/\{[a-z_]+\}/g, (k) => map[k] ?? k);
}

/** zalo.me link for a Vietnamese phone number. */
export function zaloLink(phone: string): string {
  return `https://zalo.me/${phone.replace(/\D/g, "")}`;
}
