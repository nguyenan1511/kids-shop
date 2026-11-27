"use client";

import { useState } from "react";
import type { Product } from "@/lib/catalog";
import { AGE_RANGES } from "@/lib/format";
import { ProductCard } from "./product-card";

export function BestSellers({ products }: { products: Product[] }) {
  const [age, setAge] = useState<string>("");
  const list = (age ? products.filter((p) => p.age_range === age) : products).slice(0, 8);

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {[{ value: "", label: "Tất cả" }, ...AGE_RANGES].map((a) => (
          <button
            key={a.value}
            onClick={() => setAge(a.value)}
            className={`rounded-full border px-4 py-2.5 text-sm font-medium ${
              age === a.value ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <p className="rounded-[20px] border border-dashed border-line bg-white p-8 text-center text-ink-soft">
          Chưa có đồ chơi cho độ tuổi này — shop đang cập nhật thêm.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {list.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      )}
    </>
  );
}
