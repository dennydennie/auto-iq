import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_WEB_URL ?? "https://web-staging-1017.up.railway.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/auth", "/onboarding"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
