import type { PublicListingDto } from "@auto-iq/contracts/catalogue";
import { MapPin } from "lucide-react";
import { formatDate, formatKm, formatPrice } from "@/lib/format";
import { labelizeEnum } from "@/lib/vehicle-ui";

type SpecRow = {
  label: string;
  value: string;
};

function valueOrDash(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  return String(value);
}

function coordinates(value: PublicListingDto["locationCoordinates"]) {
  if (!value) return "Not provided";
  return `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`;
}

function vehicleRows(listing: PublicListingDto): SpecRow[] {
  return [
    { label: "Make", value: listing.make },
    { label: "Model", value: listing.model },
    { label: "Registration year", value: String(listing.year) },
    { label: "Body type", value: labelizeEnum(listing.bodyType) },
    { label: "Colour", value: listing.colour },
    { label: "Location", value: listing.city },
    { label: "Coordinates", value: coordinates(listing.locationCoordinates) },
    { label: "Listing ref", value: listing.id.slice(0, 8).toUpperCase() },
  ];
}

function performanceRows(listing: PublicListingDto): SpecRow[] {
  return [
    { label: "Mileage", value: formatKm(listing.mileageKm) },
    { label: "Transmission", value: labelizeEnum(listing.transmission) },
    { label: "Fuel type", value: labelizeEnum(listing.fuelType) },
    { label: "Drive type", value: labelizeEnum(listing.driveType) },
    { label: "Engine capacity", value: valueOrDash(listing.engineCapacity) },
  ];
}

function marketRows(listing: PublicListingDto): SpecRow[] {
  return [
    { label: "Price", value: formatPrice(listing.askPriceUsd, "USD") },
    { label: "Price type", value: listing.negotiable ? "Negotiable" : "Fixed seller price" },
    { label: "Published", value: formatDate(listing.publishedAt) },
    { label: "Photos", value: String(listing.images.length) },
    { label: "Views", value: String(listing.viewCount) },
  ];
}

function SpecCard({ rows, title }: { rows: SpecRow[]; title: string }) {
  return (
    <section className="rounded-[1.5rem] border border-[var(--ink-100)] bg-white p-5">
      <h2 className="display text-2xl text-[var(--ink-900)]">{title}</h2>
      <dl className="mt-4 divide-y divide-[var(--ink-100)]">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[1fr_auto] gap-4 py-3 text-sm">
            <dt className="text-[var(--ink-500)]">{row.label}</dt>
            <dd className="text-right font-semibold text-[var(--ink-900)]">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function VehicleDetailSpecs({ listing }: { listing: PublicListingDto }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="display text-4xl text-[var(--ink-900)]">Vehicle Specs</h2>
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--ink-900)] shadow-sm">
          <MapPin className="h-4 w-4 text-[var(--amber-dark)]" />
          {listing.city}
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <SpecCard title="Vehicle details" rows={vehicleRows(listing)} />
        <SpecCard title="Vehicle performance" rows={performanceRows(listing)} />
        <SpecCard title="Market details" rows={marketRows(listing)} />
        <SpecCard
          title="Vehicle condition"
          rows={[
            {
              label: "Inspection status",
              value: listing.bisellVerified ? "BiSell verified" : "Inspection summary pending",
            },
            {
              label: "Roadworthy",
              value: listing.inspectionSummary?.roadworthy ? "Yes" : "Not confirmed",
            },
            {
              label: "Inspection score",
              value: listing.inspectionSummary ? `${listing.inspectionSummary.overallScore}/100` : "Not provided",
            },
          ]}
        />
      </div>
    </div>
  );
}
