import { SettingsForm } from "@/components/admin/settings-form";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Cài đặt" };

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
  return (
    <div className="mx-auto max-w-[760px]">
      <h1 className="mb-5 text-[30px] font-extrabold">Cài đặt</h1>
      <SettingsForm initial={data} />
    </div>
  );
}
