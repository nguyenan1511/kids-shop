"use client";

import Link from "next/link";
import { IconAlert, IconRefresh } from "@/components/icons";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-[520px] rounded-[28px] border border-line bg-white p-8 text-center">
        <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-tint-coral text-coral-dark">
          <IconAlert size={32} />
        </span>
        <h1 className="mb-2 text-2xl font-extrabold">Shop đang bận một chút</h1>
        <p className="mb-6 text-ink-soft">Vui lòng thử lại sau vài giây. Giỏ hàng của bạn vẫn được giữ nguyên.</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-coral px-6 py-3 font-semibold text-white"
          >
            <IconRefresh size={18} /> Thử lại
          </button>
          <Link href="/" className="rounded-full border-2 border-ink px-6 py-2.5 font-semibold">
            Về trang chủ
          </Link>
        </div>
      </div>
    </section>
  );
}
