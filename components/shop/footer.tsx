import Link from "next/link";
import { IconClock, IconMapPin, IconPhone, IconZalo } from "@/components/icons";
import type { Category, Settings } from "@/lib/catalog";
import { zaloLink } from "@/lib/orders";
import { Logo } from "./logo";

export function Footer({ settings, categories }: { settings: Settings; categories: Category[] }) {
  return (
    <footer className="mt-14 border-t border-line bg-white pb-6 pt-12 text-sm">
      <div className="mx-auto grid max-w-[1200px] gap-8 px-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mb-4 mt-3 text-ink-soft">
            Đồ chơi an toàn, chất lượng cho bé 0–12 tuổi. Giao hàng toàn quốc, thanh toán khi nhận hàng.
          </p>
          <div className="flex gap-2">
            <a
              href="https://www.tiktok.com/@thanhchiidochoi"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-cream px-4 py-2 font-semibold hover:bg-tint-coral"
            >
              TikTok
            </a>
            {settings.zalo_phone && (
              <a
                href={zaloLink(settings.zalo_phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-cream px-4 py-2 font-semibold hover:bg-tint-teal"
              >
                <IconZalo size={18} /> Zalo
              </a>
            )}
          </div>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Danh mục</h4>
          <ul className="grid gap-2 text-ink-soft">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/danh-muc/${c.slug}`} className="hover:text-coral">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Mua hàng</h4>
          <ul className="grid gap-2 text-ink-soft">
            <li>Đặt hàng chỉ cần số điện thoại + địa chỉ</li>
            <li>Shop nhắn Zalo xác nhận đơn</li>
            <li>Thanh toán khi nhận hàng (COD)</li>
            <li>Đổi trả trong 7 ngày</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold">Liên hệ</h4>
          <ul className="grid gap-2.5 text-ink-soft">
            {settings.hotline && (
              <li className="flex items-center gap-2">
                <IconPhone size={18} />
                <a href={`tel:${settings.hotline.replace(/\s/g, "")}`} className="hover:text-coral">
                  {settings.hotline}
                </a>
              </li>
            )}
            {settings.zalo_phone && (
              <li className="flex items-center gap-2">
                <IconZalo size={18} /> Zalo: {settings.zalo_phone}
              </li>
            )}
            <li className="flex items-center gap-2">
              <IconMapPin size={18} /> Giao hàng toàn quốc
            </li>
            <li className="flex items-center gap-2">
              <IconClock size={18} /> 8:00 – 21:00 mỗi ngày
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-[1200px] border-t border-line px-4 pt-5 text-center text-xs text-ink-soft">
        © {new Date().getFullYear()} {settings.shop_name}
      </div>
    </footer>
  );
}
