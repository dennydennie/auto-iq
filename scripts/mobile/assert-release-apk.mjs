import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const RESET_MANIFEST_ENTRIES = [
  'android:scheme="autoiq"',
  'android:host="reset-password"',
  "flutter_deeplinking_enabled",
];
const APP_BINARY_STRINGS = [
  "Forgot password?",
  "Recover your account",
  "Send reset code",
  "Enter reset code",
  "Reset code",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/reset-password",
];

function apkSummary(summary) {
  const [packageName, versionCode, versionName] = summary.trim().split("\t");
  return { packageName, versionCode, versionName };
}

function assertSummary(summary, expected) {
  const actual = apkSummary(summary);
  if (actual.packageName !== expected.packageName) {
    throw new Error(`Expected package ${expected.packageName}, received ${actual.packageName}`);
  }
  if (actual.versionName !== expected.versionName) {
    throw new Error(`Expected version ${expected.versionName}, received ${actual.versionName}`);
  }
}

function assertManifest(manifest) {
  for (const entry of RESET_MANIFEST_ENTRIES) {
    if (!manifest.includes(entry)) throw new Error(`Missing manifest entry: ${entry}`);
  }
}

function assertAppBinary(appBinary, expected) {
  if (!appBinary.includes(Buffer.from(expected.apiOrigin))) {
    throw new Error(`Missing API origin: ${expected.apiOrigin}`);
  }
  for (const value of APP_BINARY_STRINGS) {
    if (!appBinary.includes(Buffer.from(value))) {
      throw new Error(`Missing app binary string: ${value}`);
    }
  }
}

export function validateApkInspection(inspection, expected) {
  assertSummary(inspection.summary, expected);
  assertManifest(inspection.manifest);
  assertAppBinary(inspection.appBinary, expected);
}

function inspectApk(apkPath) {
  const options = { encoding: "utf8", maxBuffer: 100 * 1024 * 1024 };
  const summary = execFileSync("apkanalyzer", ["apk", "summary", apkPath], options);
  const manifest = execFileSync("apkanalyzer", ["manifest", "print", apkPath], options);
  const appBinary = execFileSync(
    "unzip",
    ["-p", apkPath, "lib/arm64-v8a/libapp.so"],
    { maxBuffer: 100 * 1024 * 1024 },
  );
  return { appBinary, manifest, summary };
}

function main() {
  const [apkPath, packageName, versionName, apiOrigin] = process.argv.slice(2);
  if (!apkPath || !packageName || !versionName || !apiOrigin) {
    throw new Error("Usage: assert-release-apk.mjs <apk> <package> <version> <api-origin>");
  }
  validateApkInspection(inspectApk(apkPath), {
    apiOrigin,
    packageName,
    versionName,
  });
  process.stdout.write(`Release APK verified: ${packageName} ${versionName}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`Release APK check failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
