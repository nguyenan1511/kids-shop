/** 249000 → "249.000đ" */
export function formatVnd(amount: number): string {
  return `${Math.round(amount).toLocaleString("vi-VN").replace(/,/g, ".")}đ`;
}

/** Public URL for a file in the `media` storage bucket. */
export function mediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/${path}`;
}

export const AGE_RANGES = [
  { value: "0-1", label: "0–1 tuổi" },
  { value: "1-3", label: "1–3 tuổi" },
  { value: "3-6", label: "3–6 tuổi" },
  { value: "6-12", label: "6–12 tuổi" },
] as const;

export type AgeRange = (typeof AGE_RANGES)[number]["value"];

export function ageLabel(age: string | null | undefined): string {
  return AGE_RANGES.find((a) => a.value === age)?.label ?? "";
}

/** "Nguyễn Văn Á!" → "nguyen-van-a" */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Relative time in Vietnamese: "5 phút trước". */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const diff = Math.max(0, (now.getTime() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ngày trước`;
  return formatDateTime(iso);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}
