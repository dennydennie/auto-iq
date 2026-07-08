import { Suspense } from "react";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FlashToast } from "@/components/ui/flash-toast";
import { ToasterProvider } from "@/components/ui/toaster";
import { getSiteUrl } from "@/lib/site-url";

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
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "BiSell AutoIQ",
    template: "%s | BiSell AutoIQ",
  },
  description: "Zimbabwe's trust-first vehicle marketplace",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "BiSell AutoIQ",
    description: "Zimbabwe's trust-first vehicle marketplace",
    url: "/",
    siteName: "BiSell AutoIQ",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
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
