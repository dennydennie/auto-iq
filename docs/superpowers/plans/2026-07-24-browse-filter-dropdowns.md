# Browse Filter Dropdowns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with review checkpoints.

**Goal:** Add dependent make/model/year and location dropdowns to the Flutter buyer Browse tab, applying all selected filters with one Search action.

**Architecture:** Keep draft filter selections in the Browse screen and copy them into applied query state only when Search is pressed. Use the existing reference-data response for makes, models, and locations; use the existing catalogue API filters for server-side matching. Add a small pure filter model/helper so serialization and dependent reset behavior can be tested without network or widget setup.

**Tech Stack:** Flutter/Dart, `flutter_test`, existing `BuyerRepository`, NestJS catalogue query API (no API code change expected).

## Global Constraints

- Follow the repository's 14 production pillars in `AGENTS.md`, especially input validation, predictable REST query construction, accessibility, and maintainable single-purpose code.
- Do not add a database migration or new endpoint; the catalogue endpoint already supports `make`, `model`, `yearMin`, `yearMax`, and `city`.
- Use explicit file staging only; never use `git add .`.
- Run focused Flutter tests, `dart format --set-exit-if-changed`, and `flutter analyze` before claiming completion.

---

### Task 1: Add a pure Browse filter value object and failing tests

**Files:**
- Create: `apps/mobile/lib/src/models/listing_filters.dart`
- Create: `apps/mobile/test/listing_filters_test.dart`

**Interfaces:**
- Produces `ListingFilterState` with nullable `make`, `model`, `year`, `city`, `bodyType`, and `verifiedOnly`, plus `copyWith`, `clear`, and `catalogueQuery` behavior.
- Produces `uniqueCities(List<ViewingLocation>)`, returning alphabetically sorted, deduplicated non-empty city names.

- [ ] **Step 1: Write the failing tests**

```dart
import 'package:autoiq_mobile/src/models/listing_filters.dart';
import 'package:autoiq_mobile/src/models/reference_data.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('serializes a selected year as an exact catalogue range', () {
    const filters = ListingFilterState(
      make: 'Toyota',
      model: 'Hilux',
      year: 2021,
      city: 'Harare',
      bodyType: 'BAKKIE',
      verifiedOnly: true,
    );

    expect(filters.catalogueQuery, {
      'make': ['Toyota'],
      'model': 'Hilux',
      'yearMin': 2021,
      'yearMax': 2021,
      'city': 'Harare',
      'bodyType': 'BAKKIE',
      'bisellVerified': true,
    });
  });

  test('clears all selections', () {
    const filters = ListingFilterState(make: 'Toyota', model: 'Hilux', year: 2021);

    expect(filters.clear(), const ListingFilterState());
  });

  test('deduplicates and sorts location cities', () {
    final locations = [
      ViewingLocation(id: '1', name: 'A', addressLine1: '1', addressLine2: null, city: 'Bulawayo'),
      ViewingLocation(id: '2', name: 'B', addressLine1: '2', addressLine2: null, city: 'Harare'),
      ViewingLocation(id: '3', name: 'C', addressLine1: '3', addressLine2: null, city: 'Harare'),
    ];

    expect(uniqueCities(locations), ['Bulawayo', 'Harare']);
  });
}
```

- [ ] **Step 2: Run the new tests and verify the intended failure**

Run: `cd apps/mobile && flutter test test/listing_filters_test.dart`

Expected: FAIL because `listing_filters.dart` and `ListingFilterState` do not exist yet.

- [ ] **Step 3: Implement the minimal pure model**

Implement `ListingFilterState` with `const` construction, equality, `copyWith`, `clear`, and a `catalogueQuery` map that omits null/false values. Include `uniqueCities` with trimmed non-empty values, case-insensitive deduplication, and alphabetical display sorting.

- [ ] **Step 4: Run the focused tests and verify they pass**

Run: `cd apps/mobile && flutter test test/listing_filters_test.dart`

Expected: PASS with all three tests passing.

- [ ] **Step 5: Commit the pure filter contract**

```bash
git add apps/mobile/lib/src/models/listing_filters.dart apps/mobile/test/listing_filters_test.dart
git commit -m "test: define browse filter query contract"
```

### Task 2: Extend the buyer repository query contract

**Files:**
- Modify: `apps/mobile/lib/src/repositories/buyer_repository.dart:10-31`
- Modify: `apps/mobile/test/listing_filters_test.dart`

**Interfaces:**
- `BuyerRepository.browse` accepts optional `make`, `model`, `yearMin`, `yearMax`, and `city` parameters in addition to existing body type and verification filters.
- The repository passes those values to `ApiClient.getJson` through its existing cleaned query parameter map.

- [ ] **Step 1: Add a failing repository-facing query expectation**

Add a test around the pure `ListingFilterState.catalogueQuery` contract proving the exact keys used by `BuyerRepository.browse`: `make` is a one-item list, `year` populates both bounds, and unset values are omitted. Keep this test network-free because `ApiClient` intentionally hides its Dio instance.

- [ ] **Step 2: Run the focused test to verify it fails for the missing repository fields**

Run: `cd apps/mobile && flutter test test/listing_filters_test.dart`

Expected: FAIL on the newly asserted filter/query shape before the repository is updated.

- [ ] **Step 3: Update `BuyerRepository.browse`**

Use the signature:

```dart
Future<CataloguePage> browse({
  String? make,
  String? model,
  int? yearMin,
  int? yearMax,
  String? bodyType,
  String? city,
  bool? verifiedOnly,
})
```

Add `make`, `model`, `yearMin`, and `yearMax` to the existing query map, preserving `null` omission through `ApiClient._clean`.

- [ ] **Step 4: Run the focused tests**

Run: `cd apps/mobile && flutter test test/listing_filters_test.dart`

Expected: PASS.

- [ ] **Step 5: Commit the repository contract**

```bash
git add apps/mobile/lib/src/repositories/buyer_repository.dart apps/mobile/test/listing_filters_test.dart
git commit -m "feat: pass browse dropdown filters to catalogue"
```

### Task 3: Add draft and applied filter state to BuyerHomeScreen

**Files:**
- Modify: `apps/mobile/lib/src/screens/buyer/buyer_home_screen.dart:25-85,385-399`
- Modify: `apps/mobile/lib/src/models/listing_filters.dart`
- Test: `apps/mobile/test/listing_filters_test.dart`

**Interfaces:**
- `BuyerHomeScreen` keeps `_draftFilters` for controls and `_appliedFilters` for the current request.
- `_loadBrowse` passes `_appliedFilters` to `BuyerRepository.browse`.
- `onSearch` copies draft to applied and starts one reload; `onClear` resets both and starts one unfiltered reload.

- [ ] **Step 1: Add failing state-transition tests**

Test `copyWith(make: ...)` followed by a make change reset represented by `copyWith(make: newMake, model: null, year: null)`, and test that `clear()` returns an unfiltered state. These tests define the reset contract before the screen wiring.

- [ ] **Step 2: Run the tests and verify the transition assertions fail**

Run: `cd apps/mobile && flutter test test/listing_filters_test.dart`

Expected: FAIL until the value object's dependent-reset helpers are implemented.

- [ ] **Step 3: Implement the minimal state wiring**

Import `listing_filters.dart`; replace separate `_selectedBodyType` and `_verifiedOnly` query state with `_draftFilters` and `_appliedFilters`. Pass `_appliedFilters` to `_loadBrowse`, pass draft values and option lists to `_BrowseTab`, and add callbacks for make, model, year, city, body type, verified, search, and clear. Make/model/year callbacks must clear dependent values as specified.

- [ ] **Step 4: Run tests and static analysis**

Run: `cd apps/mobile && flutter test test/listing_filters_test.dart && flutter analyze`

Expected: PASS with no analyzer errors.

- [ ] **Step 5: Commit the state contract and screen wiring**

```bash
git add apps/mobile/lib/src/models/listing_filters.dart apps/mobile/lib/src/screens/buyer/buyer_home_screen.dart apps/mobile/test/listing_filters_test.dart
git commit -m "feat: stage buyer browse filters before search"
```

### Task 4: Render dependent dropdowns, location options, and actions

**Files:**
- Modify: `apps/mobile/lib/src/screens/buyer/buyer_home_screen.dart:465-650`
- Modify: `apps/mobile/lib/src/models/reference_data.dart` only if a small display helper is needed; do not alter the API contract.
- Create or modify: `apps/mobile/test/buyer_home_screen_test.dart`

**Interfaces:**
- `_BrowseTab` receives `ListingFilterState draftFilters`, `List<VehicleMake> makes`, `List<String> cities`, `List<ReferenceOption> bodyTypes`, and the filter callbacks.
- Model options are derived from the selected make's `popularModels`; year options are `DateTime.now().year` down to `1990`.

- [ ] **Step 1: Write failing widget tests**

Build `_BrowseTab` with a completed `Future.value(ListingViewState(...))` and test:

```dart
expect(find.text('Make'), findsOneWidget);
expect(find.text('Model'), findsOneWidget);
expect(find.text('Year'), findsOneWidget);
expect(find.text('Location'), findsOneWidget);
expect(find.widgetWithText(ElevatedButton, 'Search'), findsOneWidget);
```

Then tap Make, choose Toyota, and assert Model becomes enabled; choose a model and assert Year becomes enabled. Assert the callback counters remain unchanged until Search is tapped.

- [ ] **Step 2: Run the widget test and verify it fails**

Run: `cd apps/mobile && flutter test test/buyer_home_screen_test.dart`

Expected: FAIL because the new dropdown controls and callbacks do not exist.

- [ ] **Step 3: Implement the filter controls**

Add labeled `DropdownButtonFormField` controls for Make, Model, Year, and Location. Use null “All …” entries for optional selections, disable Model without Make and Year without Model, and show Search/Clear buttons. Keep body type and Verified in the same filter section. Use callbacks to update draft state only; Search and Clear invoke the parent callbacks.

- [ ] **Step 4: Add widget coverage for dependent resets and actions**

Select Toyota → Hilux → 2021, change Make, and assert the parent receives `model: null` and `year: null`. Tap Clear and assert `const ListingFilterState()` is received. Tap Search and assert the applied callback receives the complete selected state.

- [ ] **Step 5: Run focused widget tests and format**

Run: `cd apps/mobile && dart format --set-exit-if-changed lib/src/models/listing_filters.dart lib/src/repositories/buyer_repository.dart lib/src/screens/buyer/buyer_home_screen.dart test/listing_filters_test.dart test/buyer_home_screen_test.dart && flutter test test/listing_filters_test.dart test/buyer_home_screen_test.dart`

Expected: PASS and no formatting changes required.

- [ ] **Step 6: Commit the Browse controls**

```bash
git add apps/mobile/lib/src/screens/buyer/buyer_home_screen.dart apps/mobile/test/buyer_home_screen_test.dart
git commit -m "feat: add dependent browse filter dropdowns"
```

### Task 5: Verify the complete mobile change and source-control state

**Files:**
- Inspect only: all files changed by Tasks 1–4.

- [ ] **Step 1: Run the complete mobile verification set**

Run:

```bash
cd apps/mobile
dart format --set-exit-if-changed lib test
flutter analyze
flutter test
```

Expected: all commands exit 0; the full Flutter test suite reports no failures.

- [ ] **Step 2: Inspect the diff for scope, accessibility, and query correctness**

Run: `git diff --check HEAD~4..HEAD` and `git diff --stat HEAD~4..HEAD`.

Confirm only the approved spec, plan, filter model, repository, Browse screen, and focused tests are included; no secrets, generated files, or unrelated branch work are staged.

- [ ] **Step 3: Check repository status**

Run: `git status --short --branch`.

Expected: clean working tree after the intentional commits, or only explicitly documented pre-existing/unrelated files remain uncommitted.

- [ ] **Step 4: Push the feature branch after verification**

Run: `git push -u origin <feature-branch>`.

Record the actual branch name, final commit hash, push result, verification commands, and any intentionally uncommitted files in the final response.
