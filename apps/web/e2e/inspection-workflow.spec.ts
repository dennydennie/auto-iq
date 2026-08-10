import { expect, test } from "@playwright/test";
import type { APIRequestContext, APIResponse, Page, Route } from "@playwright/test";

const taskId = "task-1";

async function mockInspectionActions(page: Page, request: APIRequestContext) {
  await page.route("**/api/admin/listings/**", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    const action = new URL(route.request().url()).pathname.split("/").at(-1);
    const response = await request.post("http://127.0.0.1:4400/__action", {
      data: { action, body: route.request().postDataJSON() ?? {} },
    });
    await fulfillJson(route, response);
  });
  await page.route("**/api/inspector/tasks/*/report", async (route) => {
    const response = await request.post(
      `http://127.0.0.1:4400/api/v1/inspectors/inspection-tasks/${taskId}/report`,
      { data: route.request().postDataJSON() },
    );
    await fulfillJson(route, response);
  });
}

async function fulfillJson(
  route: Route,
  response: APIResponse,
) {
  await route.fulfill({
    status: response.status(),
    contentType: "application/json",
    body: await response.text(),
    headers: { "x-correlation-id": "e2e-correlation-id" },
  });
}

test.beforeEach(async ({ context, request, page }) => {
  await request.post("http://127.0.0.1:4400/__inspection-reset");
  await context.addCookies([
    {
      name: "auto_iq_session",
      value: "inspection-e2e-session",
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await mockInspectionActions(page, request);
});

test("inspector submits a complete report for admin buyer-summary approval", async ({
  page,
}) => {
  await page.goto("/admin/listings/11111111-1111-4111-8111-111111111111");
  await page.getByLabel("Inspector").selectOption("inspector-1");
  await page.getByRole("button", { name: "Assign inspector" }).click();
  await expect(
    page.getByRole("link", { name: "Open inspection workspace" }),
  ).toBeVisible();

  await page.goto("/admin/inspections");
  await expect(
    page.getByRole("heading", { name: "Vehicle inspections" }),
  ).toBeVisible();
  await expect(page.getByText("Inspector One")).toBeVisible();

  await page.goto(`/inspector/tasks/${taskId}`);
  await page
    .getByRole("radiogroup", { name: "Body and structure rating" })
    .getByText("Watch")
    .click();
  await page
    .getByLabel("Inspector summary")
    .fill("Roadworthy with minor body wear for buyer review.");
  await page.getByRole("button", { name: "Submit inspection report" }).click();

  await expect(page.getByText("94/100")).toBeVisible();
  await expect(page.getByText("Awaiting admin review")).toBeVisible();

  await page.goto(`/admin/inspections/${taskId}`);
  await expect(
    page.getByRole("heading", { name: "Inspection findings" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Body and structure" }),
  ).toBeVisible();
  await page
    .getByLabel("Buyer-facing summary")
    .fill("Roadworthy; minor body wear is disclosed in the selected findings.");
  await page.getByRole("button", { name: "Approve buyer summary" }).click();

  await expect(
    page.getByText(
      "Buyer inspection summary approved and available to the publish workflow.",
    ),
  ).toBeVisible();
});
