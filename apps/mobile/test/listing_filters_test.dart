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
    const filters = ListingFilterState(
      make: 'Toyota',
      model: 'Hilux',
      year: 2021,
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

  test('changing make can clear dependent model and year', () {
    const filters = ListingFilterState(
      make: 'Toyota',
      model: 'Hilux',
      year: 2021,
    );

    expect(
      filters.copyWith(make: 'Honda', model: null, year: null),
      const ListingFilterState(make: 'Honda'),
    );
  });
}
