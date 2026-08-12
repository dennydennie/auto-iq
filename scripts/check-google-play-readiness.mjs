import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const files = {
  appConfig: read("apps/mobile/lib/src/core/config/app_config.dart"),
  apiClient: read("apps/mobile/lib/src/core/network/api_client.dart"),
  adminDeletionPage: read(
    "apps/web/app/admin/account-deletions/page.tsx",
  ),
  adminDeletionProxy: read(
    "apps/web/app/api/admin/account-deletion-requests/[requestId]/route.ts",
  ),
  adminDeletionService: read(
    "apps/api/src/modules/admin-ops/admin-account-deletion.service.ts",
  ),
  deletionMigration: read(
    "apps/api/src/db/migrations/1761210000000-AddAccountDeletionProcessing.ts",
  ),
  gradle: read("apps/mobile/android/app/build.gradle.kts"),
  manifest: read("apps/mobile/android/app/src/main/AndroidManifest.xml"),
  mobileRoutes: read("apps/mobile/lib/src/core/config/api_routes.dart"),
  privacy: read("apps/web/app/privacy/page.tsx"),
  publicDeletion: read("apps/web/app/account-deletion/page.tsx"),
  routes: read("packages/contracts/src/routes.ts"),
  service: read("apps/api/src/modules/accounts/account-deletion.service.ts"),
  mobileReadme: read("apps/mobile/README.md"),
  webIndex: read("apps/mobile/web/index.html"),
};

assert.doesNotMatch(files.gradle, /signingConfigs\.getByName\("debug"\)/);
for (const variable of [
  "AUTO_IQ_ANDROID_KEYSTORE_PATH",
  "AUTO_IQ_ANDROID_KEYSTORE_PASSWORD",
  "AUTO_IQ_ANDROID_KEY_ALIAS",
  "AUTO_IQ_ANDROID_KEY_PASSWORD",
]) {
  assert.match(files.gradle, new RegExp(variable));
}
assert.match(files.manifest, /android:usesCleartextTraffic="false"/);
assert.match(files.manifest, /android:label="BiSell AutoIQ"/);
assert.match(
  files.appConfig,
  /AUTO_IQ_API_BASE_URL is required for release builds/,
);
assert.match(files.routes, /accountDeletionRequests/);
assert.match(files.mobileRoutes, /meAccountDeletionRequests/);
assert.match(files.service, /account\.deletion_requested/);
assert.match(files.privacy, /Privacy notice/);
assert.match(files.publicDeletion, /PublicAccountDeletionForm/);
assert.match(files.adminDeletionPage, /AdminAccountDeletionActions/);
assert.match(files.adminDeletionPage, /legacy decision/);
assert.match(files.adminDeletionProxy, /issueRemoteCsrfToken/);
assert.match(files.adminDeletionService, /dataHandlingConfirmed/);
assert.match(files.deletionMigration, /CHECK[\s\S]+NOT VALID/);
assert.match(files.apiClient, /if \(kIsWeb\) return CookieJar\(\)/);
assert.match(files.mobileReadme, /api-production-af6d\.up\.railway\.app/);
assert.match(files.webIndex, /BiSell AutoIQ/);
assertPng("apps/mobile/store-listing/graphics/play-icon-512.png", 512, 512);
assertPng(
  "apps/mobile/store-listing/graphics/feature-graphic-1024x500.png",
  1024,
  500,
);
for (const screenshot of [
  "01-sign-in.png",
  "02-browse-and-filter.png",
  "03-verified-vehicle-detail.png",
  "04-buyer-requests.png",
  "05-confirmed-viewing.png",
  "06-buyer-profile.png",
]) {
  assertPng(
    `apps/mobile/store-listing/screenshots/${screenshot}`,
    1080,
    1920,
  );
}

process.stdout.write("Google Play source readiness checks passed.\n");

function read(path) {
  return readFileSync(path, "utf8");
}

function assertPng(path, expectedWidth, expectedHeight) {
  const image = readFileSync(path);
  assert.equal(image.subarray(1, 4).toString(), "PNG", `${path} is not a PNG`);
  assert.equal(
    image.readUInt32BE(16),
    expectedWidth,
    `${path} has the wrong width`,
  );
  assert.equal(
    image.readUInt32BE(20),
    expectedHeight,
    `${path} has the wrong height`,
  );
}
