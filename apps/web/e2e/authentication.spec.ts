import { expect, test } from "@playwright/test";

test.beforeEach(async ({ request }) => { await request.post("http://127.0.0.1:4500/__reset"); });

test("phone code login sends once, verifies, and establishes the ordinary session", async ({ page, context, request }) => {
  await page.goto("/auth/login");
  await page.getByLabel("Phone number", { exact: true }).fill("0771234567");
  await page.getByRole("button", { name: "Send sign-in code", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Enter the six-digit code", exact: true })).toBeVisible();
  const state = await (await request.get("http://127.0.0.1:4500/__auth-state")).json();
  expect(state.loginRequests).toEqual([{ identifier: "+263771234567", channels: ["SMS"] }]);
  await expect(page.getByRole("button", { name: /Resend in/ })).toBeDisabled();
  await page.getByLabel("Verification code").fill("111111");
  await page.getByRole("button", { name: /Verify code/ }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Invalid code" })).toBeVisible();
  await page.getByLabel("Verification code").fill("246810");
  await page.getByRole("button", { name: /Verify code/ }).click();
  await expect(page).toHaveURL("/");
  expect((await context.cookies()).some(cookie => cookie.name === "auto_iq_session" && cookie.httpOnly)).toBe(true);
});

test("email channel and password fallback stay available", async ({ page, request }) => {
  await page.goto("/auth/login");
  await page.getByRole("radio", { name: "Email", exact: true }).check();
  await page.getByLabel("Email address", { exact: true }).fill("Buyer@Example.test");
  await page.getByRole("button", { name: "Send sign-in code", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Enter the six-digit code", exact: true })).toBeVisible();
  const state = await (await request.get("http://127.0.0.1:4500/__auth-state")).json();
  expect(state.loginRequests[0]).toEqual({ identifier: "buyer@example.test", channels: ["EMAIL"] });
  await page.goto("/auth/login");
  await page.getByRole("button", { name: "Sign in with a password", exact: true }).click();
  await page.getByLabel("Email or phone", { exact: true }).fill("+263771234567");
  expect(await page.getByLabel("Email or phone", { exact: true }).evaluate((input: HTMLInputElement) => input.validity.typeMismatch)).toBe(false);
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
});

test("a failed passkey attempt leaves code and password sign-in usable on mobile", async ({ page }) => {
  await page.route("**/api/auth/passkeys/login/options", route => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Test-only provider failure" }) }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/auth/login");
  await page.getByRole("button", { name: "Sign in with a passkey", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Sign in with a code or password" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send sign-in code", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Sign in with a password", exact: true })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "/tmp/auto-iq-auth-mobile.png", fullPage: true });
});

test("account exposes passkey setup without technical key material", async ({ context, page }) => {
  await context.addCookies([{ name: "auto_iq_session", value: "buyer-e2e-session", domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" }]);
  await page.goto("/account");
  await expect(page.getByRole("heading", { name: "Passkeys", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create a passkey", exact: true })).toBeEnabled();
  await expect(page.getByText("You have no saved passkeys yet.")).toBeVisible();
  await page.screenshot({ path: "/tmp/auto-iq-auth-account.png", fullPage: true });
});


test("browser creates and uses a real virtual passkey through the protected proxy", async ({ page, context }) => {
  const cdp = await context.newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  const { authenticatorId } = await cdp.send("WebAuthn.addVirtualAuthenticator", { options: {
    protocol: "ctap2", transport: "internal", hasResidentKey: true, hasUserVerification: true,
    isUserVerified: true, automaticPresenceSimulation: true,
  } });
  await context.addCookies([{ name: "auto_iq_session", value: "buyer-e2e-session", domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" }]);
  await page.goto("/account");
  await page.getByRole("button", { name: "Create a passkey", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Passkey created" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove", exact: true })).toBeVisible();
  expect((await cdp.send("WebAuthn.getCredentials", { authenticatorId })).credentials).toHaveLength(1);
  await context.clearCookies();
  await page.goto("/auth/login");
  await page.getByRole("button", { name: "Sign in with a passkey", exact: true }).click();
  await expect(page).toHaveURL("/");
  expect((await context.cookies()).some(cookie => cookie.name === "auto_iq_session" && cookie.httpOnly)).toBe(true);
  await cdp.send("WebAuthn.removeVirtualAuthenticator", { authenticatorId });
});
