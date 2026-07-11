import assert from "node:assert/strict";
import test from "node:test";
import { validateApkInspection } from "./assert-release-apk.mjs";

const expected = {
  apiOrigin: "https://api-staging.example",
  packageName: "zw.co.bisell.autoiq.mobile",
  versionName: "1.0.2",
};

const validInspection = {
  appBinary: Buffer.from("https://api-staging.example"),
  manifest: [
    'android:scheme="autoiq"',
    'android:host="reset-password"',
    "flutter_deeplinking_enabled",
  ].join("\n"),
  summary: "zw.co.bisell.autoiq.mobile\t3\t1.0.2",
};

test("accepts the expected release APK inspection", () => {
  assert.doesNotThrow(() => validateApkInspection(validInspection, expected));
});

test("rejects a stale APK version", () => {
  assert.throws(
    () =>
      validateApkInspection(
        {...validInspection, summary: "zw.co.bisell.autoiq.mobile\t1\t1.0.0"},
        expected,
      ),
    /Expected version 1\.0\.2, received 1\.0\.0/,
  );
});

test("rejects an APK without the native reset intent", () => {
  assert.throws(
    () => validateApkInspection({...validInspection, manifest: ""}, expected),
    /Missing manifest entry/,
  );
});

test("rejects an APK built for a different API", () => {
  assert.throws(
    () =>
      validateApkInspection(
        {...validInspection, appBinary: Buffer.from("https://api.other")},
        expected,
      ),
    /Missing API origin/,
  );
});
