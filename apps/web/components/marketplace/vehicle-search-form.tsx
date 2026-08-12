import { ChevronDown, MapPin, Search, type LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type VehicleSearchOptions = {
  makes: string[];
  cities: string[];
};

export function VehicleSearchForm({
  options,
  defaultMake = "",
  defaultCity = "",
  sortBy,
  className,
}: {
  options: VehicleSearchOptions;
  defaultMake?: string;
  defaultCity?: string;
  sortBy?: string;
  className?: string;
}) {
  return (
    <form
      action="/vehicles"
      className={cn(
        "grid gap-3 rounded-[var(--radius-card)] border border-white/70 bg-white p-3 shadow-[0_30px_70px_-35px_rgba(5,20,56,0.7)] md:grid-cols-[1fr_1fr_auto]",
        className,
      )}
    >
      {sortBy ? <input type="hidden" name="sortBy" value={sortBy} /> : null}
      <SearchSelect
        icon={Search}
        label="Vehicle make"
        name="make"
        defaultValue={defaultMake}
        emptyLabel="All makes"
        options={includeCurrent(options.makes, defaultMake)}
      />
      <SearchSelect
        icon={MapPin}
        label="City"
        name="city"
        defaultValue={defaultCity}
        emptyLabel="All cities"
        options={includeCurrent(options.cities, defaultCity)}
      />
      <button
        className={buttonVariants({
          variant: "amber",
          className: "h-12 px-7",
        })}
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        Search vehicles
      </button>
    </form>
  );
}

function SearchSelect({
  icon: Icon,
  label,
  name,
  defaultValue,
  emptyLabel,
  options,
}: {
  icon: LucideIcon;
  label: string;
  name: string;
  defaultValue: string;
  emptyLabel: string;
  options: string[];
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <Icon
        className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--ink-400)]"
        aria-hidden="true"
      />
      <ChevronDown
        className="pointer-events-none absolute right-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--ink-400)]"
        aria-hidden="true"
      />
      <Select
        name={name}
        aria-label={label}
        defaultValue={defaultValue}
        className="h-12 appearance-none border-[var(--ink-200)] pl-11 pr-10"
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    </label>
  );
}

function includeCurrent(options: string[], current: string) {
  const values =
    current && !options.includes(current) ? [...options, current] : options;
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
