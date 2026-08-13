import assert from "node:assert/strict";
import test from "node:test";
import { validatePlayBundleInspection } from "./assert-play-bundle.mjs";

const expected = {
  apiOrigin: "https://api.autoiq.example",
  packageName: "zw.co.bisell.autoiq.mobile",
  versionName: "1.0.5",
};
const validInspection = {
  appBinary: Buffer.from(
    [
      expected.apiOrigin,
      "/api/v1/me/account-deletion-requests",
      "Request deletion of your AutoIQ account",
    ].join("\n"),
  ),
  certificate: "Owner: CN=BiSell AutoIQ Upload, O=BiSell",
  entries: "base/lib/arm64-v8a/libapp.so\nbase/lib/x86_64/libapp.so\n",
  manifest: [
    `package="${expected.packageName}"`,
    `android:versionName="${expected.versionName}"`,
    'android:targetSdkVersion="36"',
    'android:usesCleartextTraffic="false"',
    'android:label="BiSell AutoIQ"',
  ].join("\n"),
};

test("accepts a production-signed Play bundle", () => {
  assert.doesNotThrow(() =>
    validatePlayBundleInspection(validInspection, expected),
  );
});

test("rejects an Android debug certificate", () => {
  assert.throws(
    () =>
      validatePlayBundleInspection(
        {
          ...validInspection,
          certificate: "Owner: C=US, O=Android, CN=Android Debug",
        },
        expected,
      ),
    /debug certificate/,
  );
});

test("rejects cleartext-enabled release manifests", () => {
  assert.throws(
    () =>
      validatePlayBundleInspection(
        {
          ...validInspection,
          manifest: validInspection.manifest.replace("false", "true"),
        },
        expected,
      ),
    /usesCleartextTraffic/,
  );
});

test("rejects bundles without an arm64 binary", () => {
  assert.throws(
    () =>
      validatePlayBundleInspection(
        { ...validInspection, entries: "" },
        expected,
      ),
    /arm64-v8a/,
  );
});
