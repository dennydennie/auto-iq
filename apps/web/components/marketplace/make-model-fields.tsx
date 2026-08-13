"use client";

import { useEffect, useRef, useState } from "react";
import type { CatalogueModelFacet } from "@auto-iq/contracts/catalogue";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { parseModelFacets } from "@/lib/catalogue-model-facets";

type LoadStatus = "idle" | "loading" | "error";

export function MakeModelFields({
  idPrefix,
  initialMake,
  initialModel,
  initialModels,
  makeOptions,
}: {
  idPrefix: string;
  initialMake: string;
  initialModel: string;
  initialModels: CatalogueModelFacet[];
  makeOptions: string[];
}) {
  const [make, setMake] = useState(initialMake);
  const [model, setModel] = useState(initialModel);
  const [models, setModels] = useState(initialModels);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const requestRef = useRef<AbortController | null>(null);
  const modelHelpId = `${idPrefix}-model-help`;

  useEffect(() => () => requestRef.current?.abort(), []);

  async function changeMake(nextMake: string) {
    requestRef.current?.abort();
    setMake(nextMake);
    setModel("");
    setModels([]);
    if (!nextMake) return setStatus("idle");
    await loadModels(nextMake);
  }

  async function loadModels(nextMake: string) {
    const controller = new AbortController();
    requestRef.current = controller;
    setStatus("loading");
    try {
      const response = await fetch(modelFacetsPath(nextMake), {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Model request failed");
      setModels(parseModelFacets(await response.json(), nextMake));
      setStatus("idle");
    } catch {
      if (!controller.signal.aborted) setStatus("error");
    }
  }

  const modelDisabled = !make || status !== "idle" || models.length === 0;
  return (
    <>
      <div className="space-y-2">
        <Label
          htmlFor={`${idPrefix}-make`}
          className="text-xs uppercase tracking-[0.1em] text-[var(--ink-400)]"
        >
          Make
        </Label>
        <Select
          id={`${idPrefix}-make`}
          name="make"
          value={make}
          className="h-11"
          onChange={(event) => void changeMake(event.target.value)}
        >
          <option value="">Any make</option>
          {makeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label
          htmlFor={`${idPrefix}-model`}
          className="text-xs uppercase tracking-[0.1em] text-[var(--ink-400)]"
        >
          Model
        </Label>
        <Select
          id={`${idPrefix}-model`}
          name="model"
          value={model}
          className="h-11"
          disabled={modelDisabled}
          aria-busy={status === "loading"}
          aria-describedby={modelHelpId}
          onChange={(event) => setModel(event.target.value)}
        >
          <option value="">Any model</option>
          {models.map((facet) => (
            <option key={facet.model} value={facet.model}>
              {facet.model} ({facet.count})
            </option>
          ))}
        </Select>
        <p
          id={modelHelpId}
          role={status === "error" ? "alert" : undefined}
          className="text-xs leading-5 text-[var(--ink-400)]"
        >
          {modelHelp(make, models.length, status)}
        </p>
        {status === "error" ? (
          <button
            type="button"
            className="text-xs font-semibold text-[var(--amber-dark)] underline-offset-4 hover:underline"
            onClick={() => void loadModels(make)}
          >
            Retry models
          </button>
        ) : null}
      </div>
    </>
  );
}

function modelFacetsPath(make: string) {
  return `/api/catalogue/model-facets?${new URLSearchParams({ make })}`;
}

function modelHelp(make: string, count: number, status: LoadStatus) {
  if (!make) return "Choose a make to load its models.";
  if (status === "loading") return "Loading available models…";
  if (status === "error") return "Models could not be loaded.";
  if (count === 0) return "No published models are available for this make.";
  return `${count} ${count === 1 ? "model" : "models"} available.`;
}
