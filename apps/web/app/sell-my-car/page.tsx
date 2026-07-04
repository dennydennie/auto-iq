import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Camera, ClipboardCheck, ShieldCheck } from "lucide-react";
import { PublicSiteShell } from "@/components/shared/public-site-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sell My Car",
  description:
    "Sell your car in Zimbabwe with structured listing capture, photo uploads, verification, and seller workflow tracking.",
  alternates: {
    canonical: "/sell-my-car",
  },
};

const sellerSteps = [
  {
    icon: ClipboardCheck,
    title: "Capture vehicle details",
    body: "Record make, model, year, price, mileage, colour, fuel, transmission, and location.",
  },
  {
    icon: Camera,
    title: "Add listing photos",
    body: "Upload multiple vehicle views so buyers can review the car before requesting a viewing.",
  },
  {
    icon: ShieldCheck,
    title: "Track review and interest",
    body: "Follow draft, review, viewing, and quote activity from the seller workspace.",
  },
];

export default function SellMyCarPage() {
  return (
    <PublicSiteShell>
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/70 bg-[radial-gradient(circle_at_top_right,rgba(255,205,83,0.2),transparent_36%),linear-gradient(180deg,#18233e_0%,#0f1830_100%)] p-6 text-white shadow-[0_30px_120px_-55px_rgba(22,31,58,0.65)] lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.92fr] lg:items-center">
            <div>
              <Badge variant="amber" className="bg-white/10 text-[#FFC72C]">Sell My Car</Badge>
              <h1 className="display mt-5 text-5xl leading-[0.92] text-white sm:text-6xl">
                List your vehicle with structure and buyer trust.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">
                BiSell gives Zimbabwean sellers a guided listing workflow, photo uploads,
                verification, and clear next actions before a vehicle reaches buyers.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/auth/signup?role=seller&next=/seller" className={buttonVariants({ variant: "amber", size: "lg" })}>
                  Start selling
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/seller" className={buttonVariants({ variant: "outline", size: "lg", className: "border-white/25 bg-white/5 text-white hover:bg-white/10" })}>
                  Seller workspace
                </Link>
              </div>
            </div>

            <div className="grid gap-3">
              {sellerSteps.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex gap-3">
                    <Icon className="mt-1 h-5 w-5 shrink-0 text-[#FFC72C]" />
                    <div>
                      <h2 className="font-semibold text-white">{title}</h2>
                      <p className="mt-1 text-sm leading-6 text-white/68">{body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PublicSiteShell>
  );
}
