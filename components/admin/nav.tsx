"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBox, IconGrid, IconHome, IconList, IconLogout, IconSettings, IconTeddy, IconVideo } from "@/components/icons";
import { logout } from "@/app/admin/actions";

const ITEMS = [
  { href: "/admin", label: "Đơn hàng", icon: IconList, exact: true, alt: "/admin/don" },
  { href: "/admin/san-pham", label: "Sản phẩm", icon: IconBox },
  { href: "/admin/danh-muc", label: "Danh mục", icon: IconGrid },
  { href: "/admin/video", label: "Video", icon: IconVideo },
  { href: "/admin/cai-dat", label: "Cài đặt", icon: IconSettings },
];

export function AdminNav({ email, newCount }: { email: string; newCount: number }) {
  const path = usePathname();
  const active = (i: (typeof ITEMS)[number]) =>
    i.exact ? path === i.href || (i.alt ? path.startsWith(i.alt) : false) : path.startsWith(i.href);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col border-r border-line bg-white p-5 md:flex">
        <Link href="/admin" className="mb-8 flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-sun">
            <IconTeddy size={26} />
          </span>
          <span className="font-display text-xl font-extrabold leading-none text-coral">
            Thanh Chi
            <small className="block font-sans text-xs font-medium text-ink-soft">Quản trị</small>
          </span>
        </Link>
        <nav className="flex flex-col gap-1">
          {ITEMS.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium ${
                active(i) ? "bg-ink text-white" : "hover:bg-cream"
              }`}
            >
              <i.icon size={20} />
              <span className="flex-1">{i.label}</span>
              {i.href === "/admin" && newCount > 0 && (
                <span className="rounded-full bg-coral px-2 py-0.5 text-xs font-bold text-white">{newCount}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-auto grid gap-1 border-t border-line pt-4 text-sm">
          <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-cream">
            <IconHome size={18} /> Xem shop
          </Link>
          <form action={logout}>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-cream">
              <IconLogout size={18} /> Đăng xuất
            </button>
          </form>
          <p className="truncate px-3 pt-2 text-xs text-ink-soft">{email}</p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white px-4 py-3 md:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-sun">
            <IconTeddy size={22} />
          </span>
          <span className="font-display text-lg font-extrabold text-coral">Quản trị</span>
        </Link>
        <form action={logout}>
          <button className="flex items-center gap-1.5 rounded-full bg-cream px-3 py-2 text-sm" aria-label="Đăng xuất">
            <IconLogout size={18} />
          </button>
        </form>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {ITEMS.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
              active(i) ? "text-coral" : "text-ink-soft"
            }`}
          >
            <i.icon size={22} />
            {i.label}
            {i.href === "/admin" && newCount > 0 && (
              <span className="absolute right-[22%] top-1 grid h-4 min-w-4 place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
                {newCount}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </>
  );
}
