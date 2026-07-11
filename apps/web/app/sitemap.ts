import type { MetadataRoute } from "next";
import type { CatalogueResponse } from "@auto-iq/contracts/catalogue";
import { ROUTES } from "@auto-iq/contracts/routes";
import { getPublicJson, isServerApiFailure, withQuery } from "@/lib/server-api";
import { absoluteSiteUrl } from "@/lib/site-url";

const STATIC_ROUTES = [
  "/",
  "/vehicles",
  "/buy-a-car",
  "/sell-my-car",
  "/auth/login",
  "/auth/signup",
] as const;

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: absoluteSiteUrl(route),
    lastModified: now,
    changeFrequency:
      route === "/" || route === "/vehicles" ? "daily" : "weekly",
    priority: route === "/" ? 1 : route === "/vehicles" ? 0.9 : 0.7,
  }));
  return [...staticEntries, ...(await listingEntries())];
}

async function listingEntries() {
  const entries: MetadataRoute.Sitemap = [];
  let cursor: string | undefined;
  do {
    const result = await getPublicJson<CatalogueResponse>(
      withQuery(ROUTES.catalogue.list, { cursor, limit: 100 }),
    );
    if (isServerApiFailure(result)) break;
    entries.push(
      ...result.data.data.map((listing) => ({
        url: absoluteSiteUrl(`/vehicles/${listing.slug}`),
      })),
    );
    cursor = result.data.meta.nextCursor ?? undefined;
  } while (cursor && entries.length < 50_000);
  return entries;
}
