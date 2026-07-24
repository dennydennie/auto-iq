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
                  onSearchChanged: (_) {},
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

    expect(find.text('Make'), findsOneWidget);
    expect(find.text('Model'), findsOneWidget);
    expect(find.text('Year'), findsOneWidget);
    expect(find.text('Location'), findsOneWidget);

    await tester.tap(find.text('All makes'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Toyota').last);
    await tester.pumpAndSettle();

    await tester.tap(find.text('All models'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Hilux').last);
    await tester.pumpAndSettle();

    final currentYear = DateTime.now().year;
    await tester.tap(find.text('Any year'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('$currentYear').last);
    await tester.pumpAndSettle();

    await tester.tap(find.text('Toyota'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Honda').last);
    await tester.pumpAndSettle();

    expect(draft.make, 'Honda');
    expect(draft.model, isNull);
    expect(draft.year, isNull);

    await tester.tap(find.text('Search').last);
    await tester.pump();

    expect(searchCalls, 1);
    expect(applied.make, 'Honda');
    expect(applied.model, isNull);
    expect(applied.year, isNull);

    await tester.tap(find.text('Clear').last);
    await tester.pump();
    expect(draft, const ListingFilterState());
    expect(applied, const ListingFilterState());

    controller.dispose();
  });
}
