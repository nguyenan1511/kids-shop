import Link from "next/link";
import { IconTeddy } from "@/components/icons";

export function Logo({ href = "/", sub = "Đồ chơi cho bé" }: { href?: string; sub?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-sun text-ink md:h-[42px] md:w-[42px]">
        <IconTeddy size={26} />
      </span>
      <span className="font-display text-2xl font-extrabold leading-none text-coral md:text-[28px]">
        Thanh Chi
        <small className="mt-0.5 block font-sans text-xs font-medium text-ink-soft">{sub}</small>
      </span>
    </Link>
  );
}
