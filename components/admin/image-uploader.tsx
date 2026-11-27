"use client";

import { useRef, useState } from "react";
import { IconAlert, IconChevronLeft, IconChevronRight, IconClose, IconUpload } from "@/components/icons";
import { MediaImage } from "@/components/shop/media";
import { uploadImage } from "@/lib/upload";

/** Multi-image picker: upload, reorder (first = cover), remove. Value = storage paths. */
export function ImageUploader({
  value,
  onChange,
  folder,
  max = 12,
}: {
  value: string[];
  onChange: (paths: string[]) => void;
  folder: string;
  max?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState(false);

  const addFiles = async (files: FileList | File[]) => {
    setErr("");
    const list = Array.from(files).slice(0, Math.max(0, max - value.length));
    if (!list.length) return;
    setBusy(list.length);
    const added: string[] = [];
    for (const f of list) {
      try {
        added.push(await uploadImage(folder, f));
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Tải ảnh lỗi");
      }
      setBusy((b) => b - 1);
    }
    onChange([...value, ...added]);
  };

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((p, i) => (
          <div key={p} className="relative">
            <MediaImage path={p} alt="" className="aspect-square rounded-xl border border-line" sizes="160px" />
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-coral px-2 py-0.5 text-[10px] font-bold text-white">ẢNH BÌA</span>}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== p))}
              aria-label="Xoá ảnh"
              className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/95 shadow"
            >
              <IconClose size={14} />
            </button>
            <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Lên trước" className="grid h-7 w-7 place-items-center rounded-full bg-white/95 shadow disabled:opacity-0">
                <IconChevronLeft size={14} />
              </button>
              <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Ra sau" className="grid h-7 w-7 place-items-center rounded-full bg-white/95 shadow disabled:opacity-0">
                <IconChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
        {Array.from({ length: busy }).map((_, i) => (
          <div key={`b${i}`} className="grid aspect-square place-items-center rounded-xl border border-dashed border-line bg-cream text-xs text-ink-soft">
            Đang tải...
          </div>
        ))}
        {value.length + busy < max && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              addFiles(e.dataTransfer.files);
            }}
            className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-sm ${
              drag ? "border-coral bg-tint-coral" : "border-line bg-cream text-ink-soft hover:border-ink"
            }`}
          >
            <IconUpload />
            Thêm ảnh
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {err && (
        <p className="mt-2 flex items-center gap-1 text-sm text-coral-dark">
          <IconAlert size={16} /> {err}
        </p>
      )}
      <p className="mt-2 text-xs text-ink-soft">Ảnh đầu tiên là ảnh bìa. Ảnh được tự thu nhỏ trước khi tải lên.</p>
    </div>
  );
}
