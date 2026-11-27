import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/nav";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: { default: "Quản trị", template: "%s · Quản trị Thanh Chi" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireAdmin();
  const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "new");

  return (
    <div className="min-h-screen bg-cream md:flex">
      <AdminNav email={user.email ?? ""} newCount={count ?? 0} />
      <div className="min-w-0 flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-10 md:pt-8">{children}</div>
    </div>
  );
}
