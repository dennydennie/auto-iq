import type { SiteHeaderLink } from "@/components/shared/site-header";

export const PUBLIC_SITE_LINKS = [
  {
    href: "/buy-a-car",
    messageKey: "nav.buy",
    activePaths: ["/vehicles"],
  },
  { href: "/sell-my-car", messageKey: "nav.sell" },
  { href: "/about", messageKey: "nav.howItWorks" },
] satisfies SiteHeaderLink[];
