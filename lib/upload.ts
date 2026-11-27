"use client";

import { getBrowserClient } from "@/lib/supabase/browser";

/** Resize an image in the browser to max `max` px and encode as WebP. */
export async function resizeImage(file: File, max = 1200, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", quality));
  if (!blob) throw new Error("Không nén được ảnh");
  return blob;
}

function rid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

/** Upload to the `media` bucket. Returns the storage path. */
export async function uploadMedia(folder: string, body: Blob, ext: string, contentType: string): Promise<string> {
  const path = `${folder}/${rid()}.${ext}`;
  const { error } = await getBrowserClient()
    .storage.from("media")
    .upload(path, body, { contentType, cacheControl: "31536000", upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

export async function uploadImage(folder: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} không phải ảnh`);
  const blob = await resizeImage(file);
  return uploadMedia(folder, blob, "webp", "image/webp");
}
