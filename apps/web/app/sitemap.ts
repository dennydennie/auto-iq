import type { MetadataRoute } from "next";
import { absoluteSiteUrl } from "@/lib/site-url";

const ROUTES = [
  "/",
  "/vehicles",
  "/buy-a-car",
  "/sell-my-car",
  "/auth/login",
  "/auth/signup",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map((route) => ({
    url: absoluteSiteUrl(route),
    lastModified: now,
    changeFrequency: route === "/" || route === "/vehicles" ? "daily" : "weekly",
    priority: route === "/" ? 1 : route === "/vehicles" ? 0.9 : 0.7,
  }));
}
