import { expect, test } from "@playwright/test";

test("home hero image loads without mobile horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const image = page.getByRole("img", {
    name: "Blue Honda Vezel Hybrid, front three-quarter view",
  });
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth))
    .toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth,
  )).toBe(true);
});

test("hero content remains visible with reduced motion enabled", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Your next car. Your next move." }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: "Blue Honda Vezel Hybrid, front three-quarter view",
    }),
  ).toBeVisible();
});
