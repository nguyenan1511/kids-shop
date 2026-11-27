"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { IconAlert, IconChevronDown, IconEdit, IconPlus, IconTrash, IconUpload } from "@/components/icons";
import { MediaImage } from "@/components/shop/media";
import { deleteCategory, moveRow, saveCategory } from "@/app/admin/actions";
import { uploadImage } from "@/lib/upload";

type Cat = { id: string; name: string; slug: string; image_path: string | null; count: number };

export function CategoryManager({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [err, setErr] = useState("");

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) =>
    start(async () => {
      setErr("");
      const r = await fn();
      if (!r.ok) setErr(r.error ?? "Lỗi");
      else after?.();
      router.refresh();
    });

  return (
    <div>
      {err && (
        <p className="mb-3 flex items-center gap-2 rounded-xl bg-tint-coral p-3 text-sm text-coral-dark">
          <IconAlert size={18} /> {err}
        </p>
      )}
      <ul className="mb-4 divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-white">
        {categories.map((c, i) =>
          editing === c.id ? (
            <li key={c.id} className="p-4">
              <CatForm initial={c} pending={pending} onCancel={() => setEditing(null)} onSave={(name, img) => run(() => saveCategory({ id: c.id, name, imagePath: img }), () => setEditing(null))} />
            </li>
          ) : (
            <li key={c.id} className={`flex items-center gap-3 p-3 ${pending ? "opacity-70" : ""}`}>
              <div className="flex flex-col">
                <button disabled={i === 0 || pending} onClick={() => run(() => moveRow("categories", c.id, -1))} aria-label="Lên" className="rotate-180 p-0.5 text-ink-soft disabled:opacity-20">
                  <IconChevronDown size={18} />
                </button>
                <button disabled={i === categories.length - 1 || pending} onClick={() => run(() => moveRow("categories", c.id, 1))} aria-label="Xuống" className="p-0.5 text-ink-soft disabled:opacity-20">
                  <IconChevronDown size={18} />
                </button>
              </div>
              <MediaImage path={c.image_path} alt={c.name} className="h-12 w-12 shrink-0 rounded-full border border-line" sizes="48px" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-ink-soft">{c.count} sản phẩm</p>
              </div>
              <button onClick={() => setEditing(c.id)} aria-label="Sửa" className="grid h-9 w-9 place-items-center rounded-full bg-cream">
                <IconEdit size={17} />
              </button>
              <button
                onClick={() => run(() => deleteCategory(c.id))}
                disabled={pending}
                aria-label="Xoá"
                title={c.count ? "Chuyển hết sản phẩm sang danh mục khác trước" : "Xoá danh mục"}
                className="grid h-9 w-9 place-items-center rounded-full bg-cream text-ink-soft hover:text-coral-dark"
              >
                <IconTrash size={17} />
              </button>
            </li>
          ),
        )}
      </ul>
      {editing === "new" ? (
        <div className="rounded-[20px] border border-line bg-white p-4">
          <CatForm pending={pending} onCancel={() => setEditing(null)} onSave={(name, img) => run(() => saveCategory({ name, imagePath: img }), () => setEditing(null))} />
        </div>
      ) : (
        <button onClick={() => setEditing("new")} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-semibold text-white">
          <IconPlus size={18} /> Thêm danh mục
        </button>
      )}
    </div>
  );
}

function CatForm({
  initial,
  pending,
  onSave,
  onCancel,
}: {
  initial?: Cat;
  pending: boolean;
  onSave: (name: string, img: string | null) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [img, setImg] = useState<string | null>(initial?.image_path ?? null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={() => input.current?.click()} className="relative shrink-0" aria-label="Đổi ảnh">
        <MediaImage path={img} alt="" className="h-16 w-16 rounded-full border border-line" sizes="64px" />
        <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-ink text-white">
          <IconUpload size={14} />
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setBusy(true);
          setErr("");
          try {
            setImg(await uploadImage("categories", f));
          } catch (x) {
            setErr(x instanceof Error ? x.message : "Lỗi tải ảnh");
          }
          setBusy(false);
        }}
      />
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên danh mục" className="min-w-[180px] flex-1 rounded-xl border border-line px-3.5 py-2.5 outline-none focus:border-ink" />
      <button disabled={pending || busy || name.trim().length < 2} onClick={() => onSave(name, img)} className="rounded-full bg-coral px-5 py-2.5 font-semibold text-white disabled:opacity-50">
        {busy ? "Đang tải ảnh..." : "Lưu"}
      </button>
      <button onClick={onCancel} className="rounded-full bg-cream px-4 py-2.5">
        Huỷ
      </button>
      {err && <p className="w-full text-sm text-coral-dark">{err}</p>}
    </div>
  );
}
