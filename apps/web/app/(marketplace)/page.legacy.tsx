import Link from "next/link";
import { Bell, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleCard } from "@/components/marketplace/vehicle-card";

const bodyTypes = ["All", "Bakkies", "Sedans", "SUVs", "Hatchbacks", "Vans"];

const listings = [
  {
    id: "1",
    year: 2021,
    make: "Toyota",
    model: "Hilux",
    bodyType: "bakkie" as const,
    mileageKm: 47200,
    location: "Harare",
    price: 19500,
    score: 82,
  },
  {
    id: "2",
    year: 2020,
    make: "Honda",
    model: "CR-V",
    bodyType: "suv" as const,
    mileageKm: 58300,
    location: "Bulawayo",
    price: 16200,
    score: 75,
  },
  {
    id: "3",
    year: 2022,
    make: "Volkswagen",
    model: "Polo",
    bodyType: "hatch" as const,
    mileageKm: 22100,
    location: "Harare",
    price: 11800,
    score: 88,
  },
  {
    id: "4",
    year: 2019,
    make: "Toyota",
    model: "Camry",
    bodyType: "sedan" as const,
    mileageKm: 69000,
    location: "Mutare",
    price: 14000,
    score: 71,
  },
];

export default function MarketplacePage() {
  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-5 rounded-[2rem] border border-white/60 bg-white/80 px-5 py-6 shadow-[0_28px_90px_-50px_rgba(22,31,58,0.35)] backdrop-blur sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Badge variant="outline">Buyer marketplace</Badge>
            <h1 className="display mt-4 text-4xl text-[var(--ink-900)] sm:text-5xl">
              Find your next ride with clearer trust signals.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--ink-500)] sm:text-base">
              This catalogue direction pushes the plan’s buyer experience closer to a real
              product: stronger information hierarchy, better browse rhythm, and clearer
              actions at the card level.
            </p>
          </div>
          <Button variant="ghost" size="icon" className="self-start rounded-full border border-[var(--ink-100)] bg-white">
            <Bell className="h-5 w-5 text-[var(--ink-500)]" />
          </Button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="flex items-center gap-3 rounded-[1rem] border border-[var(--ink-200)] bg-white px-4 py-3 shadow-sm">
            <Search className="h-4 w-4 text-[var(--ink-400)]" />
            <input
              type="text"
              className="w-full bg-transparent text-sm text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-400)]"
              placeholder="Search make, model, year, or location"
            />
          </label>
          <Button variant="outline" className="justify-center">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {bodyTypes.map((type, index) => (
            <button
              key={type}
              className={
                index === 0
                  ? "rounded-full bg-[var(--ink-900)] px-4 py-2 text-sm font-semibold text-[#FFC72C]"
                  : "rounded-full border border-[var(--ink-200)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink-500)]"
              }
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden bg-[linear-gradient(180deg,#18233e_0%,#0f1830_100%)] text-white">
          <CardHeader>
            <Badge variant="amber" className="w-fit bg-white/10 text-[#FFC72C]">
              Featured this week
            </Badge>
            <CardTitle className="mt-4 text-4xl text-white">2021 Toyota Hilux</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-white/74">
            <p>
              Harare · 47,200 km · 4WD · Independent inspection summary approved.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/vehicles/1" className={buttonVariants({ variant: "amber" })}>
                View vehicle
              </Link>
              <Link href="/saved" className={buttonVariants({ variant: "outline", className: "border-white/20 bg-transparent text-white hover:bg-white/10" })}>
                Save for later
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-4 p-6">
            {[
              "Inspection-approved summaries reduce guesswork before a viewing request.",
              "Cards now highlight trust score, location, mileage, and price without visual clutter.",
              "Browse actions are ready to grow into saved vehicles, quotes, and sourcing requests.",
            ].map((item) => (
              <div key={item} className="rounded-[1.2rem] border border-[var(--ink-100)] bg-[var(--ink-50)]/70 px-4 py-4 text-sm leading-6 text-[var(--ink-500)]">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="display text-3xl text-[var(--ink-900)]">Just inspected</h2>
          <p className="mt-1 text-sm text-[var(--ink-500)]">
            A sample catalogue section showing the visual direction for Phase W4.
          </p>
        </div>
        <Link href="/vehicles" className={buttonVariants({ variant: "ghost" })}>
          See all vehicles
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {listings.map((listing) => (
          <VehicleCard key={listing.id} {...listing} />
        ))}
      </div>
    </main>
  );
}
