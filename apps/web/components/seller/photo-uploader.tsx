"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, ImagePlus, Loader2, ShieldCheck } from "lucide-react";
import type {
  ImagePresignRequest,
  ImagePresignResponse,
  RegisterImageRequest,
  VehicleImageDto,
} from "@auto-iq/contracts/storage";
import type { ImageSlot } from "@auto-iq/contracts/enums";
import { IMAGE_SLOTS } from "@auto-iq/contracts/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toaster";
import { shouldBypassNextImageOptimization } from "@/lib/image-url";
import { cn } from "@/lib/utils";
import { isApiFailure, postJson } from "@/lib/web-api";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function humanSlot(slot: ImageSlot) {
  return slot.toLowerCase().replace(/_/g, " ");
}

/**
 * Presigned upload flow for listing photos.
 * 1. POST /api/seller/storage/images/presign  → { uploadUrl, storageKey }
 * 2. PUT uploadUrl (direct, no cookies)       → 200
 * 3. POST /api/seller/listings/:id/images     → VehicleImageDto (backend registers)
 */
export function PhotoUploader({
  listingId,
  images: initialImages,
}: {
  listingId: string;
  images: VehicleImageDto[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [images, setImages] = useState<VehicleImageDto[]>(initialImages);
  const [uploadingSlot, setUploadingSlot] = useState<ImageSlot | null>(null);
  const [isPending, startTransition] = useTransition();

  const bySlot = useMemo(() => {
    const map = new Map<ImageSlot, VehicleImageDto>();
    for (const image of images) map.set(image.slot, image);
    return map;
  }, [images]);

  async function upload(file: File, slot: ImageSlot) {
    setUploadingSlot(slot);

    if (!ACCEPTED_TYPES.includes(file.type as (typeof ACCEPTED_TYPES)[number])) {
      toast({
        title: "Unsupported file type",
        description: "Use a JPEG, PNG, or WebP image.",
        variant: "error",
      });
      setUploadingSlot(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({
        title: "File too large",
        description: "Photos must be 10 MB or smaller.",
        variant: "error",
      });
      setUploadingSlot(null);
      return;
    }

    const presignBody: ImagePresignRequest = {
      listingId,
      slot,
      contentType: file.type as ImagePresignRequest["contentType"],
      contentLength: file.size,
    };

    startTransition(async () => {
      const presignResult = await postJson<ImagePresignResponse>(
        "/api/seller/storage/images/presign",
        presignBody,
      );
      if (isApiFailure(presignResult)) {
        toast({
          title: "Couldn't start upload",
          description: presignResult.error.message,
          variant: "error",
        });
        setUploadingSlot(null);
        return;
      }

      const putResponse = await fetch(presignResult.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      }).catch(() => null);

      if (!putResponse || !putResponse.ok) {
        toast({
          title: "Upload failed",
          description: "The image couldn't be uploaded to storage. Try again.",
          variant: "error",
        });
        setUploadingSlot(null);
        return;
      }

      const registerBody: RegisterImageRequest = {
        storageKey: presignResult.data.storageKey,
        slot,
        contentType: file.type as RegisterImageRequest["contentType"],
        contentLength: file.size,
        isCover: !bySlot.has("FRONT_THREE_QUARTER") && slot === "FRONT_THREE_QUARTER",
      };
      const registerResult = await postJson<VehicleImageDto>(
        `/api/seller/listings/${listingId}/images`,
        registerBody,
      );
      if (isApiFailure(registerResult)) {
        toast({
          title: "Upload registered but not saved",
          description: registerResult.error.message,
          variant: "error",
        });
        setUploadingSlot(null);
        return;
      }

      setImages((current) => {
        const next = current.filter((image) => image.slot !== slot);
        next.push(registerResult.data);
        return next;
      });
      setUploadingSlot(null);
      toast({
        title: `${humanSlot(slot)} photo uploaded`,
        description: "Saved to your listing draft.",
        variant: "success",
      });
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Photos</CardTitle>
            <p className="mt-1 text-sm text-[var(--ink-500)]">
              Buyers see these on the detail page. Upload one photo per slot. Front
              three-quarter becomes the cover automatically.
            </p>
          </div>
          <Badge variant="outline">{images.length} / {IMAGE_SLOTS.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {IMAGE_SLOTS.map((slot) => {
            const existing = bySlot.get(slot);
            const busy = uploadingSlot === slot && isPending;
            return (
              <label
                key={slot}
                className={cn(
                  "group relative flex aspect-[4/3] flex-col overflow-hidden rounded-2xl border border-dashed border-[var(--ink-200)] bg-[var(--ink-50)]/60 transition hover:border-[var(--amber-dark)]",
                  existing ? "border-solid border-[var(--ink-100)] bg-white" : "",
                  busy ? "cursor-progress" : "cursor-pointer",
                )}
              >
                <input
                  type="file"
                  accept={ACCEPTED_TYPES.join(",")}
                  className="sr-only"
                  disabled={busy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) upload(file, slot);
                    event.target.value = "";
                  }}
                />

                {existing ? (
                  <div className="relative h-full w-full">
                    <Image
                      src={existing.url}
                      alt={`${humanSlot(slot)} photo`}
                      fill
                      sizes="(min-width: 1024px) 20rem, 45vw"
                      className="object-cover"
                      unoptimized={shouldBypassNextImageOptimization(existing.url)}
                    />
                    {existing.isCover ? (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white backdrop-blur">
                        <ShieldCheck className="h-3 w-3 text-[#FFC72C]" />
                        Cover
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[var(--amber-dark)]">
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImagePlus className="h-4 w-4" />
                      )}
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-500)]">
                      {humanSlot(slot)}
                    </p>
                    <p className="text-[11px] text-[var(--ink-400)]">
                      {busy ? "Uploading…" : "Tap to upload"}
                    </p>
                  </div>
                )}
              </label>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-3 text-xs text-[var(--ink-500)]">
          <Camera className="h-3.5 w-3.5 text-[var(--amber-dark)]" />
          JPEG, PNG, or WebP — up to 10 MB per photo.
        </div>
      </CardContent>
    </Card>
  );
}
