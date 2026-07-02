import { redirect } from "next/navigation";

/**
 * The homepage is the live catalogue. Guests browse vehicles immediately;
 * marketing copy lives at /about. Sign-in / register CTAs are surfaced inside
 * the catalogue hero for first-time visitors.
 */
export default function HomePage() {
  redirect("/vehicles");
}
