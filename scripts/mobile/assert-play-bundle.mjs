import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const REQUIRED_APP_STRINGS = [
  "/api/v1/me/account-deletion-requests",
  "Request deletion of your AutoIQ account",
];

export function validatePlayBundleInspection(inspection, expected) {
  assertManifest(inspection.manifest, expected);
  assertAppBinary(inspection.appBinary, expected.apiOrigin);
  assertArchitectures(inspection.entries);
  assertCertificate(inspection.certificate);
}

function assertManifest(manifest, expected) {
  const entries = [
    `package="${expected.packageName}"`,
    `android:versionName="${expected.versionName}"`,
    'android:targetSdkVersion="36"',
    'android:usesCleartextTraffic="false"',
    'android:label="BiSell AutoIQ"',
  ];
  for (const entry of entries) {
    if (!manifest.includes(entry))
      throw new Error(`Missing manifest entry: ${entry}`);
  }
}

function assertAppBinary(appBinary, apiOrigin) {
  const values = [apiOrigin, ...REQUIRED_APP_STRINGS];
  for (const value of values) {
    if (!appBinary.includes(Buffer.from(value))) {
      throw new Error(`Missing app binary string: ${value}`);
    }
  }
}

function assertArchitectures(entries) {
  if (!entries.includes("base/lib/arm64-v8a/libapp.so")) {
    throw new Error("The bundle does not include arm64-v8a support");
  }
}

function assertCertificate(certificate) {
  if (!certificate.includes("Owner:")) {
    throw new Error("The bundle does not contain a signing certificate");
  }
  if (certificate.includes("CN=Android Debug")) {
    throw new Error("The bundle is signed with the Android debug certificate");
  }
}

function inspectBundle(bundlePath, manifestPath) {
  const options = { encoding: "utf8", maxBuffer: 100 * 1024 * 1024 };
  return {
    appBinary: execFileSync(
      "unzip",
      ["-p", bundlePath, "base/lib/arm64-v8a/libapp.so"],
      { maxBuffer: 100 * 1024 * 1024 },
    ),
    certificate: execFileSync(
      "keytool",
      ["-printcert", "-jarfile", bundlePath],
      options,
    ),
    entries: execFileSync("unzip", ["-Z1", bundlePath], options),
    manifest: readFileSync(manifestPath, "utf8"),
  };
}

function main() {
  const [bundlePath, manifestPath, packageName, versionName, apiOrigin] =
    process.argv.slice(2);
  if (
    !bundlePath ||
    !manifestPath ||
    !packageName ||
    !versionName ||
    !apiOrigin
  ) {
    throw new Error(
      "Usage: assert-play-bundle.mjs <aab> <manifest> <package> <version> <api-origin>",
    );
  }
  validatePlayBundleInspection(inspectBundle(bundlePath, manifestPath), {
    apiOrigin,
    packageName,
    versionName,
  });
  process.stdout.write(`Play bundle verified: ${packageName} ${versionName}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`Play bundle check failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
