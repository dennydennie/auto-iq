"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import type { VehicleImageDto } from "@auto-iq/contracts/storage";
import { CarSilhouette } from "@/components/ui/car-silhouette";
import { cn } from "@/lib/utils";

type GalleryImage = { id: string; url: string; slot?: string };

export type PhotoGalleryProps = {
  images: VehicleImageDto[] | GalleryImage[];
  /** Fallback silhouette body type when there are no images */
  bodyTone: "bakkie" | "hatch" | "sedan" | "suv";
  alt: string;
  className?: string;
};

/**
 * Vehicle detail hero: big lead image + horizontal thumb strip. Click any thumb
 * to swap the hero; click the hero (or the Expand button) to open a lightbox
 * with left/right keyboard navigation.
 *
 * Renders a `<CarSilhouette>` when the listing has zero photos.
 */
export function PhotoGallery({ images, bodyTone, alt, className }: PhotoGalleryProps) {
  const gallery = useMemo<GalleryImage[]>(() => {
    if (!images || images.length === 0) return [];
    return images.map((img, index) => ({
      id: img.id ?? `image-${index}`,
      url: img.url,
      slot: "slot" in img ? img.slot : undefined,
    }));
  }, [images]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const total = gallery.length;
  const activeImage = gallery[activeIndex];

  const goPrev = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((current) => (current - 1 + total) % total);
  }, [total]);

  const goNext = useCallback(() => {
    if (total === 0) return;
    setActiveIndex((current) => (current + 1) % total);
  }, [total]);

  // Sync the native <dialog> element with our open state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (lightboxOpen && !dialog.open) {
      dialog.showModal();
    } else if (!lightboxOpen && dialog.open) {
      dialog.close();
    }
  }, [lightboxOpen]);

  // Arrow-key navigation only while the lightbox is open
  useEffect(() => {
    if (!lightboxOpen) return;
    function onKeydown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [lightboxOpen, goPrev, goNext]);

  // Empty state: silhouette
  if (total === 0) {
    return (
      <div
        className={cn(
          "relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-3xl border border-[var(--ink-100)] bg-[radial-gradient(circle_at_top,rgba(255,205,83,0.12),transparent_45%),linear-gradient(180deg,#18233e_0%,#0f1830_100%)]",
          className,
        )}
      >
        <CarSilhouette type={bodyTone} width={340} shadow={false} />
        <span className="absolute bottom-4 rounded-full bg-black/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85 backdrop-blur">
          Photos coming soon
        </span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Hero */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-[var(--ink-100)] bg-[var(--ink-900)]">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label={`Expand ${alt} photo ${activeIndex + 1} of ${total}`}
          className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--amber)]/60"
        >
          <Image
            key={activeImage.id}
            src={activeImage.url}
            alt={`${alt} — photo ${activeIndex + 1}`}
            fill
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover"
            priority
          />
        </button>

        {/* Prev / next controls */}
        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}

        {/* Expand affordance top-right */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label="View full-size gallery"
          className="absolute right-3 top-3 z-10 inline-flex h-9 items-center gap-1.5 rounded-full bg-black/45 px-3 text-xs font-semibold uppercase tracking-[0.1em] text-white backdrop-blur transition hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]"
        >
          <Expand className="h-3.5 w-3.5" aria-hidden="true" />
          {total > 1 ? `1 of ${total}`.replace("1", String(activeIndex + 1)) : "View"}
        </button>
      </div>

      {/* Thumb strip */}
      {total > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Photo thumbnails">
          {gallery.map((img, index) => {
            const active = index === activeIndex;
            return (
              <button
                type="button"
                key={img.id}
                role="tab"
                aria-selected={active}
                aria-label={`Show photo ${index + 1} of ${total}${img.slot ? ` (${img.slot.toLowerCase().replace(/_/g, " ")})` : ""}`}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]",
                  active
                    ? "border-[var(--ink-900)] ring-2 ring-[var(--amber)]"
                    : "border-[var(--ink-100)] hover:border-[var(--ink-300)]",
                )}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}

      {/* Lightbox */}
      <dialog
        ref={dialogRef}
        onCancel={(event) => {
          event.preventDefault();
          setLightboxOpen(false);
        }}
        onClose={() => setLightboxOpen(false)}
        aria-label="Vehicle photo gallery"
        className="h-full max-h-none w-full max-w-none border-none bg-black/90 p-0 backdrop:bg-black/70 open:flex open:flex-col"
      >
        {lightboxOpen ? (
          <div className="relative flex h-full w-full flex-col">
            <div className="flex items-center justify-between p-4 text-white">
              <p className="text-sm font-semibold">
                {activeIndex + 1} <span className="text-white/60">of {total}</span>
                {activeImage.slot ? (
                  <span className="ml-2 text-xs uppercase tracking-[0.14em] text-white/60">
                    {activeImage.slot.replace(/_/g, " ")}
                  </span>
                ) : null}
              </p>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                aria-label="Close gallery"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]"
                autoFocus
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative flex flex-1 items-center justify-center px-4 pb-4">
              <Image
                key={`lightbox-${activeImage.id}`}
                src={activeImage.url}
                alt={`${alt} — photo ${activeIndex + 1}`}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />

              {total > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Previous photo"
                    className="absolute left-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Next photo"
                    className="absolute right-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
