# Mobile Password Recovery Regression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore a fully native Android password-recovery journey and prevent releases from bypassing mobile tests or committed-source provenance.

**Architecture:** The API will select a server-owned reset destination from a validated `client` enum, never a caller-provided redirect URL. Mobile will request the `MOBILE` destination, receive `autoiq://reset-password#token=...` by email, route that URI into a native reset screen, and submit the existing reset-password API contract. CI and the release script will independently reject the process conditions that allowed this regression.

**Tech Stack:** NestJS, class-validator, Jest, Flutter/Dart, app_links, Flutter widget tests, GitHub Actions, Bash, Node.js test runner.

## Global Constraints

- Work only in `/Users/dennismarumahoko/Documents/GitHub/Auto IQ`; do not create a worktree or build from a temporary directory.
- Write each behavioral test first and observe the expected failure before implementation.
- Build the release artifact only after all source is committed and pushed from a clean tracked tree.
- Do not accept arbitrary password-reset redirect URLs from clients.
- Preserve the existing web password-reset journey as the default.

---

### Task 1: Enforce release provenance and mobile CI

**Files:**
- Create: `scripts/mobile/assert-committed-source.mjs`
- Create: `scripts/mobile/assert-committed-source.test.mjs`
- Modify: `scripts/mobile/build-release-live.sh`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: `findSourceViolations(statusEntries)` and a CLI that exits non-zero for tracked changes or untracked mobile build inputs.
- Consumes: Git porcelain status from the real repository and protected paths `apps/mobile/`, `packages/contracts/`, and `scripts/mobile/`.

- [x] **Step 1: Write the failing provenance tests**

```js
test("rejects a modified tracked mobile file", () => {
  assert.deepEqual(findSourceViolations([" M apps/mobile/lib/main.dart"]), [
    " M apps/mobile/lib/main.dart",
  ]);
});

test("ignores unrelated untracked local documentation", () => {
  assert.deepEqual(findSourceViolations(["?? docs/local-notes.md"]), []);
});
```

- [x] **Step 2: Run `node --test scripts/mobile/assert-committed-source.test.mjs` and verify it fails because the module does not exist**

- [x] **Step 3: Implement the pure status classifier and CLI, then call it before and after dependency resolution in `build-release-live.sh`**

```bash
node "$ROOT_DIR/scripts/mobile/assert-committed-source.mjs"
flutter pub get
node "$ROOT_DIR/scripts/mobile/assert-committed-source.mjs"
```

- [x] **Step 4: Add a mobile CI job that runs provenance tests, `flutter analyze`, `flutter test`, and an Android debug build**

```yaml
- run: node --test scripts/mobile/assert-committed-source.test.mjs
- run: flutter analyze
- run: flutter test
- run: flutter build apk --debug --dart-define=AUTO_IQ_API_BASE_URL=https://api.example.invalid
```

- [x] **Step 5: Run the focused tests and YAML/static checks, commit, and push the guardrail change before starting Task 2**

### Task 2: Add a server-owned native reset destination

**Files:**
- Modify: `packages/contracts/src/identity.ts`
- Modify: `apps/api/src/modules/identity/dto/auth.dto.ts`
- Modify: `apps/api/src/modules/identity/auth.service.ts`
- Modify: `apps/api/src/modules/identity/auth.service.spec.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `ForgotPasswordRequest.client?: "WEB" | "MOBILE"`.
- Produces: web reset URL by default and `MOBILE_RESET_URL#token=...` only for `MOBILE`.

- [x] **Step 1: Add a failing AuthService test asserting `client: "MOBILE"` sends `autoiq://reset-password#token=...`**
- [x] **Step 2: Run the focused Jest test and verify it fails with the current web URL**
- [x] **Step 3: Add the enum validation and server-owned URL selection without accepting arbitrary redirects**
- [x] **Step 4: Run the focused Jest test and the complete API typecheck/test suite**

### Task 3: Implement native forgot/reset screens and deep-link routing

**Files:**
- Modify: `apps/mobile/pubspec.yaml`
- Modify: `apps/mobile/pubspec.lock`
- Modify: `apps/mobile/lib/src/core/config/api_routes.dart`
- Modify: `apps/mobile/lib/src/repositories/auth_repository.dart`
- Modify: `apps/mobile/lib/src/screens/auth/auth_screen.dart`
- Create: `apps/mobile/lib/src/screens/auth/forgot_password_screen.dart`
- Create: `apps/mobile/lib/src/screens/auth/reset_password_screen.dart`
- Create: `apps/mobile/lib/src/core/navigation/password_reset_link.dart`
- Modify: `apps/mobile/lib/src/app.dart`
- Modify: `apps/mobile/android/app/src/main/AndroidManifest.xml`
- Modify: `apps/mobile/test/auth_screen_test.dart`
- Create: `apps/mobile/test/password_reset_link_test.dart`
- Create: `apps/mobile/test/password_recovery_screen_test.dart`

**Interfaces:**
- Produces: `passwordResetToken(Uri uri) -> String?`, `AuthRepository.forgotPassword(email)`, and `AuthRepository.resetPassword(token, newPassword)`.
- Consumes: custom URI `autoiq://reset-password#token=<base64url>` and existing `/api/v1/auth/forgot-password` and `/api/v1/auth/reset-password` endpoints.

- [x] **Step 1: Write failing tests for native navigation, mobile request payload, URI parsing, and reset submission**
- [x] **Step 2: Run Flutter tests and verify each fails for the missing native behavior**
- [x] **Step 3: Add the repository methods and focused screens**
- [x] **Step 4: Add app_links cold-start/runtime routing plus the Android VIEW intent filter**
- [ ] **Step 5: Run formatter, analyzer, focused tests, full Flutter tests, and Android debug build**

### Task 4: Commit, push, and build only from committed source

**Files:**
- Modify: `apps/mobile/pubspec.yaml` only if a new release version is required.
- Generate (ignored): `apps/mobile/build/app/outputs/flutter-apk/app-release.apk` and provenance metadata.

**Interfaces:**
- Consumes: clean committed HEAD tracking `origin/feature/login-otp-account-channels`.
- Produces: APK SHA-256, Git commit SHA, branch name, API origin, and build timestamp.

- [ ] **Step 1: Review `git diff`, stage only task files, commit, and push**
- [ ] **Step 2: Verify the tracked tree is clean and HEAD matches its upstream**
- [ ] **Step 3: Run `scripts/mobile/build-release-live.sh <staging-api-origin>` from the real repository**
- [ ] **Step 4: Verify APK package/version/API origin and run the focused password-recovery regression checks**
- [ ] **Step 5: Confirm final branch cleanliness and report any preserved local-only files separately**
