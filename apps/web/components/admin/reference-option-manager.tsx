"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  REFERENCE_OPTION_CATEGORIES,
  type AdminReferenceOptionDto,
  type ReferenceOptionCategory,
} from "@auto-iq/contracts/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import { isApiFailure, patchJson, postJson } from "@/lib/web-api";
import { labelizeEnum } from "@/lib/vehicle-ui";

export function ReferenceOptionManager({ options }: { options: AdminReferenceOptionDto[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useState<ReferenceOptionCategory>("BODY_TYPE");

  function createOption(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await postJson<AdminReferenceOptionDto>("/api/admin/settings/reference-options", {
        category,
        code: String(form.get("code") ?? "").trim().toUpperCase(),
        label: String(form.get("label") ?? "").trim(),
        sortOrder: Number(form.get("sortOrder") ?? 0),
      });
      if (isApiFailure(result)) {
        toast({ title: "Option not added", description: result.error.message, variant: "error" });
        return;
      }
      toast({ title: "Reference option added", description: result.data.label, variant: "success" });
      router.refresh();
    });
  }

  function toggle(option: AdminReferenceOptionDto) {
    startTransition(async () => {
      const result = await patchJson<AdminReferenceOptionDto>(
        `/api/admin/settings/reference-options/${option.id}`,
        { active: !option.active },
      );
      if (isApiFailure(result)) {
        toast({ title: "Option not updated", description: result.error.message, variant: "error" });
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <form onSubmit={createOption} className="grid gap-4 rounded-2xl bg-[var(--ink-50)] p-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="reference-category">Category</Label>
          <Select id="reference-category" value={category} onChange={(event) => setCategory(event.target.value as ReferenceOptionCategory)}>
            {REFERENCE_OPTION_CATEGORIES.map((value) => <option key={value} value={value}>{labelizeEnum(value)}</option>)}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reference-code">Code</Label>
          <Input id="reference-code" name="code" pattern="[A-Z0-9_]+" placeholder="PLUG_IN_HYBRID" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reference-label">Label</Label>
          <Input id="reference-label" name="label" placeholder="Plug-in hybrid" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reference-sort">Sort order</Label>
          <div className="flex gap-2"><Input id="reference-sort" name="sortOrder" type="number" min={0} defaultValue={0} /><Button type="submit" disabled={isPending}>Add</Button></div>
        </div>
      </form>
      <div className="grid gap-3 md:grid-cols-2">
        {options.map((option) => (
          <div key={option.id} className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--ink-100)] p-4">
            <div><p className="font-semibold text-[var(--ink-900)]">{option.label}</p><p className="text-xs text-[var(--ink-400)]">{labelizeEnum(option.category)} · {option.code}</p></div>
            <Button size="sm" variant={option.active ? "destructive" : "outline"} disabled={isPending} onClick={() => toggle(option)}>{option.active ? "Deactivate" : "Activate"}</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
