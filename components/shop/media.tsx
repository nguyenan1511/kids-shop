import Image from "next/image";
import { IconImage } from "@/components/icons";
import { mediaUrl } from "@/lib/format";

/** Square product/category image from Supabase storage, with a placeholder fallback. */
export function MediaImage({
  path,
  alt,
  className = "",
  sizes = "(max-width: 768px) 50vw, 25vw",
  priority = false,
  fit = "cover",
}: {
  path: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
}) {
  if (!path) {
    return (
      <div className={`grid place-items-center bg-placeholder text-[#a8977b] ${className}`}>
        <IconImage size={28} />
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden bg-white ${className}`}>
      <Image
        src={mediaUrl(path)}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized
        className={fit === "cover" ? "object-cover" : "object-contain"}
      />
    </div>
  );
}
