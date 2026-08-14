import 'package:autoiq_mobile/src/models/reference_data.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('one missing option list does not discard the remaining filters', () {
    final data = ReferenceDataSet.fromJson(_legacyProductionResponse());

    expect(data.makes.single.name, 'Honda');
    expect(data.makes.single.popularModels, ['Vezel', 'Fit']);
    expect(data.bodyTypes.single.value, 'SUV');
    expect(data.fuelTypes.single.value, 'HYBRID');
    expect(data.transmissionTypes.single.value, 'AUTOMATIC');
    expect(data.driveTypes.single.value, 'AWD');
    expect(data.viewingLocations.single.city, 'Harare');
    expect(data.conditionGrades, isEmpty);
  });
}

Map<String, dynamic> _legacyProductionResponse() {
  return {
    'makes': [
      {
        'id': 'honda',
        'name': 'Honda',
        'popularModels': ['Vezel', 'Fit'],
      },
    ],
    'bodyTypes': [
      {'value': 'SUV', 'label': 'SUV'},
    ],
    'fuelTypes': [
      {'value': 'HYBRID', 'label': 'Hybrid'},
    ],
    'transmissionTypes': [
      {'value': 'AUTOMATIC', 'label': 'Automatic'},
    ],
    'driveTypes': [
      {'value': 'AWD', 'label': 'AWD'},
    ],
    'viewingLocations': [
      {
        'id': 'harare-hub',
        'name': 'Harare Hub',
        'addressLine1': '1 Samora Machel Avenue',
        'addressLine2': null,
        'city': 'Harare',
      },
    ],
  };
}
