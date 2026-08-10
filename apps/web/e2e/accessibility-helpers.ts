import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

export async function expectAccessible(page: Page, surface: string) {
  const result = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const blockers = result.violations
    .filter(({ impact }) => impact === "critical" || impact === "serious")
    .map(({ id, impact, help, nodes }) => ({
      help,
      id,
      impact,
      targets: nodes.map(({ target }) => target.join(" ")),
    }));
  expect(blockers, `${surface} has serious or critical axe violations`).toEqual([]);
}

export async function expectKeyboardReachable(page: Page, locator: Locator) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    await page.keyboard.press("Tab");
    if (await locator.evaluate((element) => element === document.activeElement)) return;
  }
  throw new Error(`Keyboard focus did not reach ${await locator.getAttribute("name")}`);
}

export async function expectTouchTarget(locator: Locator, minimum = 44) {
  const box = await locator.boundingBox();
  expect(box, "touch target must be visible").not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(minimum);
  expect(box!.width).toBeGreaterThanOrEqual(minimum);
}
