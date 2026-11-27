"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { IconAlert, IconCheck, IconChevronLeft, IconClose, IconEye, IconTrash } from "@/components/icons";
import { deleteProduct, saveProduct, type ProductInput } from "@/app/admin/actions";
import { AGE_RANGES, formatVnd } from "@/lib/format";
import { ImageUploader } from "./image-uploader";
import { Toggle } from "./toggle";

export type ProductFormValue = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  oldPrice: number | null;
  ageRange: string | null;
  categoryId: string | null;
  options: string[];
  isVisible: boolean;
  isOutOfStock: boolean;
  isFeatured: boolean;
  images: string[];
};

const field = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 outline-none focus:border-ink";
const card = "rounded-[20px] border border-line bg-white p-5";

/** Price input in thousands: "249" → 249000. */
function toVnd(s: string): number {
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 1000) : 0;
}
function toK(v: number | null): string {
  return v ? String(v / 1000) : "";
}

export function ProductForm({
  initial,
  categories,
}: {
  initial: ProductFormValue;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [v, setV] = useState(initial);
  const [price, setPrice] = useState(toK(initial.price));
  const [oldPrice, setOldPrice] = useState(toK(initial.oldPrice));
  const [optInput, setOptInput] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = <K extends keyof ProductFormValue>(k: K, val: ProductFormValue[K]) => setV((x) => ({ ...x, [k]: val }));

  const addOption = () => {
    const parts = optInput.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) set("options", [...new Set([...v.options, ...parts])]);
    setOptInput("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    start(async () => {
      const r = await saveProduct({
        ...v,
        price: toVnd(price),
        oldPrice: oldPrice ? toVnd(oldPrice) : null,
        ageRange: (v.ageRange || null) as ProductInput["ageRange"],
      });
      if (!r.ok) {
        setMsg({ ok: false, text: r.error });
        return;
      }
      setMsg({ ok: true, text: r.message ?? "Đã lưu" });
      if (!v.id && r.id) router.replace(`/admin/san-pham/${r.id}`);
      router.refresh();
    });
  };

  const folder = `products/${v.id ?? "new"}`;

  return (
    <form onSubmit={submit} className="mx-auto max-w-[1000px]">
      <Link href="/admin/san-pham" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-coral">
        <IconChevronLeft size={18} /> Sản phẩm
      </Link>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px] font-extrabold">{v.id ? "Sửa sản phẩm" : "Thêm sản phẩm"}</h1>
        {v.id && v.isVisible && (
          <Link href={`/san-pham/${initial.slug}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal">
            <IconEye size={18} /> Xem trên shop
          </Link>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid h-fit gap-5">
          <section className={card}>
            <label className="mb-4 block">
              <span className="mb-1.5 block text-sm font-semibold">Tên sản phẩm *</span>
              <input required value={v.name} onChange={(e) => set("name", e.target.value)} className={field} maxLength={120} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Mô tả</span>
              <textarea rows={6} value={v.description} onChange={(e) => set("description", e.target.value)} className={`${field} resize-y`} maxLength={3000} />
            </label>
          </section>

          <section className={card}>
            <h2 className="mb-3 font-bold">Ảnh sản phẩm</h2>
            <ImageUploader value={v.images} onChange={(imgs) => set("images", imgs)} folder={folder} />
          </section>

          <section className={card}>
            <h2 className="mb-1 font-bold">Mẫu / màu (không bắt buộc)</h2>
            <p className="mb-3 text-sm text-ink-soft">Khách phải chọn 1 mẫu khi mua. Tất cả mẫu cùng giá.</p>
            <div className="mb-3 flex flex-wrap gap-2">
              {v.options.map((o) => (
                <span key={o} className="inline-flex items-center gap-1 rounded-full bg-cream py-1.5 pl-3 pr-1.5 text-sm">
                  {o}
                  <button type="button" aria-label={`Xoá ${o}`} onClick={() => set("options", v.options.filter((x) => x !== o))} className="grid h-5 w-5 place-items-center rounded-full hover:bg-line">
                    <IconClose size={12} />
                  </button>
                </span>
              ))}
              {v.options.length === 0 && <span className="text-sm text-ink-soft">Chưa có mẫu nào.</span>}
            </div>
            <div className="flex gap-2">
              <input
                value={optInput}
                onChange={(e) => setOptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addOption();
                  }
                }}
                placeholder="VD: Đỏ, Xanh, Tím — Enter để thêm"
                className={field}
              />
              <button type="button" onClick={addOption} className="shrink-0 rounded-xl bg-ink px-4 text-sm font-semibold text-white">
                Thêm
              </button>
            </div>
          </section>
        </div>

        <div className="grid h-fit gap-5 lg:sticky lg:top-6">
          <section className={card}>
            <div className="mb-4 flex justify-around">
              <Toggle label="Hiện trên shop" on={v.isVisible} onChange={(x) => set("isVisible", x)} />
              <Toggle label="Hết hàng" on={v.isOutOfStock} onChange={(x) => set("isOutOfStock", x)} tone="ink" />
              <Toggle label="Nổi bật" on={v.isFeatured} onChange={(x) => set("isFeatured", x)} tone="sun" />
            </div>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">Giá bán *</span>
                <span className="flex items-center rounded-xl border border-line pr-3 focus-within:border-ink">
                  <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="249" className="w-full rounded-xl px-3.5 py-2.5 outline-none" />
                  <span className="text-sm text-ink-soft">.000đ</span>
                </span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">Giá gốc</span>
                <span className="flex items-center rounded-xl border border-line pr-3 focus-within:border-ink">
                  <input inputMode="decimal" value={oldPrice} onChange={(e) => setOldPrice(e.target.value.replace(/[^\d.,]/g, ""))} placeholder="355" className="w-full rounded-xl px-3.5 py-2.5 outline-none" />
                  <span className="text-sm text-ink-soft">.000đ</span>
                </span>
              </label>
            </div>
            <p className="mb-4 text-xs text-ink-soft">
              Nhập theo nghìn đồng. {toVnd(price) > 0 && <>Giá bán: <strong className="text-coral">{formatVnd(toVnd(price))}</strong>. </>}
              Giá gốc (gạch ngang) phải cao hơn giá bán.
            </p>
            <label className="mb-4 block">
              <span className="mb-1.5 block text-sm font-semibold">Danh mục</span>
              <select value={v.categoryId ?? ""} onChange={(e) => set("categoryId", e.target.value || null)} className={field}>
                <option value="">— Chưa chọn —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Độ tuổi</span>
              <select value={v.ageRange ?? ""} onChange={(e) => set("ageRange", e.target.value || null)} className={field}>
                <option value="">— Không ghi —</option>
                {AGE_RANGES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </label>
          </section>

          {msg && (
            <p className={`flex items-center gap-2 rounded-xl p-3 text-sm ${msg.ok ? "bg-tint-teal" : "bg-tint-coral text-coral-dark"}`}>
              {msg.ok ? <IconCheck size={18} /> : <IconAlert size={18} />} {msg.text}
            </p>
          )}
          <button disabled={pending} className="rounded-full bg-coral py-3.5 font-semibold text-white hover:bg-coral-dark disabled:opacity-60">
            {pending ? "Đang lưu..." : "Lưu sản phẩm"}
          </button>

          {v.id &&
            (confirmDelete ? (
              <div className="rounded-xl bg-tint-coral p-3 text-sm">
                <p className="mb-2">Xoá vĩnh viễn sản phẩm và ảnh? Không thể hoàn tác. (Đơn hàng cũ vẫn giữ tên/giá.)</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    className="rounded-full bg-coral-dark px-4 py-2 font-semibold text-white"
                    onClick={() =>
                      start(async () => {
                        const r = await deleteProduct(v.id!);
                        if (r.ok) router.replace("/admin/san-pham");
                        else setMsg({ ok: false, text: r.error });
                      })
                    }
                  >
                    Xoá luôn
                  </button>
                  <button type="button" className="rounded-full bg-white px-4 py-2" onClick={() => setConfirmDelete(false)}>
                    Không
                  </button>
                </div>
                <p className="mt-2 text-xs text-ink-soft">Mẹo: muốn ngừng bán tạm thời thì tắt “Hiện trên shop”.</p>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center justify-center gap-1.5 text-sm text-ink-soft hover:text-coral-dark">
                <IconTrash size={16} /> Xoá sản phẩm
              </button>
            ))}
        </div>
      </div>
    </form>
  );
}
