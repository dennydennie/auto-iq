async (page) => {
  const config = await page.evaluate(() => ({
    password: sessionStorage.getItem("mobileE2EPassword"),
    phase: sessionStorage.getItem("mobileE2EPhase"),
    runId: sessionStorage.getItem("mobileE2ERunId"),
    storageOrigin: sessionStorage.getItem("mobileE2EStorageOrigin"),
  }));
  assertConfig(config);

  const accounts = {
    buyer: `mobile-web-buyer-${config.runId}@example.com`,
    seller: `mobile-web-seller-${config.runId}@example.com`,
    inspector: `mobile-web-inspector-${config.runId}@example.com`,
  };
  const marker = `mobile-web-e2e-${config.runId}`;

  const phases = {
    "buyer-auth": registerBuyer,
    "buyer-listing": browseAndActOnListing,
    "buyer-finish": verifyBuyerWorkspace,
    "seller-images": sellerToImageChooser,
    "seller-first-document": sellerToFirstDocument,
    "seller-second-document": () => chooseDocument("Seller id"),
    "seller-third-document": () => chooseDocument("Purchase import docs"),
    "seller-finish": finishSellerJourney,
    "inspector-evidence": inspectorToEvidenceChooser,
    "inspector-finish": finishInspectorJourney,
  };
  const execute = phases[config.phase];
  if (!execute) throw new Error(`Unknown mobile E2E phase: ${config.phase}`);
  await execute();
  return `MOBILE E2E PHASE PASSED: ${config.phase}`;

  function assertConfig(value) {
    for (const key of ["password", "phase", "runId", "storageOrigin"]) {
      if (!value[key]) throw new Error(`Missing sessionStorage config: ${key}`);
    }
  }

  async function enableAccessibility() {
    await page.waitForFunction(
      () =>
        document.querySelector("flt-semantics-placeholder") ||
        document.querySelector("flt-semantics"),
      null,
      { timeout: 30_000 },
    );
    const placeholder = page.locator("flt-semantics-placeholder");
    if (await placeholder.count()) {
      await placeholder.evaluate((element) => element.click());
    }
  }

  async function login(email) {
    await enableAccessibility();
    await fillField("Email or phone", email);
    await fillField("Password", config.password);
    await page
      .getByRole("button", { name: "Sign in", exact: true })
      .last()
      .click();
  }

  async function acceptConsents(expectedCount) {
    await visibleText("Review your agreements");
    const boxes = page.getByRole("checkbox");
    await waitForCount(boxes, expectedCount);
    for (const box of await boxes.all()) await box.click();
    await page.getByRole("button", { name: "Accept and continue" }).click();
  }

  async function logout(tabName) {
    await page.getByRole("tab", { name: tabName }).click();
    const button = await buttonAfterScrolling("Logout");
    await button.evaluate((element) => element.click());
    await page.getByRole("textbox", { name: "Email or phone" }).waitFor();
  }

  async function buttonAfterScrolling(name) {
    const button = page.getByRole("button", { name });
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await scrollPage(Number.MAX_SAFE_INTEGER);
      if (await button.isVisible()) return button;
    }
    throw new Error(`Could not find ${name} after scrolling`);
  }

  async function browseAndActOnListing() {
    const storageDownloads = [];
    const capture = (response) => {
      if (response.url().startsWith(config.storageOrigin)) {
        storageDownloads.push(response.status());
      }
    };
    page.on("response", capture);
    await page
      .getByRole("button", { name: /^2021 Toyota Hilux,/ })
      .first()
      .click();
    await page.getByRole("button", { name: "Save vehicle" }).last().click();
    await page
      .getByRole("button", { name: "Remove saved vehicle" })
      .last()
      .waitFor();
    await createQuote();
    await createViewing();
    await page.getByRole("button", { name: "Back" }).click();
    page.off("response", capture);
    if (!storageDownloads.some((status) => status === 200 || status === 304)) {
      throw new Error(
        "The Flutter Web buyer journey did not download a storage object",
      );
    }
  }

  async function registerBuyer() {
    await enableAccessibility();
    await page
      .getByRole("button", { name: "Register", exact: true })
      .last()
      .click();
    await fillField("Full name", "Mobile Web Buyer");
    await fillField("Email", accounts.buyer);
    await fillField("Phone", buyerPhone());
    await page.getByRole("button", { name: "Continue" }).click();
    await fillField("Password", config.password);
    await fillField("Confirm password", config.password);
    await page.getByRole("button", { name: "Create account" }).click();
    await page
      .getByRole("button", { name: "Use code" })
      .waitFor({ timeout: 30_000 });
    await page.getByRole("button", { name: "Use code" }).click();
    await page.getByRole("button", { name: "Verify and sign in" }).click();
    await acceptConsents(4);
  }

  async function createQuote() {
    await page.getByRole("button", { name: "Quote" }).click();
    await fillField("Offer price (USD)", "18000");
    await fillField("Message (optional)", `Quote ${marker}`);
    await page.getByRole("button", { name: "Send quote request" }).click();
    await visibleText("Quote request sent.");
  }

  async function createViewing() {
    await page.getByRole("button", { name: "Viewing" }).click();
    await selectMenu(/^Viewing location/, /^Belvedere Viewing Hub/);
    await fillField("Note (optional)", `Viewing ${marker}`);
    await page.getByRole("button", { name: "Request a viewing" }).click();
    await visibleText("Viewing requested.");
  }

  async function verifyBuyerWorkspace() {
    await page.getByRole("tab", { name: "Requests" }).click();
    await page.getByRole("button", { name: "New" }).click();
    await fillField("Max budget (USD)", "25000");
    await fillField("Notes (optional)", `Sourcing ${marker}`);
    await page.getByRole("button", { name: "Create request" }).click();
    await visibleTextContaining("Offer USD 18000");
    await visibleTextContaining("Budget USD 25000 · ASAP");
    await assertTabContains("Saved", "2021 Toyota Hilux");
    await assertTabContains("Viewings", "2021 Toyota Hilux");
    await logout("Account");
  }

  async function assertTabContains(tab, text) {
    await page.getByRole("tab", { name: tab }).click();
    await visibleTextContaining(text);
  }

  async function sellerToImageChooser() {
    await login(accounts.seller);
    await acceptConsents(4);
    await page.getByRole("button", { name: "New listing" }).click();
    await fillSellerSpecifications();
    await settleForm();
    await page.getByRole("button", { name: "Continue" }).click();
    await fillField("Ask price (USD)", "21000");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Add photos" }).click();
  }

  async function fillSellerSpecifications() {
    await fillField("Make", "E2E");
    await fillField("Model", `Web ${config.runId}`);
    await fillField("Colour", "Blue");
    await fillField("Mileage (km)", "23000");
  }

  async function sellerToFirstDocument() {
    await waitForCount(page.getByRole("img", { name: /^Listing photo/ }), 3);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Add document" }).click();
  }

  async function chooseDocument(documentName) {
    await visibleButton(
      new RegExp(`^Delete ${previousDocument(documentName)}`),
    );
    await selectMenu(/^Document type/, new RegExp(`^${documentName}`));
    await page.getByRole("button", { name: "Add document" }).click();
  }

  function previousDocument(documentName) {
    return documentName === "Seller id" ? "Registration book" : "Seller id";
  }

  async function finishSellerJourney() {
    await visibleButton(/^Delete Purchase import docs/);
    const failures = captureFailures();
    await page.getByRole("button", { name: "Continue" }).click();
    await fillField(
      "Ownership, service history, and known issues",
      `Complete ownership and service history for ${marker}.`,
    );
    await page.getByRole("button", { name: "Submit for review" }).click();
    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await visibleText("Listing submitted for review.");
    await page.waitForTimeout(1_200);
    failures.assertNone();
    await page.getByRole("button", { name: "Back" }).first().click();
    await page
      .getByRole("button", {
        name: new RegExp(`${new Date().getFullYear()} E2E Web ${config.runId}`),
      })
      .waitFor({ timeout: 30_000 });
    await logout("Account");
  }

  async function inspectorToEvidenceChooser() {
    await login(accounts.inspector);
    await acceptConsents(3);
    await page
      .getByRole("group", {
        name: new RegExp(`2022 Isuzu D-Max ${config.runId}`),
      })
      .waitFor({ timeout: 30_000 });
    await page.getByRole("button", { name: "Open task" }).click();
    const engine = await findingSection("Engine and drivetrain", "Fail");
    await engine.getByRole("button", { name: "Fail" }).click();
    await fillField(/^Engine and drivetrain/, `Engine evidence ${marker}`);
    await engine.getByRole("button", { name: "Add evidence photo" }).click();
    await page.getByText("Photo library", { exact: true }).click();
  }

  async function finishInspectorJourney() {
    await scrollInspectionForm(0);
    await page
      .getByRole("textbox", {
        name: /^Engine and drivetrain.*scaled_.*honda-vezel-hero\.jpg/s,
      })
      .waitFor({ timeout: 30_000 });
    const failures = captureFailures();
    for (const label of [
      "Electrical systems",
      "Body and paint",
      "Tyres and wheels",
      "Brakes and suspension",
      "Interior and controls",
    ]) {
      const section = await findingSection(label, "Pass");
      await section.getByRole("button", { name: "Pass" }).click();
    }
    await scrollInspectionForm(Number.MAX_SAFE_INTEGER);
    await fillField("Inspector summary", `Inspection complete ${marker}`);
    await page
      .getByRole("button", { name: "Submit inspection report" })
      .click();
    await page.getByRole("button", { name: "Submit report" }).click();
    await visibleText("Inspection report submitted.");
    await visibleText("Computed score: 87 out of 100");
    failures.assertNone();
    await page.getByRole("button", { name: "Back" }).click();
    await logout("Account");
  }

  async function findingSection(label, rating) {
    const positions = [0, 320, 640, 960, 1280, 1600, 1920];
    for (const position of positions) {
      await scrollInspectionForm(position);
      const field = page.getByRole("textbox", {
        name: new RegExp(`^${label}`),
      });
      const section = field.locator("..");
      if (await section.getByRole("button", { name: rating }).isVisible()) {
        return section;
      }
    }
    throw new Error(`Could not find the ${rating} control for ${label}`);
  }

  async function scrollInspectionForm(position) {
    await scrollPage(position);
  }

  async function scrollPage(position) {
    const scrollables = page.locator(
      'flt-semantics[style*="overflow-y: scroll"]',
    );
    await scrollables.evaluateAll((elements, scrollTop) => {
      for (const element of elements) {
        element.scrollTop = scrollTop;
        element.dispatchEvent(new Event("scroll", { bubbles: true }));
      }
    }, position);
    await page.waitForTimeout(150);
  }

  function captureFailures() {
    const values = [];
    const listener = (response) => {
      if (response.status() >= 400)
        values.push(`${response.status()} ${response.url()}`);
    };
    page.on("response", listener);
    return {
      assertNone() {
        page.off("response", listener);
        if (values.length)
          throw new Error(`Unexpected HTTP failures: ${values.join(", ")}`);
      },
    };
  }

  async function selectMenu(buttonName, itemName) {
    await page.getByRole("button", { name: buttonName }).click();
    await page.getByRole("menuitem", { name: itemName }).click();
  }

  async function visibleText(text) {
    await page
      .getByText(text, { exact: true })
      .first()
      .waitFor({ timeout: 30_000 });
  }

  async function visibleTextContaining(text) {
    await page
      .getByText(text, { exact: false })
      .first()
      .waitFor({ timeout: 30_000 });
  }

  async function visibleButton(name) {
    await page.getByRole("button", { name }).waitFor({ timeout: 30_000 });
  }

  async function settleForm() {
    await page.waitForTimeout(250);
  }

  async function fillField(name, value) {
    const field = page.getByRole("textbox", { name }).first();
    await primeTextInput(field);
    await field.pressSequentially(value, { delay: 2 });
    await settleForm();
    const actual = await field.inputValue();
    if (actual !== value) {
      throw new Error(`Expected ${name} to contain ${value}, found ${actual}`);
    }
  }

  async function primeTextInput(field) {
    await field.evaluate((element) => {
      element.focus();
      element.click();
    });
    await field.press("x");
    await page.waitForTimeout(50);
    await field.press("Backspace");
  }

  async function waitForCount(locator, expected) {
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      if ((await locator.count()) === expected) return;
      await page.waitForTimeout(200);
    }
    throw new Error(
      `Expected ${expected} elements, found ${await locator.count()}`,
    );
  }

  function buyerPhone() {
    const value = [...config.runId].reduce(
      (total, character) => (total * 31 + character.charCodeAt(0)) % 1_000_000,
      11,
    );
    return `+263779${`${value}`.padStart(6, "0")}`;
  }
}
