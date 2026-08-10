import 'package:autoiq_mobile/src/models/listing_filters.dart';
import 'package:autoiq_mobile/src/models/reference_data.dart';
import 'package:autoiq_mobile/src/screens/buyer/buyer_home_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('dependent dropdowns enable in order and Search applies filters',
      (tester) async {
    final controller = TextEditingController();
    var draft = const ListingFilterState();
    var applied = const ListingFilterState();
    var draftSearch = '';
    var appliedSearch = '';
    var searchCalls = 0;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: StatefulBuilder(
              builder: (context, setState) {
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
                  onSearchChanged: (value) => draftSearch = value,
                  onMakeChanged: (value) => setState(() {
                    draft = draft.copyWith(
                      make: value,
                      model: null,
                      year: null,
                    );
                  }),
                  onModelChanged: (value) => setState(() {
                    draft = draft.copyWith(model: value, year: null);
                  }),
                  onYearChanged: (value) => setState(
                    () => draft = draft.copyWith(year: value),
                  ),
                  onCityChanged: (value) => setState(
                    () => draft = draft.copyWith(city: value),
                  ),
                  onBodyTypeChanged: (value) => setState(
                    () => draft = draft.copyWith(bodyType: value),
                  ),
                  onToggleVerified: () => setState(
                    () => draft = draft.copyWith(
                      verifiedOnly: !draft.verifiedOnly,
                    ),
                  ),
                  onSearch: () => setState(() {
                    applied = draft;
                    appliedSearch = draftSearch;
                    searchCalls++;
                  }),
                  onClear: () => setState(() {
                    draft = const ListingFilterState();
                    applied = const ListingFilterState();
                    draftSearch = '';
                    appliedSearch = '';
                    controller.clear();
                  }),
                );
              },
            ),
          ),
        ),
      ),
    );

    expect(find.text('Make'), findsOneWidget);
    expect(find.text('Model'), findsOneWidget);
    expect(find.text('Year'), findsOneWidget);
    expect(find.text('Location'), findsOneWidget);
    expect(
      _dropdown<String?>(tester, 'browse-filter-model').onChanged,
      isNull,
    );
    expect(
      _dropdown<int?>(tester, 'browse-filter-year').onChanged,
      isNull,
    );

    await tester.tap(find.text('All makes'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Toyota').last);
    await tester.pumpAndSettle();
    expect(
      _dropdown<String?>(tester, 'browse-filter-model').onChanged,
      isNotNull,
    );

    await tester.tap(find.text('All models'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Hilux').last);
    await tester.pumpAndSettle();

    final currentYear = DateTime.now().year;
    await tester.tap(find.text('Any year'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('$currentYear').last);
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.byKey(const Key('browse-filter-location')));
    await tester.tap(find.text('All locations'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Harare').last);
    await tester.pumpAndSettle();

    await tester
        .ensureVisible(find.byKey(const Key('browse-filter-body-type')));
    await tester.tap(find.text('All body types'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('SUV').last);
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('browse-filter-verified')));
    await tester.enterText(find.byType(TextField), 'work truck');
    await tester.pump();

    expect(searchCalls, 0);
    await tester.ensureVisible(find.text('Search').last);
    await tester.tap(find.text('Search').last);
    await tester.pump();

    expect(searchCalls, 1);
    expect(
      applied,
      ListingFilterState(
        make: 'Toyota',
        model: 'Hilux',
        year: currentYear,
        city: 'Harare',
        bodyType: 'SUV',
        verifiedOnly: true,
      ),
    );
    expect(appliedSearch, 'work truck');

    await tester.ensureVisible(find.byKey(const Key('browse-filter-make')));
    await tester.tap(find.text('Toyota'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Honda').last);
    await tester.pumpAndSettle();

    expect(draft.make, 'Honda');
    expect(draft.model, isNull);
    expect(draft.year, isNull);
    expect(
      find.descendant(
        of: find.byKey(const Key('browse-filter-model')),
        matching: find.text('All models'),
      ),
      findsOneWidget,
    );
    expect(
      find.descendant(
        of: find.byKey(const Key('browse-filter-year')),
        matching: find.text('Any year'),
      ),
      findsOneWidget,
    );

    await tester.ensureVisible(find.text('Search').last);
    await tester.tap(find.text('Search').last);
    await tester.pump();

    expect(searchCalls, 2);
    expect(applied.make, 'Honda');
    expect(applied.model, isNull);
    expect(applied.year, isNull);

    await tester.tap(find.text('Clear').last);
    await tester.pumpAndSettle();
    expect(draft, const ListingFilterState());
    expect(applied, const ListingFilterState());
    expect(controller.text, isEmpty);
    expect(appliedSearch, isEmpty);
    expect(
      find.descendant(
        of: find.byKey(const Key('browse-filter-make')),
        matching: find.text('All makes'),
      ),
      findsOneWidget,
    );
    expect(
      find.descendant(
        of: find.byKey(const Key('browse-filter-location')),
        matching: find.text('All locations'),
      ),
      findsOneWidget,
    );
    expect(
      _dropdown<String?>(tester, 'browse-filter-model').onChanged,
      isNull,
    );
    expect(
      tester
          .widget<FilterChip>(
            find.byKey(const Key('browse-filter-verified')),
          )
          .selected,
      isFalse,
    );

    controller.dispose();
  });
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
