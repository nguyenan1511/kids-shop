"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconCart, IconMinus, IconPlus } from "@/components/icons";
import { useCart } from "./cart";

type Props = {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    image: string;
    options: string[];
    outOfStock: boolean;
  };
};

export function ProductBuy({ product }: Props) {
  const { add, setOpen } = useCart();
  const router = useRouter();
  const [option, setOption] = useState<string | null>(product.options.length === 1 ? product.options[0] : null);
  const [qty, setQty] = useState(1);
  const [needOption, setNeedOption] = useState(false);

  const commit = () => {
    if (product.options.length > 0 && !option) {
      setNeedOption(true);
      return false;
    }
    add(
      { productId: product.id, slug: product.slug, name: product.name, price: product.price, image: product.image, option },
      qty,
    );
    return true;
  };

  if (product.outOfStock) {
    return (
      <div className="rounded-full bg-line py-4 text-center font-semibold text-ink-soft">
        Hết hàng — nhắn Zalo shop để đặt trước
      </div>
    );
  }

  return (
    <div>
      {product.options.length > 0 && (
        <div className="mb-5">
          <p className={`mb-2 text-sm font-semibold ${needOption ? "text-coral-dark" : ""}`}>
            {needOption ? "Vui lòng chọn mẫu" : "Chọn mẫu"}
            {option && <span className="font-normal text-ink-soft">: {option}</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {product.options.map((o) => (
              <button
                key={o}
                onClick={() => {
                  setOption(o);
                  setNeedOption(false);
                }}
                className={`rounded-xl border-2 px-4 py-2 text-sm font-medium ${
                  option === o ? "border-coral bg-tint-coral" : needOption ? "border-coral/40 bg-white" : "border-line bg-white hover:border-ink"
                }`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-5 flex items-center gap-4">
        <span className="text-sm font-semibold">Số lượng</span>
        <div className="flex items-center rounded-full border border-line bg-white">
          <button className="grid h-11 w-11 place-items-center" aria-label="Giảm" onClick={() => setQty((q) => Math.max(1, q - 1))}>
            <IconMinus size={18} />
          </button>
          <span className="w-8 text-center font-semibold">{qty}</span>
          <button className="grid h-11 w-11 place-items-center" aria-label="Tăng" onClick={() => setQty((q) => Math.min(99, q + 1))}>
            <IconPlus size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => commit() && setOpen(true)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-ink bg-white px-6 py-3.5 font-semibold"
        >
          <IconCart size={20} /> Thêm vào giỏ
        </button>
        <button
          onClick={() => commit() && router.push("/thanh-toan")}
          className="flex-1 rounded-full bg-coral px-6 py-4 font-semibold text-white hover:bg-coral-dark"
        >
          Mua ngay
        </button>
      </div>
    </div>
  );
}
