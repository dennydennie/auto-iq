import 'package:autoiq_mobile/src/models/listing_filters.dart';
import 'package:autoiq_mobile/src/models/reference_data.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('serializes every catalogue filter as an API query', () {
    const filters = ListingFilterState(
      make: 'Toyota',
      model: 'Hilux',
      yearMin: 2019,
      yearMax: 2021,
      city: 'Harare',
      bodyType: 'BAKKIE',
      priceMin: 10000,
      priceMax: 25000,
      mileageMin: 40000,
      mileageMax: 150000,
      transmission: 'AUTOMATIC',
      fuelType: 'DIESEL',
      verifiedOnly: true,
    );

    expect(filters.catalogueQuery, {
      'make': ['Toyota'],
      'model': 'Hilux',
      'yearMin': 2019,
      'yearMax': 2021,
      'city': 'Harare',
      'bodyType': 'BAKKIE',
      'priceMin': 10000,
      'priceMax': 25000,
      'mileageMin': 40000,
      'mileageMax': 150000,
      'transmission': 'AUTOMATIC',
      'fuelType': 'DIESEL',
      'bisellVerified': true,
    });
  });

  test('clears all selections', () {
    const filters = ListingFilterState(
      make: 'Toyota',
      model: 'Hilux',
      yearMin: 2019,
      yearMax: 2021,
    );

    expect(filters.clear(), const ListingFilterState());
  });

  test('deduplicates and sorts location cities', () {
    final locations = [
      ViewingLocation(
        id: '1',
        name: 'A',
        addressLine1: '1',
        addressLine2: null,
        city: 'Bulawayo',
      ),
      ViewingLocation(
        id: '2',
        name: 'B',
        addressLine1: '2',
        addressLine2: null,
        city: 'Harare',
      ),
      ViewingLocation(
        id: '3',
        name: 'C',
        addressLine1: '3',
        addressLine2: null,
        city: 'harare',
      ),
    ];

    expect(uniqueCities(locations), ['Bulawayo', 'Harare']);
  });

  test('changing make clears only the dependent model', () {
    const filters = ListingFilterState(
      make: 'Toyota',
      model: 'Hilux',
      yearMin: 2019,
      yearMax: 2021,
    );

    expect(
      filters.copyWith(make: 'Honda', model: null),
      const ListingFilterState(
        make: 'Honda',
        yearMin: 2019,
        yearMax: 2021,
      ),
    );
  });

  test('publishes the exact requested dropdown values', () {
    expect(cataloguePriceOptions.first, 2000);
    expect(cataloguePriceOptions.last, 100000);
    expect(catalogueMileageOptions, [
      20000,
      40000,
      80000,
      100000,
      150000,
      200000,
      250000,
      300000,
    ]);
    expect(catalogueYearOptions, hasLength(37));
    expect(catalogueYearOptions.take(3), [2026, 2025, 2024]);
    expect(catalogueYearOptions.last, 1990);
  });
}
