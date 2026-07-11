import type { ReactNode } from "react";
import type {
  CatalogueMakeFacet,
  CatalogueModelFacet,
} from "@auto-iq/contracts/catalogue";
import {
  BODY_TYPES,
  FUEL_TYPES,
  TRANSMISSION_TYPES,
} from "@auto-iq/contracts/enums";
import { Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { labelizeEnum } from "@/lib/vehicle-ui";

export type CatalogueFilterState = {
  make: string;
  model: string;
  city: string;
  bodyType: string;
  fuelType: string;
  transmission: string;
  verified: string;
  yearMin: string;
  yearMax: string;
  priceMin: string;
  priceMax: string;
  mileageMax: string;
  sortBy: string;
};

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="group border-b border-[var(--ink-100)] py-4 last:border-b-0"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[var(--ink-900)]">
        <span>{title}</span>
        <span
          aria-hidden="true"
          className="text-[var(--ink-400)] transition group-open:rotate-180"
        >
          ▾
        </span>
      </summary>
      <div className="mt-3 space-y-3">{children}</div>
    </details>
  );
}

export function FilterSidebar({
  filters,
  className,
  clearHref,
  makes,
  models,
  buildMakeHref,
}: {
  filters: CatalogueFilterState;
  className?: string;
  clearHref: string;
  /** API-backed distinct makes with counts. Empty array hides the section. */
  makes?: CatalogueMakeFacet[];
  /** API-backed models for the selected make. */
  models?: CatalogueModelFacet[];
  /** Builds the Shop-by-make link for a given make value. */
  buildMakeHref?: (make: string) => string;
}) {
  return (
    <aside
      className={cn(
        "rounded-[1.75rem] border border-[var(--ink-100)] bg-white/95 p-5 shadow-[0_24px_60px_-40px_rgba(22,31,58,0.25)] backdrop-blur",
        className,
      )}
      aria-label="Catalogue filters"
    >
      <form className="space-y-1">
        <div className="flex items-center justify-between pb-2">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink-900)]">
            <Filter
              className="h-4 w-4 text-[var(--amber-dark)]"
              aria-hidden="true"
            />
            Filter
          </div>
          <a
            href={clearHref}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--ink-400)] transition hover:text-[var(--ink-900)]"
          >
            <X className="h-3 w-3" />
            Reset
          </a>
        </div>

        <Section title="Make and model">
          <div className="space-y-2">
            <Label
              htmlFor="filter-make"
              className="text-xs uppercase tracking-[0.1em] text-[var(--ink-400)]"
            >
              Make
            </Label>
            <Input
              id="filter-make"
              name="make"
              defaultValue={filters.make}
              placeholder="e.g. Toyota"
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="filter-model"
              className="text-xs uppercase tracking-[0.1em] text-[var(--ink-400)]"
            >
              Model
            </Label>
            <Select
              id="filter-model"
              name="model"
              defaultValue={filters.model}
              className="h-10"
              disabled={!filters.make}
            >
              <option value="">Any model</option>
              {models?.map((facet) => (
                <option key={facet.model} value={facet.model}>
                  {facet.model} ({facet.count})
                </option>
              ))}
            </Select>
          </div>
        </Section>

        {makes && makes.length > 0 && buildMakeHref ? (
          <Section title="Shop by make">
            <ul className="grid gap-1 text-sm">
              {makes.slice(0, 12).map((facet) => {
                const active =
                  filters.make.toLowerCase() === facet.make.toLowerCase();
                return (
                  <li key={facet.make}>
                    <a
                      href={buildMakeHref(facet.make)}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-2 py-1.5 transition hover:bg-[var(--ink-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--amber)]/45",
                        active
                          ? "bg-[var(--ink-900)] text-white hover:bg-[var(--ink-900)]"
                          : "text-[var(--ink-700)]",
                      )}
                    >
                      <span className="truncate font-medium">{facet.make}</span>
                      <span
                        className={cn(
                          "ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          active
                            ? "bg-[var(--amber)] text-[var(--ink-900)]"
                            : "bg-[var(--ink-50)] text-[var(--ink-500)]",
                        )}
                      >
                        {facet.count}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
            {makes.length > 12 ? (
              <p className="mt-2 text-[11px] text-[var(--ink-400)]">
                Showing top 12 · use the Make input above to filter to a
                specific make.
              </p>
            ) : null}
          </Section>
        ) : null}

        <Section title="Location">
          <div className="space-y-2">
            <Label
              htmlFor="filter-city"
              className="text-xs uppercase tracking-[0.1em] text-[var(--ink-400)]"
            >
              City
            </Label>
            <Input
              id="filter-city"
              name="city"
              defaultValue={filters.city}
              placeholder="e.g. Harare"
              className="h-10"
            />
          </div>
        </Section>

        <Section title="Body type">
          <Select
            id="filter-body-type"
            name="bodyType"
            defaultValue={filters.bodyType}
            className="h-10"
          >
            <option value="">Any body type</option>
            {BODY_TYPES.map((value) => (
              <option key={value} value={value}>
                {labelizeEnum(value)}
              </option>
            ))}
          </Select>
        </Section>

        <Section title="Price (USD)">
          <div className="grid grid-cols-2 gap-2">
            <Input
              name="priceMin"
              type="number"
              min={0}
              defaultValue={filters.priceMin}
              placeholder="Min"
              aria-label="Minimum price"
              className="h-10"
            />
            <Input
              name="priceMax"
              type="number"
              min={0}
              defaultValue={filters.priceMax}
              placeholder="Max"
              aria-label="Maximum price"
              className="h-10"
            />
          </div>
        </Section>

        <Section title="Year">
          <div className="grid grid-cols-2 gap-2">
            <Input
              name="yearMin"
              type="number"
              min={1950}
              max={2100}
              defaultValue={filters.yearMin}
              placeholder="From"
              aria-label="Year from"
              className="h-10"
            />
            <Input
              name="yearMax"
              type="number"
              min={1950}
              max={2100}
              defaultValue={filters.yearMax}
              placeholder="To"
              aria-label="Year to"
              className="h-10"
            />
          </div>
        </Section>

        <Section title="Mileage" defaultOpen={false}>
          <div className="space-y-2">
            <Label
              htmlFor="filter-mileage"
              className="text-xs uppercase tracking-[0.1em] text-[var(--ink-400)]"
            >
              Max km
            </Label>
            <Input
              id="filter-mileage"
              name="mileageMax"
              type="number"
              min={0}
              defaultValue={filters.mileageMax}
              placeholder="e.g. 150000"
              className="h-10"
            />
          </div>
        </Section>

        <Section title="Transmission" defaultOpen={false}>
          <Select
            id="filter-transmission"
            name="transmission"
            defaultValue={filters.transmission}
            className="h-10"
          >
            <option value="">Any transmission</option>
            {TRANSMISSION_TYPES.map((value) => (
              <option key={value} value={value}>
                {labelizeEnum(value)}
              </option>
            ))}
          </Select>
        </Section>

        <Section title="Fuel" defaultOpen={false}>
          <Select
            id="filter-fuel"
            name="fuelType"
            defaultValue={filters.fuelType}
            className="h-10"
          >
            <option value="">Any fuel type</option>
            {FUEL_TYPES.map((value) => (
              <option key={value} value={value}>
                {labelizeEnum(value)}
              </option>
            ))}
          </Select>
        </Section>

        <Section title="Verification">
          <Select
            id="filter-verified"
            name="verified"
            defaultValue={filters.verified}
            className="h-10"
          >
            <option value="">Any verification</option>
            <option value="true">BiSell verified only</option>
          </Select>
        </Section>

        <input type="hidden" name="sortBy" value={filters.sortBy} />

        <button
          className={buttonVariants({
            variant: "amber",
            className: "mt-4 w-full justify-center",
          })}
        >
          Apply filters
        </button>
      </form>
    </aside>
  );
}
