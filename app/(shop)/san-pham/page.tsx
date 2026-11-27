import type { Metadata } from "next";
import { ProductListing, sortParam } from "@/components/shop/product-listing";
import { getCategories, getProducts } from "@/lib/catalog";

export const metadata: Metadata = { title: "Tất cả đồ chơi" };

type SP = Promise<{ q?: string; tuoi?: string; "sap-xep"?: string }>;

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const params = await searchParams;
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({
      search: params.q?.slice(0, 60),
      age: params.tuoi,
      sort: sortParam(params["sap-xep"]),
    }),
  ]);
  return (
    <ProductListing
      title="Tất cả đồ chơi"
      basePath="/san-pham"
      products={products}
      categories={categories}
      params={params}
    />
  );
}
