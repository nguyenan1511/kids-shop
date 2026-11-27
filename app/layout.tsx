import type { Metadata, Viewport } from "next";
// Self-hosted fonts (latin + vietnamese subsets via unicode-range) — no build-time Google download.
import "@fontsource/baloo-2/600.css";
import "@fontsource/baloo-2/700.css";
import "@fontsource/baloo-2/800.css";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Thanh Chi Đồ Chơi — Đồ chơi cho bé",
    template: "%s | Thanh Chi Đồ Chơi",
  },
  description:
    "Đồ chơi an toàn, chất lượng cho bé 0–12 tuổi. Xem video thật trên TikTok, đặt hàng nhanh, thanh toán khi nhận hàng.",
};

export const viewport: Viewport = { themeColor: "#fff8ee" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
