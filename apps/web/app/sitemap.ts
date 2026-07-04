import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_WEB_URL ?? "https://web-staging-1017.up.railway.app";

const publicRoutes = [
  "",
  "/buy-a-car",
  "/sell-my-car",
  "/vehicles",
  "/about",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "/vehicles" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
