import 'package:autoiq_mobile/src/models/app_user.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('parses extended buyer preferences from the account response', () {
    final profile = BuyerProfile.fromJson({
      'city': 'Harare',
      'vehiclePurpose': 'FAMILY',
      'searchRadiusKm': 150,
      'deliveryPreference': 'EITHER',
      'paymentPreference': 'FINANCE',
      'preferredBodyTypes': ['SUV'],
      'preferredMakes': ['Toyota'],
      'preferredFuelTypes': ['DIESEL', 'HYBRID'],
      'preferredTransmissions': ['AUTOMATIC'],
      'minSeats': 7,
      'maxMileageKm': 90000,
      'yearMin': 2018,
      'yearMax': 2026,
      'budgetMin': 10000,
      'budgetMax': 30000,
    });

    expect(profile.vehiclePurpose, 'FAMILY');
    expect(profile.searchRadiusKm, 150);
    expect(profile.deliveryPreference, 'EITHER');
    expect(profile.paymentPreference, 'FINANCE');
    expect(profile.preferredFuelTypes, ['DIESEL', 'HYBRID']);
    expect(profile.preferredTransmissions, ['AUTOMATIC']);
    expect(profile.minSeats, 7);
    expect(profile.maxMileageKm, 90000);
    expect(profile.yearMin, 2018);
    expect(profile.yearMax, 2026);
  });

  test('keeps new buyer preferences optional for older responses', () {
    final profile = BuyerProfile.fromJson({
      'city': 'Bulawayo',
      'preferredBodyTypes': <String>[],
      'preferredMakes': <String>[],
      'budgetMin': null,
      'budgetMax': null,
    });

    expect(profile.vehiclePurpose, isNull);
    expect(profile.searchRadiusKm, isNull);
    expect(profile.preferredFuelTypes, isEmpty);
    expect(profile.preferredTransmissions, isEmpty);
    expect(profile.yearMin, isNull);
    expect(profile.yearMax, isNull);
  });
}
