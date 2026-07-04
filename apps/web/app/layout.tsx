import { Suspense } from "react";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FlashToast } from "@/components/ui/flash-toast";
import { ToasterProvider } from "@/components/ui/toaster";

const siteUrl = process.env.NEXT_PUBLIC_WEB_URL ?? "https://web-staging-1017.up.railway.app";

const bodyFont = Geist({
  subsets: ["latin"],
  variable: "--font-body",
});

const displayFont = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});

const monoFont = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BiSell AutoIQ | Buy and Sell Cars in Zimbabwe",
    template: "%s | BiSell AutoIQ",
  },
  description:
    "Buy and sell inspected cars in Zimbabwe with verified sellers, buyer-safe vehicle specs, and structured viewings.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "BiSell AutoIQ | Buy and Sell Cars in Zimbabwe",
    description:
      "Zimbabwe's trust-first vehicle marketplace for inspected cars, verified sellers, and structured buyer workflows.",
    siteName: "BiSell AutoIQ",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "BiSell AutoIQ | Buy and Sell Cars in Zimbabwe",
    description:
      "Browse inspected cars, sell your vehicle, and manage viewings through BiSell AutoIQ.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable}`}>
        <ToasterProvider>
          <Suspense fallback={null}>
            <FlashToast />
          </Suspense>
          {children}
        </ToasterProvider>
      </body>
    </html>
  );
}
