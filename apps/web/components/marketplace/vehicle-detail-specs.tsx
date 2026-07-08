import type { PublicListingDto } from "@auto-iq/contracts/catalogue";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatKm } from "@/lib/format";
import { labelizeEnum } from "@/lib/vehicle-ui";

type SpecRow = {
  label: string;
  value: string | number | null | undefined;
};

function display(value: SpecRow["value"]) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }
  return String(value);
}

function SpecTable({ title, rows }: { title: string; rows: SpecRow[] }) {
  return (
    <section className="rounded-2xl border border-[var(--ink-100)] bg-white">
      <h3 className="border-b border-[var(--ink-100)] px-4 py-3 text-sm font-semibold text-[var(--ink-900)]">
        {title}
      </h3>
      <dl className="grid sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[8rem_1fr] border-b border-[var(--ink-100)] last:border-b-0 sm:odd:border-r">
            <dt className="bg-[var(--ink-50)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--ink-400)]">
              {row.label}
            </dt>
            <dd className="px-3 py-2 text-sm font-semibold text-[var(--ink-900)]">
              {display(row.value)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function VehicleDetailSpecs({ listing }: { listing: PublicListingDto }) {
  const summary = [
    { label: "Mileage", value: formatKm(listing.mileageKm) },
    { label: "Year", value: String(listing.year) },
    { label: "Engine", value: display(listing.engineCapacity) },
    { label: "Trans.", value: labelizeEnum(listing.transmission) },
    { label: "Fuel", value: labelizeEnum(listing.fuelType) },
  ];

  return (
    <section className="mt-8 space-y-4" aria-labelledby="vehicle-specs-title">
      <div className="rounded-[1.5rem] border border-[var(--ink-100)] bg-white p-4 shadow-[0_24px_70px_-48px_rgba(10,30,77,0.48)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2
              id="vehicle-specs-title"
              className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ink-900)]"
            >
              SPECS
            </h2>
            <Badge variant="amber">LOCATION · {display(listing.city)}</Badge>
          </div>
          <p className="text-xs text-[var(--ink-400)]">
            Published {formatDate(listing.publishedAt)}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {summary.map((item) => (
            <div key={item.label} className="rounded-2xl border border-[var(--ink-100)] bg-[var(--ink-50)] px-3 py-3 text-center">
              <p className="text-[11px] text-[var(--ink-400)]">{item.label}</p>
              <p className="mt-1 text-sm font-bold text-[var(--ink-900)]">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        <SpecTable
          title="Vehicle details"
          rows={[
            { label: "Make", value: listing.make },
            { label: "Model", value: listing.model },
            { label: "Body type", value: labelizeEnum(listing.bodyType) },
            { label: "Colour", value: listing.colour },
          ]}
        />
        <SpecTable
          title="Vehicle performance"
          rows={[
            { label: "Drive", value: labelizeEnum(listing.driveType) },
            { label: "Transmission", value: labelizeEnum(listing.transmission) },
            { label: "Fuel", value: labelizeEnum(listing.fuelType) },
            { label: "Engine size", value: listing.engineCapacity },
            { label: "Mileage", value: formatKm(listing.mileageKm) },
          ]}
        />
        <SpecTable
          title="Market details"
          rows={[
            { label: "Location", value: listing.city },
            { label: "Published date", value: formatDate(listing.publishedAt) },
            { label: "Views", value: listing.viewCount },
            { label: "Photos", value: listing.images.length },
          ]}
        />
      </div>
    </section>
  );
}
