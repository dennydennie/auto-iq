import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BiSell AutoIQ",
  description: "Zimbabwe's trust-first vehicle marketplace",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
