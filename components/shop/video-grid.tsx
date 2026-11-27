"use client";

import Link from "next/link";
import { useState } from "react";
import { IconBag, IconPlay } from "@/components/icons";
import type { Video } from "@/lib/catalog";
import { mediaUrl } from "@/lib/format";

export function VideoGrid({ videos }: { videos: Video[] }) {
  const [playing, setPlaying] = useState<string | null>(null);

  return (
    <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 lg:grid-cols-4">
      {videos.map((v) => (
        <div key={v.id} className="relative w-[62%] shrink-0 snap-start sm:w-[40%] md:w-auto">
          <div className="relative aspect-[9/16] overflow-hidden rounded-[20px] bg-[#3a3152]">
            {playing === v.id ? (
              <video
                src={mediaUrl(v.path)}
                poster={mediaUrl(v.poster_path)}
                className="h-full w-full object-cover"
                controls
                autoPlay
                playsInline
              />
            ) : (
              <button
                className="group absolute inset-0"
                onClick={() => setPlaying(v.id)}
                aria-label="Phát video"
              >
                {v.poster_path && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(v.poster_path)} alt="" loading="lazy" className="h-full w-full object-cover" />
                )}
                <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 pl-1 text-ink group-hover:bg-white">
                  <IconPlay size={22} />
                </span>
              </button>
            )}
          </div>
          {v.products && (
            <Link
              href={`/san-pham/${v.products.slug}`}
              className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-white"
            >
              <IconBag size={14} /> Mua
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
