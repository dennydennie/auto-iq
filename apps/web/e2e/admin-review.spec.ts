import { expect, test } from "@playwright/test";
import type { APIRequestContext, Page } from "@playwright/test";

const listingId = "11111111-1111-4111-8111-111111111111";

async function mockAdminActions(page: Page, request: APIRequestContext) {
  await page.route("**/api/admin/listings/**", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    const action = new URL(route.request().url()).pathname.split("/").at(-1);
    const response = await request.post("http://127.0.0.1:4400/__action", {
      data: { action, body: route.request().postDataJSON() ?? {} },
    });
    await route.fulfill({
      status: response.status(),
      contentType: "application/json",
      body: await response.text(),
      headers: { "x-correlation-id": "e2e-correlation-id" },
    });
  });
}

test.beforeEach(async ({ context, request }) => {
  await request.post("http://127.0.0.1:4400/__reset");
  await context.addCookies([
    {
      name: "auto_iq_session",
      value: "admin-e2e-session",
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
});

test("admin queue exposes in-progress filters and date sorting", async ({
  page,
}) => {
  await page.goto("/admin/listings");

  await expect(
    page.getByRole("heading", { name: "Moderation queue" }),
  ).toBeVisible();
  await expect(
    page.getByRole("option", { name: "Ownership pending" }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("option", { name: "Inspection pending" }),
  ).toHaveCount(1);
  await expect(page.getByLabel("Sort listings")).toHaveValue("updatedAt:DESC");
  await expect(
    page.getByRole("heading", { name: "2021 Toyota Hilux" }),
  ).toBeVisible();
});

test("admin can request changes with a seller-visible reason", async ({
  page,
  request,
}) => {
  await mockAdminActions(page, request);
  await page.goto(`/admin/listings/${listingId}`);
  await page
    .getByLabel("Moderation note")
    .fill("Please replace the blurred VIN photo.");
  await page.getByRole("button", { name: "Request changes" }).click();

  await expect(page.getByText("Changes req.", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Listing workflow updated successfully.").first(),
  ).toBeVisible();
});

test("admin completes trust gates before explicit publishing", async ({
  page,
  request,
}) => {
  await mockAdminActions(page, request);
  await page.goto(`/admin/listings/${listingId}`);
  await expect(
    page.getByRole("button", { name: "Approve listing" }),
  ).toBeDisabled();

  await page.getByLabel("Ownership decision").selectOption("APPROVED");
  await page.getByRole("button", { name: "Save ownership decision" }).click();
  await page.getByRole("button", { name: "Approve buyer summary" }).click();
  await expect(
    page.getByRole("button", { name: "Approve listing" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Approve listing" }).click();

  await expect(
    page.getByRole("button", { name: "Publish listing" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Publish listing" }).click();
  const dialog = page.getByRole("dialog", { name: "Publish this listing?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Publish listing" }).click();

  await expect(page.getByText("Published", { exact: true })).toBeVisible();
});

test("seller sees requested changes while a foreign listing remains hidden", async ({ page, request }) => {
  await request.post("http://127.0.0.1:4400/__action", {
    data: { action: "request-changes", body: { message: "Replace the blurred VIN photo." } },
  });
  await page.goto(`/seller/listings/${listingId}`);
  await expect(page.getByText("Replace the blurred VIN photo.").first()).toBeVisible();

  await page.goto("/seller/listings/99999999-9999-4999-8999-999999999999/edit");
  await expect(page.getByRole("heading", { name: "Listing not found" })).toBeVisible();
});
