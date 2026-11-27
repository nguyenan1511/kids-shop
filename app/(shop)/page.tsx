import Link from "next/link";
import {
  IconArrowRight,
  IconCash,
  IconChat,
  IconCart,
  IconFire,
  IconPlay,
  IconReturn,
  IconShield,
  IconTruck,
  IconZalo,
} from "@/components/icons";
import { BestSellers } from "@/components/shop/best-sellers";
import { MediaImage } from "@/components/shop/media";
import { VideoGrid } from "@/components/shop/video-grid";
import { getCategories, getProducts, getSettings, getVideos } from "@/lib/catalog";
import { formatVnd } from "@/lib/format";

const tints = ["bg-tint-coral", "bg-tint-sun", "bg-tint-teal", "bg-tint-sky", "bg-tint-lilac", "bg-tint-coral"];

export default async function HomePage() {
  const [categories, products, videos, settings] = await Promise.all([
    getCategories(),
    getProducts({ limit: 24 }),
    getVideos(),
    getSettings(),
  ]);
  const featured = products.filter((p) => p.is_featured && !p.is_out_of_stock);
  const heroMain = featured[0] ?? products[0];
  const heroA = featured[1];
  const heroB = featured.find((p) => p.old_price && p.old_price > p.price) ?? featured[2];

  return (
    <>
      {/* HERO */}
      <section className="px-4 pb-14 pt-8 md:pt-10">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 md:grid-cols-[1.05fr_1fr]">
          <div>
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#ffe9b0] px-3.5 py-1.5 text-[13px] font-semibold text-[#8a5a00]">
              <IconFire size={16} /> Hot trên TikTok @thanhchiidochoi
            </span>
            <h1 className="mb-4 text-[40px] font-extrabold md:text-[58px]">
              Đồ chơi vui,
              <br />
              <span className="text-coral">bé lớn khôn</span> mỗi ngày
            </h1>
            <p className="mb-7 max-w-[500px] text-lg text-ink-soft">
              Đồ chơi thật như trong video. Đặt hàng chỉ cần số điện thoại và địa chỉ — shop nhắn Zalo xác nhận, thanh
              toán khi nhận hàng.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/san-pham"
                className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3.5 font-semibold text-white hover:bg-coral-dark"
              >
                Mua sắm ngay <IconArrowRight size={18} />
              </Link>
              {videos.length > 0 && (
                <a
                  href="#video"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white px-6 py-3 font-semibold"
                >
                  <IconPlay size={16} /> Xem video
                </a>
              )}
            </div>
          </div>

          {heroMain && (
            <div className="relative">
              <Link href={`/san-pham/${heroMain.slug}`}>
                <MediaImage
                  path={heroMain.product_images[0]?.path}
                  alt={heroMain.name}
                  className="aspect-square rounded-[32px] border-4 border-white bg-tint-coral shadow-[var(--shadow-soft)]"
                  sizes="(max-width: 768px) 100vw, 560px"
                  priority
                />
              </Link>
              {heroA && (
                <Link
                  href={`/san-pham/${heroA.slug}`}
                  className="absolute right-2 top-6 hidden max-w-[230px] sm:flex items-center gap-3 rounded-xl bg-white p-2.5 pr-4 text-sm shadow-[var(--shadow-soft)] md:-right-3"
                >
                  <MediaImage path={heroA.product_images[0]?.path} alt="" className="h-11 w-11 shrink-0 rounded-lg" sizes="44px" />
                  <span className="min-w-0">
                    <strong className="block">Bán chạy</strong>
                    <span className="line-clamp-1 text-ink-soft">{heroA.name}</span>
                  </span>
                </Link>
              )}
              {heroB && (
                <Link
                  href={`/san-pham/${heroB.slug}`}
                  className="absolute bottom-8 left-2 flex max-w-[230px] items-center gap-3 rounded-xl bg-white p-2.5 pr-4 text-sm shadow-[var(--shadow-soft)] md:-left-5"
                >
                  <MediaImage path={heroB.product_images[0]?.path} alt="" className="h-11 w-11 shrink-0 rounded-lg" sizes="44px" />
                  <span>
                    <strong className="block">
                      {heroB.old_price && heroB.old_price > heroB.price
                        ? `Giảm ${Math.round((1 - heroB.price / heroB.old_price) * 100)}%`
                        : "Giá tốt"}
                    </strong>
                    <span className="text-ink-soft">Chỉ {formatVnd(heroB.price)}</span>
                  </span>
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* TRUST */}
      <div className="border-y border-line bg-white px-4 py-6">
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { icon: IconShield, tint: "bg-tint-coral", t: "Hàng như video", s: "Quay thật, hàng thật" },
            { icon: IconTruck, tint: "bg-tint-sun", t: "Giao toàn quốc", s: "Đóng gói cẩn thận" },
            { icon: IconCash, tint: "bg-tint-teal", t: "Thanh toán khi nhận", s: "Kiểm tra hàng trước" },
            { icon: IconReturn, tint: "bg-tint-sky", t: "Đổi trả 7 ngày", s: "Nếu hàng lỗi" },
          ].map(({ icon: I, tint, t, s }) => (
            <div key={t} className="flex items-center gap-3">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink ${tint}`}>
                <I />
              </span>
              <div className="leading-tight">
                <strong className="block text-[15px]">{t}</strong>
                <span className="text-[13px] text-ink-soft">{s}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CATEGORIES */}
      <section className="px-4 py-12 md:py-14">
        <div className="mx-auto max-w-[1200px]">
          <SectionHead title="Danh mục đồ chơi" sub="Chọn nhanh theo sở thích của bé" href="/san-pham" />
          <div className="grid grid-cols-3 gap-3 md:grid-cols-6 md:gap-4">
            {categories.map((c, i) => (
              <Link
                key={c.id}
                href={`/danh-muc/${c.slug}`}
                className="rounded-[20px] border border-line bg-white p-3 text-center hover:border-coral md:p-4"
              >
                <MediaImage
                  path={c.image_path}
                  alt={c.name}
                  className={`mb-3 aspect-square rounded-full ${tints[i % tints.length]}`}
                  sizes="(max-width: 768px) 30vw, 160px"
                />
                <h3 className="text-[15px] font-bold md:text-[17px]">{c.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="px-4 pb-12 md:pb-14">
        <div className="mx-auto max-w-[1200px]">
          <SectionHead title="Đồ chơi nổi bật" sub="Những món bé nào cũng mê" href="/san-pham" icon />
          <BestSellers products={products} />
        </div>
      </section>

      {/* PROMO */}
      <section className="px-4 pb-12 md:pb-14">
        <div className="mx-auto grid max-w-[1200px] items-center gap-8 rounded-[32px] bg-teal p-7 text-white md:grid-cols-[1.2fr_1fr] md:p-12">
          <div>
            <h2 className="mb-3 text-[32px] font-extrabold md:text-[44px]">{settings.promo_title}</h2>
            <p className="mb-6 text-[17px] opacity-95">{settings.promo_text}</p>
            <Link href="/san-pham" className="inline-flex items-center gap-2 rounded-full bg-sun px-6 py-3.5 font-semibold text-ink">
              Xem tất cả đồ chơi <IconArrowRight size={18} />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {featured.slice(0, 3).map((p) => (
              <Link key={p.id} href={`/san-pham/${p.slug}`}>
                <MediaImage
                  path={p.product_images[0]?.path}
                  alt={p.name}
                  className="aspect-[3/4] rounded-2xl border-2 border-white/60"
                  sizes="160px"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* VIDEOS */}
      {videos.length > 0 && (
        <section id="video" className="scroll-mt-20 bg-ink px-4 py-12 text-white md:py-14">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-[28px] font-extrabold md:text-[34px]">Xem trên TikTok</h2>
                <p className="text-[#bdb6ce]">Video thật từ @thanhchiidochoi — bấm để xem</p>
              </div>
              <a
                href="https://www.tiktok.com/@thanhchiidochoi"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-sun"
              >
                Theo dõi kênh <IconArrowRight size={18} />
              </a>
            </div>
            <VideoGrid videos={videos} />
          </div>
        </section>
      )}

      {/* HOW TO ORDER */}
      <section className="px-4 py-12 md:py-14">
        <div className="mx-auto max-w-[1200px]">
          <SectionHead title="Đặt hàng thật dễ" sub="Không cần tạo tài khoản" />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: IconCart, tint: "bg-tint-coral", t: "1. Chọn đồ chơi", s: "Thêm vào giỏ những món bé thích." },
              { icon: IconChat, tint: "bg-tint-sun", t: "2. Nhập SĐT + địa chỉ", s: "Chỉ vậy thôi — không cần đăng ký." },
              { icon: IconZalo, tint: "bg-tint-teal", t: "3. Shop nhắn Zalo", s: "Xác nhận đơn, báo phí ship, giao hàng tận nơi. Nhận hàng rồi mới trả tiền." },
            ].map(({ icon: I, tint, t, s }) => (
              <div key={t} className="rounded-[20px] border border-line bg-white p-6">
                <span className={`mb-4 grid h-12 w-12 place-items-center rounded-xl text-ink ${tint}`}>
                  <I size={26} />
                </span>
                <h3 className="mb-1 text-xl font-bold">{t}</h3>
                <p className="text-ink-soft">{s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHead({ title, sub, href, icon }: { title: string; sub?: string; href?: string; icon?: boolean }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-7">
      <div>
        <h2 className="flex items-center gap-2 text-[28px] font-extrabold md:text-[34px]">
          {title}
          {icon && <IconFire size={28} className="text-coral" />}
        </h2>
        {sub && <p className="text-ink-soft">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 font-semibold text-coral">
          Xem tất cả <IconArrowRight size={18} />
        </Link>
      )}
    </div>
  );
}
