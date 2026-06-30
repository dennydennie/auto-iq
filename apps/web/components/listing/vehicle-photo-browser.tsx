"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useState } from "react";
import type { VehicleImageDto } from "@auto-iq/contracts/storage";
import { cn } from "@/lib/utils";

export function VehiclePhotoBrowser({
  fallback,
  images,
  title,
}: {
  fallback: ReactNode;
  images: VehicleImageDto[];
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? null;

  if (!active) {
    return <>{fallback}</>;
  }

  return (
    <div className="space-y-3">
      <div className="relative h-[18rem] overflow-hidden rounded-[1.7rem] bg-white/8">
        <Image
          src={active.url}
          alt={`${title} photo ${activeIndex + 1}`}
          fill
          unoptimized
          sizes="(min-width: 1024px) 42vw, 100vw"
          className="object-cover"
        />
        <div className="absolute bottom-3 left-3 rounded-full bg-[var(--ink-900)]/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          {activeIndex + 1} / {images.length}
        </div>
      </div>
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label={`${title} photo thumbnails`}>
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className={cn(
                "relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border bg-white/10 transition",
                index === activeIndex ? "border-[var(--amber)] ring-2 ring-[var(--amber)]/30" : "border-white/15",
              )}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show ${title} photo ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
            >
              <Image
                src={image.url}
                alt=""
                fill
                unoptimized
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
