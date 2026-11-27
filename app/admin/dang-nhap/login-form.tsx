"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IconAlert, IconTeddy } from "@/components/icons";
import { getBrowserClient } from "@/lib/supabase/browser";

/** "admin" → "admin@thanhchi.local"; full emails pass through. Keep in sync with scripts/create-admin.mjs. */
function toLoginEmail(input: string): string {
  const v = input.trim().toLowerCase();
  return v.includes("@") ? v : `${v}@thanhchi.local`;
}

export function LoginForm({ notAdmin }: { notAdmin: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(notAdmin ? "Tài khoản này không có quyền quản trị." : "");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = getBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email: toLoginEmail(email), password });
    if (error) {
      setError("Tên đăng nhập hoặc mật khẩu không đúng.");
      setLoading(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="w-full max-w-[380px] rounded-[28px] border border-line bg-white p-7">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-sun">
          <IconTeddy size={30} />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-coral">Thanh Chi</h1>
          <p className="text-sm text-ink-soft">Trang quản trị</p>
        </div>
      </div>

      {error && (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-tint-coral p-3 text-sm text-coral-dark">
          <IconAlert size={18} /> {error}
        </p>
      )}

      <label className="mb-4 block">
        <span className="mb-1.5 block text-sm font-semibold">Tên đăng nhập</span>
        <input
          type="text"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-ink"
        />
      </label>
      <label className="mb-6 block">
        <span className="mb-1.5 block text-sm font-semibold">Mật khẩu</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-ink"
        />
      </label>
      <button
        disabled={loading}
        className="w-full rounded-full bg-ink py-3.5 font-semibold text-white hover:bg-coral disabled:opacity-60"
      >
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
}
