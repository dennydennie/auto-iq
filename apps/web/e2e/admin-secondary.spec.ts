import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context, request }) => {
  await request.post("http://127.0.0.1:4400/__reset");
  await context.addCookies([{ name: "auto_iq_session", value: "admin-e2e-session", domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" }]);
});

test("admin manages tenant user access", async ({ page }) => {
  await page.goto("/admin/users");
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  await expect(page.getByText("buyer@example.test")).toBeVisible();
  await page
    .getByRole("button", { name: "Grant Inspector role for Buyer One" })
    .click();
  await expect(page.getByText("Inspector role granted")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Revoke Inspector role for Buyer One" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Suspend" }).click();
  await expect(page.getByText("Access suspended")).toBeVisible();
  await expect(page.getByRole("button", { name: "Restore" })).toBeVisible();
});

test("admin runs and downloads the operations report", async ({ page }) => {
  await page.goto("/admin/reports");
  await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download CSV" })).toBeVisible();
});

test("admin adds an innovative fuel type without a deployment", async ({ page }) => {
  await page.goto("/admin/settings");
  await page.getByLabel("Category").selectOption("FUEL_TYPE");
  await page.getByLabel("Code").fill("HYDROGEN");
  await page.getByLabel("Label").fill("Hydrogen");
  await page.getByRole("button", { name: "Add" }).first().click();
  await expect(page.getByText("Reference option added")).toBeVisible();
  await expect(page.getByText("Hydrogen", { exact: true }).first()).toBeVisible();
});
