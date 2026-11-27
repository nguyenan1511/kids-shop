"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { IconCart, IconClose, IconMenu, IconSearch } from "@/components/icons";
import { useCart } from "./cart";
import { Logo } from "./logo";

const NAV = [
  { href: "/", label: "Trang chủ" },
  { href: "/san-pham", label: "Sản phẩm" },
  { href: "/san-pham?sap-xep=moi", label: "Hàng mới" },
  { href: "/#video", label: "Video TikTok" },
];

export function Header({ categories }: { categories: { name: string; slug: string }[] }) {
  const { count, ready, setOpen } = useCart();
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <div className="mx-auto flex h-[68px] max-w-[1200px] items-center gap-4 px-4 md:h-[76px] md:gap-6">
        <button
          className="grid h-11 w-11 place-items-center rounded-full bg-cream md:hidden"
          aria-label="Mở menu"
          onClick={() => setMenu(true)}
        >
          <IconMenu />
        </button>

        <Logo />

        <nav className="hidden gap-6 text-[15px] font-medium md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={pathname === n.href ? "text-coral" : "hover:text-coral"}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <form action="/san-pham" className="ml-auto hidden max-w-[340px] flex-1 md:block">
          <label className="flex h-11 items-center gap-2 rounded-full border border-line bg-cream px-4 text-sm text-ink-soft focus-within:border-ink">
            <IconSearch size={18} />
            <input
              name="q"
              placeholder="Tìm đồ chơi cho bé..."
              className="w-full bg-transparent text-ink outline-none placeholder:text-ink-soft"
            />
          </label>
        </form>

        <button
          className="relative ml-auto grid h-11 w-11 place-items-center rounded-full bg-cream md:ml-0"
          aria-label="Giỏ hàng"
          onClick={() => setOpen(true)}
        >
          <IconCart />
          {ready && count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1 text-[11px] font-bold text-white">
              {count}
            </span>
          )}
        </button>
      </div>

      {menu && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMenu(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-[320px] flex-col gap-6 overflow-y-auto bg-white p-5">
            <div className="flex items-center justify-between">
              <Logo />
              <button className="grid h-10 w-10 place-items-center rounded-full bg-cream" aria-label="Đóng" onClick={() => setMenu(false)}>
                <IconClose />
              </button>
            </div>
            <form action="/san-pham" onSubmit={() => setMenu(false)}>
              <label className="flex h-11 items-center gap-2 rounded-full border border-line bg-cream px-4 text-sm">
                <IconSearch size={18} />
                <input name="q" placeholder="Tìm đồ chơi..." className="w-full bg-transparent outline-none" />
              </label>
            </form>
            <nav className="flex flex-col gap-1 font-medium">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} onClick={() => setMenu(false)} className="rounded-xl px-3 py-3 hover:bg-cream">
                  {n.label}
                </Link>
              ))}
            </nav>
            <div>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">Danh mục</p>
              <nav className="flex flex-col gap-1">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/danh-muc/${c.slug}`}
                    onClick={() => setMenu(false)}
                    className="rounded-xl px-3 py-2.5 hover:bg-cream"
                  >
                    {c.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
