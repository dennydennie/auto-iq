import 'dart:typed_data';

import 'package:autoiq_mobile/src/core/network/api_client.dart';
import 'package:autoiq_mobile/src/models/app_user.dart';
import 'package:autoiq_mobile/src/models/listing_filters.dart';
import 'package:autoiq_mobile/src/models/reference_data.dart';
import 'package:autoiq_mobile/src/repositories/buyer_repository.dart';
import 'package:autoiq_mobile/src/screens/buyer/buyer_home_screen.dart';
import 'package:autoiq_mobile/src/state/session_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

void main() {
  testWidgets('mobile filters use four focused steps and apply all values',
      (tester) async {
    await _setMobileViewport(tester);
    final controller = TextEditingController();
    var applied = const ListingFilterState();

    await tester.pumpWidget(
      _filterHarness(
        controller: controller,
        filters: () => applied,
        onApply: (setState, value) => setState(() => applied = value),
        onClear: (setState) => setState(
          () => applied = const ListingFilterState(),
        ),
      ),
    );

    expect(find.byKey(const Key('browse-filter-make')), findsNothing);
    expect(find.byKey(const Key('browse-open-filters')), findsOneWidget);
    expect(find.byKey(const Key('browse-clear-filters')), findsNothing);

    await _openFilters(tester);
    expect(find.text('Step 1 of 4'), findsOneWidget);
    expect(_dropdown<String?>(tester, 'browse-filter-model').onChanged, isNull);
    await _select(tester, 'browse-filter-make', 'Toyota');
    expect(
      _dropdown<String?>(tester, 'browse-filter-model').onChanged,
      isNotNull,
    );
    await _select(tester, 'browse-filter-model', 'Hilux');
    await _select(tester, 'browse-filter-body-type', 'SUV');

    await _nextStep(tester);
    expect(find.text('Set budget and year'), findsOneWidget);
    await _select(tester, 'browse-filter-price-min', 'USD 10,000');
    await _select(tester, 'browse-filter-price-max', 'USD 25,000');
    await _select(tester, 'browse-filter-year-min', '2019');
    await _select(tester, 'browse-filter-year-max', '2021');

    await _nextStep(tester);
    expect(find.text('Refine usage and specs'), findsOneWidget);
    await _select(tester, 'browse-filter-mileage-min', '40,000 km');
    await _select(tester, 'browse-filter-mileage-max', '150,000 km');
    await _select(tester, 'browse-filter-transmission', 'Automatic');
    await _select(tester, 'browse-filter-fuel-type', 'Diesel');

    await _nextStep(tester);
    expect(find.text('Choose location and trust'), findsOneWidget);
    await _select(tester, 'browse-filter-location', 'Harare');
    await tester.tap(find.byKey(const Key('browse-filter-verified')));
    await tester.tap(find.byKey(const Key('filter-wizard-apply')));
    await tester.pumpAndSettle();

    expect(
      applied,
      const ListingFilterState(
        make: 'Toyota',
        model: 'Hilux',
        yearMin: 2019,
        yearMax: 2021,
        city: 'Harare',
        bodyType: 'SUV',
        priceMin: 10000,
        priceMax: 25000,
        mileageMin: 40000,
        mileageMax: 150000,
        transmission: 'AUTOMATIC',
        fuelType: 'DIESEL',
        verifiedOnly: true,
      ),
    );
    expect(find.text('10 filters applied'), findsOneWidget);
    expect(find.byKey(const Key('browse-clear-filters')), findsOneWidget);

    final mileageChip = tester.widget<InputChip>(
      find.byKey(const Key('browse-applied-mileage')),
    );
    mileageChip.onDeleted!();
    await tester.pump();
    expect(applied.mileageMin, isNull);
    expect(applied.mileageMax, isNull);

    await tester.tap(find.byKey(const Key('browse-clear-filters')));
    await tester.pump();
    expect(applied, const ListingFilterState());
    expect(find.byKey(const Key('browse-clear-filters')), findsNothing);
    controller.dispose();
  });

  testWidgets('filters can be applied from any step and close discards edits',
      (tester) async {
    await _setMobileViewport(tester);
    final controller = TextEditingController();
    var applied = const ListingFilterState();

    await tester.pumpWidget(
      _filterHarness(
        controller: controller,
        filters: () => applied,
        onApply: (setState, value) => setState(() => applied = value),
        onClear: (_) {},
      ),
    );

    await _openFilters(tester);
    await _select(tester, 'browse-filter-make', 'Toyota');
    await tester.tap(find.byKey(const Key('filter-wizard-apply')));
    await tester.pumpAndSettle();
    expect(applied.make, 'Toyota');

    await _openFilters(tester);
    await _select(tester, 'browse-filter-make', 'Honda');
    await tester.tap(find.byKey(const Key('filter-wizard-close')));
    await tester.pumpAndSettle();
    expect(applied.make, 'Toyota');
    controller.dispose();
  });

  testWidgets('year step contains every year from 2026 to 1990',
      (tester) async {
    await _setMobileViewport(tester);
    final controller = TextEditingController();
    await tester.pumpWidget(
      _filterHarness(
        controller: controller,
        filters: () => const ListingFilterState(),
        onApply: (_, __) {},
        onClear: (_) {},
      ),
    );

    await _openFilters(tester);
    await _nextStep(tester);
    final dropdown = _dynamicDropdownButton(tester, 'browse-filter-year-min');
    final values = dropdown.items!.skip(1).map((item) => item.value).toList();
    expect(values, catalogueYearOptions);
    expect(values.first, 2026);
    expect(values.last, 1990);
    controller.dispose();
  });

  testWidgets('search clear action submits the empty search immediately',
      (tester) async {
    final controller = TextEditingController(text: 'Toyota');
    var searches = 0;
    await tester.pumpWidget(
      _filterHarness(
        controller: controller,
        filters: () => const ListingFilterState(),
        onApply: (_, __) {},
        onClear: (_) {},
        onSearch: () => searches++,
      ),
    );

    await tester.tap(find.byKey(const Key('browse-clear-search')));
    await tester.pump();
    expect(controller.text, isEmpty);
    expect(searches, 1);
    controller.dispose();
  });

  testWidgets('public facets populate the stepwise make and model controls',
      (tester) async {
    await _setMobileViewport(tester);
    final apiClient = _BuyerApiClient();
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider<SessionController>.value(
            value: _BuyerSession(),
          ),
          Provider<BuyerRepository>.value(value: BuyerRepository(apiClient)),
        ],
        child: const MaterialApp(home: BuyerHomeScreen()),
      ),
    );
    await tester.pumpAndSettle();

    await _openFilters(tester);
    final makeDropdown = _dynamicDropdownButton(tester, 'browse-filter-make');
    expect(makeDropdown.items!.map(_itemText), contains('Toyota'));
    makeDropdown.onChanged!('Toyota');
    await tester.pumpAndSettle();

    final modelDropdown = _dynamicDropdownButton(tester, 'browse-filter-model');
    expect(modelDropdown.onChanged, isNotNull);
    expect(modelDropdown.items!.map(_itemText), contains('Hilux'));
  });
}

Widget _filterHarness({
  required TextEditingController controller,
  required ListingFilterState Function() filters,
  required void Function(StateSetter, ListingFilterState) onApply,
  required void Function(StateSetter) onClear,
  VoidCallback? onSearch,
}) {
  return MaterialApp(
    home: Scaffold(
      body: StatefulBuilder(
        builder: (context, setState) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            BrowseFilters(
              searchController: controller,
              filters: filters(),
              makes: _makes,
              cities: const ['Harare', 'Bulawayo'],
              bodyTypes: _bodyTypes,
              transmissionTypes: _transmissionTypes,
              fuelTypes: _fuelTypes,
              onApplyFilters: (value) => onApply(setState, value),
              onSearch: onSearch ?? () {},
              onClearFilters: () => onClear(setState),
            ),
          ],
        ),
      ),
    ),
  );
}

final _makes = [
  VehicleMake(id: 'toyota', name: 'Toyota', popularModels: ['Hilux']),
  VehicleMake(id: 'honda', name: 'Honda', popularModels: ['Civic']),
];

const _bodyTypes = [ReferenceOption(value: 'SUV', label: 'SUV')];
const _transmissionTypes = [
  ReferenceOption(value: 'AUTOMATIC', label: 'Automatic'),
];
const _fuelTypes = [ReferenceOption(value: 'DIESEL', label: 'Diesel')];

Future<void> _setMobileViewport(WidgetTester tester) async {
  await tester.binding.setSurfaceSize(const Size(390, 844));
  addTearDown(() => tester.binding.setSurfaceSize(null));
}

Future<void> _openFilters(WidgetTester tester) async {
  await tester.tap(find.byKey(const Key('browse-open-filters')));
  await tester.pumpAndSettle();
}

Future<void> _nextStep(WidgetTester tester) async {
  await tester.tap(find.byKey(const Key('filter-wizard-next')));
  await tester.pumpAndSettle();
}

Future<void> _select(
  WidgetTester tester,
  String key,
  String nextLabel,
) async {
  final dropdown = _dynamicDropdownButton(tester, key);
  final item = dropdown.items!.singleWhere(
    (candidate) => _itemText(candidate) == nextLabel,
  );
  dropdown.onChanged!(item.value);
  await tester.pumpAndSettle();
}

String _itemText(DropdownMenuItem<dynamic> item) {
  final child = item.child;
  return child is Text ? child.data ?? '' : '';
}

DropdownButton<dynamic> _dynamicDropdownButton(
  WidgetTester tester,
  String key,
) {
  return tester.widget<DropdownButton<dynamic>>(
    find.descendant(
      of: find.byKey(Key(key)),
      matching: find.byWidgetPredicate((widget) => widget is DropdownButton),
    ),
  );
}

DropdownButtonFormField<T> _dropdown<T>(WidgetTester tester, String key) {
  return tester.widget<DropdownButtonFormField<T>>(
    find.descendant(
      of: find.byKey(Key(key)),
      matching: find.byType(DropdownButtonFormField<T>),
    ),
  );
}

class _BuyerApiClient extends Fake implements ApiClient {
  @override
  Future<T> getJson<T>(
    String path,
    T Function(dynamic json) parser, {
    Map<String, dynamic>? queryParameters,
  }) async {
    return parser(_responseFor(path));
  }

  dynamic _responseFor(String path) {
    if (path == '/api/v1/listings/facets/makes') {
      return [
        {'make': 'Toyota', 'count': 1},
      ];
    }
    if (path == '/api/v1/listings/facets/models') {
      return [
        {'make': 'Toyota', 'model': 'Hilux', 'count': 1},
      ];
    }
    if (path == '/api/v1/listings') {
      return {
        'data': <dynamic>[],
        'meta': {'nextCursor': null, 'hasMore': false},
      };
    }
    return {'data': <dynamic>[]};
  }

  @override
  Future<void> uploadBinary({
    required String url,
    required Uint8List bytes,
    required String contentType,
  }) async {}
}

class _BuyerSession extends ChangeNotifier implements SessionController {
  @override
  String? get errorMessage => null;

  @override
  bool get isAuthenticated => true;

  @override
  bool get isBooting => false;

  @override
  bool get isBusy => false;

  @override
  ReferenceDataSet? get referenceData => null;

  @override
  AppUser get user => AppUser(
        id: 'buyer-1',
        fullName: 'Test Buyer',
        email: 'buyer@example.com',
        phone: '+263771234567',
        status: 'ACTIVE',
        roles: const ['BUYER'],
        phoneVerified: true,
        emailVerified: true,
        city: 'Harare',
        buyerProfile: null,
        sellerProfile: null,
      );

  @override
  Future<void> bootstrap() async {}

  @override
  void clearError() {}

  @override
  Future<void> completeRequiredConsents() async {}

  @override
  Future<void> login({
    required String identifier,
    required String password,
  }) async {}

  @override
  Future<void> logout() async {}

  @override
  Future<void> refreshProfile() async {}

  @override
  Future<void> requestAccountDeletion() async {}

  @override
  Future<void> updateProfile(Map<String, dynamic> payload) async {}
}
