import { expect, test } from "@playwright/test";
import {
  expectAccessible,
  expectKeyboardReachable,
  expectTouchTarget,
} from "./accessibility-helpers";

test.beforeEach(async ({ context, request }) => {
  await request.post("http://127.0.0.1:4500/__reset");
  await context.addCookies([
    {
      name: "auto_iq_session",
      value: "buyer-accessibility-session",
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
});

test("auth and seller listing entry are keyboard and axe clean", async ({
  page,
}) => {
  await page.goto("/auth/login");
  await expectAccessible(page, "login");
  await expectKeyboardReachable(page, page.getByLabel("Email or phone"));
  await expectKeyboardReachable(
    page,
    page.getByLabel("Password", { exact: true }),
  );
  await expectKeyboardReachable(
    page,
    page.getByRole("button", { name: "Sign in" }),
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await expectTouchTarget(page.getByLabel("Email or phone"));
  await expectTouchTarget(page.getByRole("button", { name: "Sign in" }));

  await page.goto("/seller/listings/new");
  await expect(
    page.getByRole("heading", { name: "List your vehicle" }),
  ).toBeVisible();
  await expectAccessible(page, "seller listing wizard");
  await expectKeyboardReachable(page, page.getByLabel("Make"));
});

test("marketplace filters and buyer viewings are accessible", async ({
  page,
}) => {
  await page.goto("/vehicles");
  await expect(
    page.getByRole("heading", { name: "Browse vehicles" }),
  ).toBeVisible();
  await expectAccessible(page, "buyer marketplace");
  const filters = page.getByLabel("Catalogue filters").first();
  await expectKeyboardReachable(page, filters.getByLabel("Make"));
  await expectKeyboardReachable(
    page,
    filters.getByRole("button", { name: "Apply filters" }),
  );

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileFilterToggle = page.getByRole("button", { name: /^Filters/ });
  await expectTouchTarget(mobileFilterToggle);
  await mobileFilterToggle.click();
  const filterDialog = page.getByRole("dialog", { name: "Filter vehicles" });
  await expect(filterDialog).toBeVisible();
  await expect(
    filterDialog.getByRole("button", { name: "Close filters" }),
  ).toBeFocused();
  const mobileFilters = page.locator(
    'aside[aria-label="Catalogue filters"]:visible',
  );
  await expectTouchTarget(mobileFilters.getByLabel("Make"));
  await expectTouchTarget(
    mobileFilters.getByRole("button", { name: "Apply filters" }),
  );
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await page.keyboard.press("Escape");
  await expect(filterDialog).toBeHidden();
  await expect(mobileFilterToggle).toBeFocused();

  await page.goto("/viewings");
  await expect(
    page.getByRole("heading", { name: "Your viewings" }),
  ).toBeVisible();
  await expectAccessible(page, "buyer viewings");
});

test("public landing and mobile navigation remain responsive", async ({
  page,
}) => {
  await page.goto("/");
  const heroImage = page.getByRole("img", {
    name: "Blue Honda Vezel Hybrid, front three-quarter view",
  });
  await expect(heroImage).toBeVisible();
  await expect
    .poll(() =>
      heroImage.evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBeGreaterThan(0);
  await expect(page.getByLabel("Vehicle make")).toContainText("Toyota");
  await expect(page.getByLabel("City")).toContainText("Harare");

  await page.setViewportSize({ width: 390, height: 844 });
  const menuButton = page.getByRole("button", { name: "Open menu" });
  await menuButton.click();
  const menuDialog = page.getByRole("dialog", {
    name: "Mobile primary navigation",
  });
  await expect(menuDialog).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await page.keyboard.press("Escape");
  await expect(menuDialog).toBeHidden();
  await expect(menuButton).toBeFocused();

  const hasOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(hasOverflow).toBe(false);
});

test("Arabic locale is RTL without horizontal overflow", async ({
  context,
  page,
}) => {
  await context.addCookies([
    {
      name: "auto_iq_locale",
      value: "ar",
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/vehicles");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const hasOverflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(hasOverflow).toBe(false);
  await expectAccessible(page, "Arabic RTL marketplace");
});
