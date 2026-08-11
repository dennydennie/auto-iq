"use client";

import { useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AdminViewingLocationDto } from "@auto-iq/contracts/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster";
import { isApiFailure, patchJson, postJson } from "@/lib/web-api";

export function ViewingLocationManager({ locations }: { locations: AdminViewingLocationDto[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  function createLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await postJson<AdminViewingLocationDto>("/api/admin/settings/viewing-locations", {
        name: String(form.get("name") ?? "").trim(),
        addressLine1: String(form.get("addressLine1") ?? "").trim(),
        addressLine2: String(form.get("addressLine2") ?? "").trim() || null,
        city: String(form.get("city") ?? "").trim(),
      });
      if (isApiFailure(result)) {
        toast({ title: "Location not added", description: result.error.message, variant: "error" });
        return;
      }
      toast({ title: "Viewing location added", description: result.data.name, variant: "success" });
      router.refresh();
    });
  }

  function toggle(location: AdminViewingLocationDto) {
    startTransition(async () => {
      const result = await patchJson<AdminViewingLocationDto>(
        `/api/admin/settings/viewing-locations/${location.id}`,
        { active: !location.active },
      );
      if (isApiFailure(result)) {
        toast({ title: "Location not updated", description: result.error.message, variant: "error" });
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <form onSubmit={createLocation} className="grid gap-4 rounded-2xl bg-[var(--ink-50)] p-4 md:grid-cols-2">
        <Field id="location-name" name="name" label="Location name" placeholder="Harare Showroom" />
        <Field id="location-city" name="city" label="City" placeholder="Harare" />
        <Field id="location-address" name="addressLine1" label="Address" placeholder="1 Example Road" />
        <div className="flex items-end gap-2"><Field id="location-address-2" name="addressLine2" label="Address line 2" placeholder="Optional" optional /><Button type="submit" disabled={isPending}>Add</Button></div>
      </form>
      <div className="grid gap-3 md:grid-cols-2">
        {locations.map((location) => (
          <div key={location.id} className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--ink-100)] p-4">
            <div><p className="font-semibold text-[var(--ink-900)]">{location.name}</p><p className="text-sm text-[var(--ink-500)]">{location.addressLine1}, {location.city}</p></div>
            <Button size="sm" variant={location.active ? "destructive" : "outline"} disabled={isPending} onClick={() => toggle(location)}>{location.active ? "Deactivate" : "Activate"}</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ id, name, label, placeholder, optional = false }: { id: string; name: string; label: string; placeholder: string; optional?: boolean }) {
  return <div className="w-full space-y-2"><Label htmlFor={id}>{label}</Label><Input id={id} name={name} placeholder={placeholder} required={!optional} /></div>;
}
