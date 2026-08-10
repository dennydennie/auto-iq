import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectKeyboardReachable,
  expectTouchTarget,
} from "./accessibility-helpers";

test.beforeEach(async ({ context, request }) => {
  await request.post("http://127.0.0.1:4400/__reset");
  await context.addCookies([
    {
      name: "auto_iq_session",
      value: "admin-accessibility-session",
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
});

test("admin queue and viewing scheduler are accessible", async ({ page }) => {
  await page.goto("/admin/listings");
  await expect(page.getByRole("heading", { name: "Moderation queue" })).toBeVisible();
  await expectAccessible(page, "admin moderation queue");
  await expectKeyboardReachable(page, page.getByLabel("Sort listings"));

  await page.goto("/admin/viewings");
  await expect(page.getByRole("heading", { name: "Viewing scheduler" })).toBeVisible();
  await expectAccessible(page, "admin viewing scheduler");
  await expectKeyboardReachable(page, page.getByLabel("Search buyer, make, or model"));
  await expectKeyboardReachable(page, page.getByRole("button", { name: "Apply" }));

  await page.setViewportSize({ width: 390, height: 844 });
  await expectTouchTarget(page.getByLabel("Viewing status"));
  await expectTouchTarget(page.getByRole("button", { name: "Apply" }));
});
