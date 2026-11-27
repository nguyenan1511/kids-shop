"use client";

import { useRef, useState } from "react";
import { IconChevronLeft, IconChevronRight } from "@/components/icons";
import type { ProductImage } from "@/lib/catalog";
import { MediaImage } from "./media";

export function Gallery({ images, alt }: { images: ProductImage[]; alt: string }) {
  const [i, setI] = useState(0);
  const touchX = useRef<number | null>(null);
  const n = images.length;
  const go = (d: number) => setI((v) => (v + d + n) % n);

  if (n === 0) return <MediaImage path={null} alt={alt} className="aspect-square rounded-[28px]" />;

  return (
    <div>
      <div
        className="relative"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current == null || n < 2) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        <MediaImage
          path={images[i].path}
          alt={alt}
          className="aspect-square rounded-[28px] border border-line"
          sizes="(max-width: 768px) 100vw, 600px"
          fit="contain"
          priority
        />
        {n > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              aria-label="Ảnh trước"
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-[var(--shadow-soft)]"
            >
              <IconChevronLeft />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Ảnh sau"
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 shadow-[var(--shadow-soft)]"
            >
              <IconChevronRight />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-semibold text-white">
              {i + 1}/{n}
            </span>
          </>
        )}
      </div>
      {n > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setI(idx)}
              aria-label={`Ảnh ${idx + 1}`}
              className={`shrink-0 rounded-xl border-2 ${idx === i ? "border-coral" : "border-transparent"}`}
            >
              <MediaImage path={img.path} alt="" className="h-16 w-16 rounded-[10px]" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
