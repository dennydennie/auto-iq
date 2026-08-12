import assert from "node:assert/strict";
import test from "node:test";
import {
  APP_LOCALES,
  localeDirection,
  normalizeReturnPath,
  resolveLocale,
  translate,
} from "./i18n.ts";
import { formatDate, formatKm, formatPrice } from "./format.ts";

test("resolves supported locales and falls back to launch English", () => {
  assert.deepEqual(APP_LOCALES, ["en-ZW", "sn-ZW", "ar"]);
  assert.equal(resolveLocale("sn-ZW,sn;q=0.9"), "sn-ZW");
  assert.equal(resolveLocale("ar"), "ar");
  assert.equal(resolveLocale("fr-FR"), "en-ZW");
});

test("formats ICU-style plural messages with locale-aware counts", () => {
  assert.equal(
    translate("en-ZW", "catalogue.resultCount", { count: 1 }),
    "1 vehicle",
  );
  assert.equal(
    translate("en-ZW", "catalogue.resultCount", { count: 12 }),
    "12 vehicles",
  );
  assert.equal(translate("sn-ZW", "nav.browse"), "Tsvaga mota");
});

test("exposes RTL direction for Arabic", () => {
  assert.equal(localeDirection("ar"), "rtl");
  assert.equal(localeDirection("en-ZW"), "ltr");
});

test("keeps locale redirects on the current origin", () => {
  assert.equal(
    normalizeReturnPath("/vehicles?make=Toyota"),
    "/vehicles?make=Toyota",
  );
  assert.equal(normalizeReturnPath("https://example.com"), "/");
  assert.equal(normalizeReturnPath("//example.com"), "/");
  assert.equal(normalizeReturnPath("/\\example.com"), "/");
});

test("formats dates, prices, and mileage for the requested locale", () => {
  assert.equal(formatPrice(19500, "USD", "en-ZW"), "USD 19,500");
  assert.equal(formatKm(48500, "en-ZW"), "48,500 km");
  assert.equal(formatDate("2026-06-10T00:00:00.000Z", "en-ZW"), "10 Jun, 2026");
  assert.match(formatDate("2026-06-10T00:00:00.000Z", "ar"), /يونيو/);
});
