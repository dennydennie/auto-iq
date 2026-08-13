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
  testWidgets('all mobile browse dropdowns apply the complete filter query',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final controller = TextEditingController();
    var draft = const ListingFilterState();
    var applied = const ListingFilterState();
    var searchCalls = 0;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: StatefulBuilder(
              builder: (context, setState) {
                int? validMax(int? minimum, int? maximum) {
                  return minimum != null && maximum != null && minimum > maximum
                      ? null
                      : maximum;
                }

                int? validMin(int? minimum, int? maximum) {
                  return minimum != null && maximum != null && minimum > maximum
                      ? null
                      : minimum;
                }

                return BrowseFilters(
                  searchController: controller,
                  filters: draft,
                  makes: [
                    VehicleMake(
                      id: 'toyota',
                      name: 'Toyota',
                      popularModels: ['Hilux'],
                    ),
                    VehicleMake(
                      id: 'honda',
                      name: 'Honda',
                      popularModels: ['Civic'],
                    ),
                  ],
                  cities: const ['Harare', 'Bulawayo'],
                  bodyTypes: const [
                    ReferenceOption(value: 'SUV', label: 'SUV'),
                  ],
                  transmissionTypes: const [
                    ReferenceOption(
                      value: 'AUTOMATIC',
                      label: 'Automatic',
                    ),
                  ],
                  fuelTypes: const [
                    ReferenceOption(value: 'DIESEL', label: 'Diesel'),
                  ],
                  onSearchChanged: (_) {},
                  onMakeChanged: (value) => setState(() {
                    draft = draft.copyWith(make: value, model: null);
                  }),
                  onModelChanged: (value) => setState(() {
                    draft = draft.copyWith(model: value);
                  }),
                  onYearMinChanged: (value) => setState(() {
                    draft = draft.copyWith(
                      yearMin: value,
                      yearMax: validMax(value, draft.yearMax),
                    );
                  }),
                  onYearMaxChanged: (value) => setState(() {
                    draft = draft.copyWith(
                      yearMin: validMin(draft.yearMin, value),
                      yearMax: value,
                    );
                  }),
                  onCityChanged: (value) => setState(() {
                    draft = draft.copyWith(city: value);
                  }),
                  onBodyTypeChanged: (value) => setState(() {
                    draft = draft.copyWith(bodyType: value);
                  }),
                  onPriceMinChanged: (value) => setState(() {
                    draft = draft.copyWith(
                      priceMin: value,
                      priceMax: validMax(value, draft.priceMax),
                    );
                  }),
                  onPriceMaxChanged: (value) => setState(() {
                    draft = draft.copyWith(
                      priceMin: validMin(draft.priceMin, value),
                      priceMax: value,
                    );
                  }),
                  onMileageMinChanged: (value) => setState(() {
                    draft = draft.copyWith(
                      mileageMin: value,
                      mileageMax: validMax(value, draft.mileageMax),
                    );
                  }),
                  onMileageMaxChanged: (value) => setState(() {
                    draft = draft.copyWith(
                      mileageMin: validMin(draft.mileageMin, value),
                      mileageMax: value,
                    );
                  }),
                  onTransmissionChanged: (value) => setState(() {
                    draft = draft.copyWith(transmission: value);
                  }),
                  onFuelTypeChanged: (value) => setState(() {
                    draft = draft.copyWith(fuelType: value);
                  }),
                  onToggleVerified: () => setState(() {
                    draft = draft.copyWith(
                      verifiedOnly: !draft.verifiedOnly,
                    );
                  }),
                  onSearch: () => setState(() {
                    applied = draft;
                    searchCalls++;
                  }),
                  onClear: () => setState(() {
                    draft = const ListingFilterState();
                    applied = const ListingFilterState();
                    controller.clear();
                  }),
                );
              },
            ),
          ),
        ),
      ),
    );

    expect(_dropdown<String?>(tester, 'browse-filter-model').onChanged, isNull);
    await _select(tester, 'browse-filter-make', 'All makes', 'Toyota');
    expect(
      _dropdown<String?>(tester, 'browse-filter-model').onChanged,
      isNotNull,
    );
    await _select(tester, 'browse-filter-model', 'All models', 'Hilux');

    await _select(tester, 'browse-filter-price-min', 'Any min', 'USD 10,000');
    await _select(tester, 'browse-filter-price-max', 'Any max', 'USD 25,000');
    await _select(tester, 'browse-filter-year-min', 'Any year', '2019');
    await _select(tester, 'browse-filter-year-max', 'Any year', '2021');
    await _select(tester, 'browse-filter-mileage-min', 'Any min', '40,000 km');
    await _select(
      tester,
      'browse-filter-mileage-max',
      'Any max',
      '150,000 km',
    );
    await _select(
      tester,
      'browse-filter-transmission',
      'Any transmission',
      'Automatic',
    );
    await _select(
      tester,
      'browse-filter-fuel-type',
      'Any fuel type',
      'Diesel',
    );
    await _select(tester, 'browse-filter-location', 'All locations', 'Harare');
    await _select(tester, 'browse-filter-body-type', 'All body types', 'SUV');

    await tester.ensureVisible(find.byKey(const Key('browse-filter-verified')));
    await tester.tap(find.byKey(const Key('browse-filter-verified')));
    await tester.ensureVisible(find.text('Search').last);
    await tester.tap(find.text('Search').last);
    await tester.pump();

    expect(searchCalls, 1);
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

    await _select(tester, 'browse-filter-make', 'Toyota', 'Honda');
    expect(draft.make, 'Honda');
    expect(draft.model, isNull);
    expect(draft.yearMin, 2019);
    expect(draft.yearMax, 2021);

    await tester.ensureVisible(find.text('Clear').last);
    await tester.tap(find.text('Clear').last);
    await tester.pumpAndSettle();
    expect(draft, const ListingFilterState());
    expect(applied, const ListingFilterState());

    controller.dispose();
  });

  testWidgets('year controls contain every year from 2026 to 1990',
      (tester) async {
    final controller = TextEditingController();
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: BrowseFilters(
              searchController: controller,
              filters: const ListingFilterState(),
              makes: const [],
              cities: const [],
              bodyTypes: const [],
              transmissionTypes: const [],
              fuelTypes: const [],
              onSearchChanged: (_) {},
              onMakeChanged: (_) {},
              onModelChanged: (_) {},
              onYearMinChanged: (_) {},
              onYearMaxChanged: (_) {},
              onCityChanged: (_) {},
              onBodyTypeChanged: (_) {},
              onPriceMinChanged: (_) {},
              onPriceMaxChanged: (_) {},
              onMileageMinChanged: (_) {},
              onMileageMaxChanged: (_) {},
              onTransmissionChanged: (_) {},
              onFuelTypeChanged: (_) {},
              onToggleVerified: () {},
              onSearch: () {},
              onClear: () {},
            ),
          ),
        ),
      ),
    );

    final control = find.byKey(const Key('browse-filter-year-min'));
    final dropdown = tester.widget<DropdownButton<int?>>(
      find.descendant(
        of: control,
        matching: find.byType(DropdownButton<int?>),
      ),
    );
    final values = dropdown.items!.skip(1).map((item) => item.value).toList();
    expect(values, catalogueYearOptions);
    expect(values.first, 2026);
    expect(values.last, 1990);
    controller.dispose();
  });

  testWidgets('public facets populate make and model without reference data',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final apiClient = _BuyerApiClient();

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider<SessionController>.value(
            value: _BuyerSession(),
          ),
          Provider<BuyerRepository>.value(
            value: BuyerRepository(apiClient),
          ),
        ],
        child: const MaterialApp(home: BuyerHomeScreen()),
      ),
    );
    await tester.pumpAndSettle();

    final makeDropdown = _dynamicDropdownButton(tester, 'browse-filter-make');
    expect(makeDropdown.items!.map(_itemText), contains('Toyota'));
    makeDropdown.onChanged!('Toyota');
    await tester.pumpAndSettle();

    final modelDropdown = _dynamicDropdownButton(tester, 'browse-filter-model');
    expect(modelDropdown.onChanged, isNotNull);
    expect(modelDropdown.items!.map(_itemText), contains('Hilux'));
  });
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

Future<void> _select(
  WidgetTester tester,
  String key,
  String _,
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
      matching: find.byWidgetPredicate(
        (widget) => widget is DropdownButton,
      ),
    ),
  );
}

DropdownButtonFormField<T> _dropdown<T>(
  WidgetTester tester,
  String key,
) {
  return tester.widget<DropdownButtonFormField<T>>(
    find.descendant(
      of: find.byKey(Key(key)),
      matching: find.byType(DropdownButtonFormField<T>),
    ),
  );
}
