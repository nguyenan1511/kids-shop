"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { IconAlert, IconChevronLeft, IconChevronRight, IconTrash, IconUpload } from "@/components/icons";
import { deleteVideo, moveRow, saveVideo } from "@/app/admin/actions";
import { mediaUrl } from "@/lib/format";
import { uploadMedia } from "@/lib/upload";

type V = { id: string; path: string; poster_path: string | null; product_id: string | null; sort_order: number };
type P = { id: string; name: string; is_visible: boolean };

/** Grab a frame ~1s in as the poster (WebP). */
async function makePoster(file: File): Promise<Blob | null> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    await new Promise<void>((res, rej) => {
      video.onloadeddata = () => res();
      video.onerror = () => rej(new Error("video"));
    });
    video.currentTime = Math.min(1, (video.duration || 2) / 2);
    await new Promise<void>((res) => (video.onseeked = () => res()));
    const scale = Math.min(1, 540 / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    return await new Promise((res) => canvas.toBlob(res, "image/webp", 0.78));
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function VideoManager({ videos, products }: { videos: V[]; products: P[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setErr("");
      const r = await fn();
      if (!r.ok) setErr(r.error ?? "Lỗi");
      router.refresh();
    });

  const upload = async (file: File) => {
    setErr("");
    if (file.type !== "video/mp4") return setErr("Chỉ hỗ trợ video .mp4");
    if (file.size > 50 * 1024 * 1024) return setErr("Video lớn hơn 50MB — hãy nén lại (720p) rồi tải lên.");
    setBusy(true);
    try {
      const poster = await makePoster(file);
      const path = await uploadMedia("videos", file, "mp4", "video/mp4");
      const posterPath = poster ? await uploadMedia("videos", poster, "webp", "image/webp") : null;
      const r = await saveVideo({ path, posterPath, productId: null });
      if (!r.ok) setErr(r.error);
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Tải video lỗi");
    }
    setBusy(false);
  };

  return (
    <div>
      {err && (
        <p className="mb-3 flex items-center gap-2 rounded-xl bg-tint-coral p-3 text-sm text-coral-dark">
          <IconAlert size={18} /> {err}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {videos.map((v, i) => (
          <div key={v.id} className={`rounded-[20px] border border-line bg-white p-2.5 ${pending ? "opacity-70" : ""}`}>
            <video src={mediaUrl(v.path)} poster={mediaUrl(v.poster_path)} controls preload="none" playsInline className="mb-2 aspect-[9/16] w-full rounded-xl bg-ink object-cover" />
            <select
              value={v.product_id ?? ""}
              disabled={pending}
              onChange={(e) => run(() => saveVideo({ id: v.id, path: v.path, posterPath: v.poster_path, productId: e.target.value || null }))}
              className="mb-2 w-full rounded-lg border border-line px-2 py-1.5 text-xs"
              aria-label="Sản phẩm trong video"
            >
              <option value="">— Chưa gắn sản phẩm —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.is_visible ? "" : " (đang ẩn)"}
                </option>
              ))}
            </select>
            {confirmId === v.id ? (
              <div className="flex items-center justify-between gap-1 text-xs">
                <span>Xoá video?</span>
                <button onClick={() => run(() => deleteVideo(v.id))} className="rounded-full bg-coral-dark px-3 py-1 font-semibold text-white">
                  Xoá
                </button>
                <button onClick={() => setConfirmId(null)} className="rounded-full bg-cream px-3 py-1">
                  Không
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <button disabled={i === 0 || pending} onClick={() => run(() => moveRow("videos", v.id, -1))} aria-label="Lên trước" className="grid h-8 w-8 place-items-center rounded-full bg-cream disabled:opacity-30">
                  <IconChevronLeft size={16} />
                </button>
                <button onClick={() => setConfirmId(v.id)} aria-label="Xoá" className="grid h-8 w-8 place-items-center rounded-full bg-cream text-ink-soft hover:text-coral-dark">
                  <IconTrash size={16} />
                </button>
                <button disabled={i === videos.length - 1 || pending} onClick={() => run(() => moveRow("videos", v.id, 1))} aria-label="Ra sau" className="grid h-8 w-8 place-items-center rounded-full bg-cream disabled:opacity-30">
                  <IconChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
        <button
          onClick={() => input.current?.click()}
          disabled={busy}
          className="flex aspect-[9/16] flex-col items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-line bg-white text-sm text-ink-soft hover:border-ink"
        >
          <IconUpload size={28} />
          {busy ? "Đang tải video..." : "Tải video lên (.mp4)"}
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept="video/mp4"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) upload(f);
        }}
      />
    </div>
  );
}
