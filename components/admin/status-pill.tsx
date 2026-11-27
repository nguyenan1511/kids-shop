import { STATUS_LABEL, STATUS_STYLE, type OrderStatus } from "@/lib/orders";

export function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
