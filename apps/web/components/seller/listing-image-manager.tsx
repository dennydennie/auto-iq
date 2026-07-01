"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IMAGE_SLOTS, type ImageSlot } from "@auto-iq/contracts/enums";
import type { VehicleImageDto } from "@auto-iq/contracts/storage";
import { AlertTriangle, UploadCloud } from "lucide-react";
import { ErrorBanner } from "@/components/shared/error-banner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

function labelize(value: string) {
  return value.toLowerCase().replace(/_/g, " ");
}

function firstAvailableSlot(images: VehicleImageDto[]) {
  const used = new Set(images.map((image) => image.slot));
  return IMAGE_SLOTS.find((slot) => !used.has(slot)) ?? IMAGE_SLOTS[0];
}

export function ListingImageManager({
  images,
  listingId,
}: {
  images: VehicleImageDto[];
  listingId: string;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [slot, setSlot] = useState<ImageSlot>(() => firstAvailableSlot(images));
  const [isCover, setIsCover] = useState(images.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setError(null);
    setFile(event.target.files?.[0] ?? null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Choose a vehicle photo before uploading.");
      return;
    }
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type as (typeof SUPPORTED_IMAGE_TYPES)[number])) {
      setError("Upload a JPEG, PNG, or WebP image.");
      return;
    }

    startTransition(async () => {
      const body = new FormData();
      body.set("file", file);
      body.set("slot", slot);
      body.set("isCover", String(isCover));

      const response = await fetch(`/api/seller/listings/${listingId}/images/upload`, {
        method: "POST",
        body,
      });
      const payload = (await response.json()) as { message?: string } | VehicleImageDto;
      if (!response.ok) {
        const message = "message" in payload ? payload.message : null;
        setError(message ?? "The image upload failed. Try a smaller file or another image.");
        return;
      }

      setFile(null);
      setIsCover(false);
      router.refresh();
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error ? <ErrorBanner message={error} /> : null}
      <div className="grid gap-3 sm:grid-cols-[1fr_0.8fr]">
        <div className="space-y-2">
          <Label htmlFor="vehicle-photo">Vehicle photo</Label>
          <Input id="vehicle-photo" type="file" accept={SUPPORTED_IMAGE_TYPES.join(",")} onChange={handleFileChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vehicle-photo-slot">Photo view</Label>
          <Select id="vehicle-photo-slot" value={slot} onChange={(event) => setSlot(event.target.value as ImageSlot)}>
            {IMAGE_SLOTS.map((value) => (
              <option key={value} value={value}>
                {labelize(value)}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <Checkbox checked={isCover} onChange={(event) => setIsCover(event.target.checked)} label="Use as cover photo" />
      <div className="rounded-[1.1rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 p-4 text-sm leading-6 text-[var(--ink-500)]">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--amber-dark)]" />
          <p>Photos upload through the web app first, then the server stores them in the Railway Tigris bucket and registers them against this listing.</p>
        </div>
      </div>
      <Button type="submit" variant="amber" disabled={isPending}>
        <UploadCloud className="h-4 w-4" />
        {isPending ? "Uploading..." : "Upload photo"}
      </Button>
    </form>
  );
}
