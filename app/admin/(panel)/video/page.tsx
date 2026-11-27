import { VideoManager } from "@/components/admin/video-manager";
import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "Video" };

export default async function VideosPage() {
  const { supabase } = await requireAdmin();
  const [{ data: videos }, { data: products }] = await Promise.all([
    supabase.from("videos").select("id, path, poster_path, product_id, sort_order").order("sort_order"),
    supabase.from("products").select("id, name, is_visible").order("name"),
  ]);
  return (
    <div className="mx-auto max-w-[1000px]">
      <h1 className="mb-1 text-[30px] font-extrabold">Video TikTok</h1>
      <p className="mb-5 text-ink-soft">
        Hiện ở mục “Xem trên TikTok” trang chủ. Gắn sản phẩm để hiện nút “Mua”. Video tối đa 50MB — nên nén trước (720p).
      </p>
      <VideoManager videos={videos ?? []} products={products ?? []} />
    </div>
  );
}
