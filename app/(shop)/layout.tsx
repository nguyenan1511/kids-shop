import { CartProvider } from "@/components/shop/cart";
import { CartDrawer } from "@/components/shop/cart-drawer";
import { Footer } from "@/components/shop/footer";
import { Header } from "@/components/shop/header";
import { getCategories, getSettings } from "@/lib/catalog";

// Catalog pages are re-generated at most every 60s (admin edits show up within a minute).
export const revalidate = 60;

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  return (
    <CartProvider>
      {settings.topbar_text && (
        <div className="bg-ink px-4 py-2 text-center text-[13px] text-white">{settings.topbar_text}</div>
      )}
      <Header categories={categories.map((c) => ({ name: c.name, slug: c.slug }))} />
      <main>{children}</main>
      <Footer settings={settings} categories={categories} />
      <CartDrawer />
    </CartProvider>
  );
}
