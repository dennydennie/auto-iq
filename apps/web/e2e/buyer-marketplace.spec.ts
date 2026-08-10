import { expect, test } from "@playwright/test";

const listingId = "22222222-2222-4222-8222-222222222222";
const listingSlug = "2021-toyota-hilux-harare";

test.beforeEach(async ({ context, request }) => {
  await request.post("http://127.0.0.1:4500/__reset");
  await context.addCookies([
    {
      name: "auto_iq_session",
      value: "buyer-e2e-session",
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
});

test("buyer filters, opens, saves, lists, and removes a vehicle", async ({
  page,
}) => {
  await page.goto("/vehicles");
  const filters = page.getByLabel("Catalogue filters").first();
  await filters.getByRole("link", { name: /Toyota/ }).click();
  await expect(page).toHaveURL(/make=Toyota/);
  await expect(page.getByRole("link", { name: "Toyota Hilux" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Honda CR-V" })).toHaveCount(0);

  await filters.getByLabel("Model").selectOption("Hilux");
  await filters.getByLabel("City").fill("Harare");
  await filters.getByRole("button", { name: "Apply filters" }).click();
  await page.getByRole("link", { name: "Toyota Hilux" }).click();
  await expect(page.getByRole("heading", { name: "2021 Toyota Hilux" })).toBeVisible();

  await page.getByRole("button", { name: "Save vehicle" }).first().click();
  await expect(page.getByText("Find it later in your saved list.")).toBeVisible();
  await page.goto("/saved");
  await expect(page.getByRole("heading", { name: "Saved vehicles" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Toyota Hilux" })).toBeVisible();

  await page.getByRole("button", { name: "Remove from saved" }).click();
  await expect(page.getByRole("heading", { name: "No saved vehicles yet" })).toBeVisible();
});

test("buyer quote reaches admin triage and returns an updated status", async ({
  page,
}) => {
  await page.goto(`/vehicles/${listingSlug}`);
  await page.getByRole("button", { name: "Open quote form" }).click();
  const dialog = page.getByRole("dialog", { name: "Request a quote" });
  await dialog.getByLabel("Offer price (USD)").fill("20500");
  await dialog.getByLabel("Payment plan").selectOption("BANK_TRANSFER");
  await dialog.getByLabel("Message").fill("Ready to buy this week.");
  await dialog.getByRole("button", { name: "Send quote" }).click();
  await expect(page.getByText("Your quote was sent for review.").first()).toBeVisible();

  await page.goto("/admin/quotes");
  await expect(page.getByRole("heading", { name: "Quote review" })).toBeVisible();
  await expect(page.getByText("Ready to buy this week.")).toBeVisible();
  await page.getByLabel("Response", { exact: true }).selectOption("ACCEPTED");
  await page.getByLabel("Response note").fill("Offer accepted by review team.");
  await page.getByRole("button", { name: "Save response" }).click();
  await expect(page.getByText("Quote updated")).toBeVisible();

  await page.goto("/quotes");
  await expect(page.getByRole("heading", { name: "Your quote requests" })).toBeVisible();
  await expect(page.getByText("Accepted", { exact: true })).toBeVisible();
});

test("buyer sourcing request reaches admin triage and returns an update", async ({
  page,
}) => {
  await page.goto("/requests");
  await page.getByLabel("Maximum budget (ZWG)").fill("350000");
  await page.getByLabel("Urgency").selectOption("ONE_MONTH");
  await page.getByLabel("Preferred make").selectOption("toyota");
  await page.getByLabel("Preferred model").fill("Fortuner");
  await page.getByLabel("Minimum year").fill("2020");
  await page.getByLabel("Maximum year").fill("2024");
  await page.getByLabel("Notes").fill("Seven seats and service history preferred.");
  await page.getByRole("button", { name: "Request this vehicle" }).click();
  await expect(page.getByText("Vehicle request submitted")).toBeVisible();
  await expect(page.getByText(/Toyota · Fortuner · 2020\+/)).toBeVisible();

  await page.goto("/admin/requests");
  await expect(page.getByRole("heading", { name: "Vehicle requests" })).toBeVisible();
  await expect(page.getByText("Seven seats and service history preferred.")).toBeVisible();
  await page.getByLabel("Status").selectOption("SOURCING");
  await page.getByLabel("Admin note").fill("Matching dealer stock now.");
  await page.getByRole("button", { name: "Update request" }).click();
  await expect(page.getByText("Request updated")).toBeVisible();

  await page.goto("/requests");
  await expect(page.getByText("Sourcing", { exact: true })).toBeVisible();
  await expect(page.getByText("Update: Matching dealer stock now.")).toBeVisible();
});
