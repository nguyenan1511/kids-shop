import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductListing, sortParam } from "@/components/shop/product-listing";
import { getCategories, getProducts } from "@/lib/catalog";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; tuoi?: string; "sap-xep"?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = (await getCategories()).find((c) => c.slug === slug);
  return { title: cat ? cat.name : "Danh mục" };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const categories = await getCategories();
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) notFound();
  const products = await getProducts({
    categoryId: cat.id,
    search: sp.q?.slice(0, 60),
    age: sp.tuoi,
    sort: sortParam(sp["sap-xep"]),
  });
  return (
    <ProductListing
      title={cat.name}
      basePath={`/danh-muc/${cat.slug}`}
      products={products}
      categories={categories}
      activeCategory={cat.slug}
      params={sp}
    />
  );
}
