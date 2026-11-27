"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { IconAlert, IconCheck } from "@/components/icons";
import { saveSettings } from "@/app/admin/actions";

type S = {
  shop_name: string;
  hotline: string;
  zalo_phone: string;
  topbar_text: string;
  promo_title: string;
  promo_text: string;
  zalo_message_template: string;
};

const field = "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 outline-none focus:border-ink";
const PLACEHOLDERS = ["{ten}", "{ma}", "{san_pham}", "{tien_hang}", "{phi_ship}", "{tong}", "{dia_chi}"];

export function SettingsForm({ initial }: { initial: S }) {
  const router = useRouter();
  const [v, setV] = useState<S>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof S) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveSettings(v);
          setMsg(r.ok ? { ok: true, text: r.message ?? "Đã lưu" } : { ok: false, text: r.error });
          router.refresh();
        });
      }}
      className="grid gap-5"
    >
      <section className="grid gap-4 rounded-[20px] border border-line bg-white p-5">
        <h2 className="font-bold">Thông tin shop</h2>
        <label>
          <span className="mb-1.5 block text-sm font-semibold">Tên shop</span>
          <input value={v.shop_name} onChange={set("shop_name")} className={field} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1.5 block text-sm font-semibold">Hotline</span>
            <input value={v.hotline} onChange={set("hotline")} placeholder="0912 345 678" className={field} />
          </label>
          <label>
            <span className="mb-1.5 block text-sm font-semibold">Số Zalo của shop</span>
            <input value={v.zalo_phone} onChange={set("zalo_phone")} placeholder="0912345678" className={field} />
          </label>
        </div>
      </section>

      <section className="grid gap-4 rounded-[20px] border border-line bg-white p-5">
        <h2 className="font-bold">Trang chủ</h2>
        <label>
          <span className="mb-1.5 block text-sm font-semibold">Dòng chữ trên cùng</span>
          <input value={v.topbar_text} onChange={set("topbar_text")} className={field} />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-semibold">Banner — tiêu đề</span>
          <input value={v.promo_title} onChange={set("promo_title")} className={field} />
        </label>
        <label>
          <span className="mb-1.5 block text-sm font-semibold">Banner — nội dung</span>
          <textarea rows={2} value={v.promo_text} onChange={set("promo_text")} className={`${field} resize-none`} />
        </label>
      </section>

      <section className="grid gap-3 rounded-[20px] border border-line bg-white p-5">
        <h2 className="font-bold">Mẫu tin nhắn xác nhận Zalo</h2>
        <p className="text-sm text-ink-soft">
          Các ô sẽ được tự điền: {PLACEHOLDERS.map((p) => <code key={p} className="mr-1 rounded bg-cream px-1.5 py-0.5 text-xs">{p}</code>)}
        </p>
        <textarea rows={9} value={v.zalo_message_template} onChange={set("zalo_message_template")} className={`${field} resize-y font-mono text-sm`} />
      </section>

      {msg && (
        <p className={`flex items-center gap-2 rounded-xl p-3 text-sm ${msg.ok ? "bg-tint-teal" : "bg-tint-coral text-coral-dark"}`}>
          {msg.ok ? <IconCheck size={18} /> : <IconAlert size={18} />} {msg.text}
        </p>
      )}
      <button disabled={pending} className="rounded-full bg-coral py-3.5 font-semibold text-white disabled:opacity-60">
        {pending ? "Đang lưu..." : "Lưu cài đặt"}
      </button>
    </form>
  );
}
