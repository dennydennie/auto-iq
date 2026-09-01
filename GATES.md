# Gates: mobile UI and UX polish

OWNS: apps/mobile/**, apps/api/src/modules/listings/**, apps/api/src/db/migrations/**, packages/contracts/src/**, scripts/**, docs/**, GATES.md

Scope: deliver every audited mobile-polish phase with production code, automated regression coverage, and a buildable Android artifact.

- [x] G1: shared UI foundations render accessible loading, error, empty, and adaptive content states
  CHECK: DEVELOPER_DIR=/Library/Developer/CommandLineTools flutter test test/ui_foundations_test.dart test/responsive_layout_test.dart
  EXPECT: All tests passed!
  CWD: apps/mobile
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/dennismarumahoko/Documents/GitHub/Auto IQ/source/apps/mobile; path=47a7866be3c8/22 entries; EXPECT=matched; output-sha256=4334deccd715903ed9a09256536e7fe268b8ddd0e103f2d5c0644d686ee59991; output-bytes=3802

- [x] G2: inspection, form, consent, and session safety regressions are prevented
  CHECK: DEVELOPER_DIR=/Library/Developer/CommandLineTools flutter test test/inspector_report_safety_test.dart test/mobile_form_validation_test.dart test/consent_flow_test.dart test/session_gate_test.dart
  EXPECT: All tests passed!
  CWD: apps/mobile
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/dennismarumahoko/Documents/GitHub/Auto IQ/source/apps/mobile; path=47a7866be3c8/22 entries; EXPECT=matched; output-sha256=df7b72ecdbddcdb5a314f894ba69338bc33bf89472c0cd362847ab4e7db1a37a; output-bytes=3963

- [x] G3: catalogue search and cursor pagination are enforced by the API contract and service tests
  CHECK: pnpm --filter api test --runInBand src/modules/listings/catalogue-query.service.spec.ts src/modules/listings/dto/catalogue.dto.spec.ts && pnpm --filter api typecheck && node -e "console.log('catalogue API verification passed')"
  EXPECT: catalogue API verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/dennismarumahoko/Documents/GitHub/Auto IQ/source; path=47a7866be3c8/22 entries; EXPECT=matched; output-sha256=0a34d41931c1acfcda7f3329c08f61011c0c987274dd13cf52af573b3ddb3868; output-bytes=626

- [x] G4: the buyer search, pagination, detail, and request journeys pass focused mobile tests
  CHECK: DEVELOPER_DIR=/Library/Developer/CommandLineTools flutter test test/buyer_repository_browse_test.dart test/buyer_catalogue_controller_test.dart test/buyer_home_screen_test.dart test/buyer_journey_test.dart
  EXPECT: All tests passed!
  CWD: apps/mobile
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/dennismarumahoko/Documents/GitHub/Auto IQ/source/apps/mobile; path=47a7866be3c8/22 entries; EXPECT=matched; output-sha256=0e059157ec173a0f8f433ebf39a3d5c246b34fd043b9db91a42d1bd5e6c8eb8d; output-bytes=5371

- [x] G5: the seller step flow, draft recovery, and bounded upload behaviors pass focused tests
  CHECK: DEVELOPER_DIR=/Library/Developer/CommandLineTools flutter test test/seller_listing_wizard_test.dart test/local_upload_test.dart
  EXPECT: All tests passed!
  CWD: apps/mobile
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/dennismarumahoko/Documents/GitHub/Auto IQ/source/apps/mobile; path=47a7866be3c8/22 entries; EXPECT=matched; output-sha256=91867efb62d1dd5231b79aab306c5583290e74aec41b65be565cb7d02099a8db; output-bytes=3807

- [x] G6: accessibility, localization, text scaling, and RTL regression tests pass
  CHECK: DEVELOPER_DIR=/Library/Developer/CommandLineTools flutter test test/accessibility_localization_test.dart test/internationalization_test.dart
  EXPECT: All tests passed!
  CWD: apps/mobile
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/dennismarumahoko/Documents/GitHub/Auto IQ/source/apps/mobile; path=47a7866be3c8/22 entries; EXPECT=matched; output-sha256=a7514a8416c9cb25742f514b578378fb4bf3125367a6990bb14477c145ee5f78; output-bytes=3961

- [x] G7: the complete Flutter analyzer and test suite pass together
  CHECK: DEVELOPER_DIR=/Library/Developer/CommandLineTools flutter analyze && DEVELOPER_DIR=/Library/Developer/CommandLineTools flutter test
  EXPECT: All tests passed!
  CWD: apps/mobile
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/dennismarumahoko/Documents/GitHub/Auto IQ/source/apps/mobile; path=47a7866be3c8/22 entries; EXPECT=matched; output-sha256=9544151a23c71c65ee6a843debec443904df1e6c8bdc2ef870ff7d1cab5e3741; output-bytes=20772

- [x] G8: repository-level mobile, localization, API, and workflow checks pass
  CHECK: pnpm check:internationalization && pnpm check:google-play-readiness && pnpm check:buyer-marketplace && pnpm check:seller-listing-workflow && pnpm check:inspection-workflow && pnpm --filter @auto-iq/contracts typecheck && pnpm --filter api lint && pnpm --filter api test --runInBand && pnpm --filter api build && node -e "console.log('repository integration verification passed')"
  EXPECT: repository integration verification passed
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/dennismarumahoko/Documents/GitHub/Auto IQ/source; path=47a7866be3c8/22 entries; EXPECT=matched; output-sha256=43632422b1cdd25b3b29a4062aad52d10f241a906a5e18efb9ecf595636b7501; output-bytes=1756

- [x] G9: a debug Android package is produced from the polished source
  CHECK: DEVELOPER_DIR=/Library/Developer/CommandLineTools flutter build apk --debug && node -e "const fs=require('fs');const p='build/app/outputs/flutter-apk/app-debug.apk';if(!fs.existsSync(p)||fs.statSync(p).size===0)process.exit(1);console.log('Android package verification passed')"
  EXPECT: Android package verification passed
  CWD: apps/mobile
  EVIDENCE: exit=0; shell=/bin/sh; cwd=/Users/dennismarumahoko/Documents/GitHub/Auto IQ/source/apps/mobile; path=47a7866be3c8/22 entries; EXPECT=matched; output-sha256=aabd0c47294a1e24a6caad3ebdfa2c464544596bd47f4533bec86abbb72720da; output-bytes=2621
