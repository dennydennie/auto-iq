import 'reference_data.dart';

const _unset = Object();

const cataloguePriceOptions = <int>[
  2000,
  3000,
  5000,
  6000,
  7000,
  8000,
  9000,
  10000,
  15000,
  20000,
  25000,
  30000,
  35000,
  40000,
  45000,
  50000,
  60000,
  70000,
  80000,
  90000,
  100000,
];

const catalogueMileageOptions = <int>[
  20000,
  40000,
  80000,
  100000,
  150000,
  200000,
  250000,
  300000,
];

final catalogueYearOptions = List<int>.unmodifiable(
  List<int>.generate(37, (index) => 2026 - index),
);

class ListingFilterState {
  const ListingFilterState({
    this.make,
    this.model,
    this.yearMin,
    this.yearMax,
    this.city,
    this.bodyType,
    this.priceMin,
    this.priceMax,
    this.mileageMin,
    this.mileageMax,
    this.transmission,
    this.fuelType,
    this.verifiedOnly = false,
  });

  final String? make;
  final String? model;
  final int? yearMin;
  final int? yearMax;
  final String? city;
  final String? bodyType;
  final int? priceMin;
  final int? priceMax;
  final int? mileageMin;
  final int? mileageMax;
  final String? transmission;
  final String? fuelType;
  final bool verifiedOnly;

  Map<String, dynamic> get catalogueQuery {
    return {
      if (make != null) 'make': [make],
      if (model != null) 'model': model,
      if (yearMin != null) 'yearMin': yearMin,
      if (yearMax != null) 'yearMax': yearMax,
      if (city != null) 'city': city,
      if (bodyType != null) 'bodyType': bodyType,
      if (priceMin != null) 'priceMin': priceMin,
      if (priceMax != null) 'priceMax': priceMax,
      if (mileageMin != null) 'mileageMin': mileageMin,
      if (mileageMax != null) 'mileageMax': mileageMax,
      if (transmission != null) 'transmission': transmission,
      if (fuelType != null) 'fuelType': fuelType,
      if (verifiedOnly) 'bisellVerified': true,
    };
  }

  ListingFilterState copyWith({
    Object? make = _unset,
    Object? model = _unset,
    Object? yearMin = _unset,
    Object? yearMax = _unset,
    Object? city = _unset,
    Object? bodyType = _unset,
    Object? priceMin = _unset,
    Object? priceMax = _unset,
    Object? mileageMin = _unset,
    Object? mileageMax = _unset,
    Object? transmission = _unset,
    Object? fuelType = _unset,
    Object? verifiedOnly = _unset,
  }) {
    return ListingFilterState(
      make: identical(make, _unset) ? this.make : make as String?,
      model: identical(model, _unset) ? this.model : model as String?,
      yearMin: identical(yearMin, _unset) ? this.yearMin : yearMin as int?,
      yearMax: identical(yearMax, _unset) ? this.yearMax : yearMax as int?,
      city: identical(city, _unset) ? this.city : city as String?,
      bodyType:
          identical(bodyType, _unset) ? this.bodyType : bodyType as String?,
      priceMin: identical(priceMin, _unset) ? this.priceMin : priceMin as int?,
      priceMax: identical(priceMax, _unset) ? this.priceMax : priceMax as int?,
      mileageMin:
          identical(mileageMin, _unset) ? this.mileageMin : mileageMin as int?,
      mileageMax:
          identical(mileageMax, _unset) ? this.mileageMax : mileageMax as int?,
      transmission: identical(transmission, _unset)
          ? this.transmission
          : transmission as String?,
      fuelType:
          identical(fuelType, _unset) ? this.fuelType : fuelType as String?,
      verifiedOnly: identical(verifiedOnly, _unset)
          ? this.verifiedOnly
          : verifiedOnly as bool,
    );
  }

  ListingFilterState clear() => const ListingFilterState();

  @override
  bool operator ==(Object other) {
    return other is ListingFilterState &&
        other.make == make &&
        other.model == model &&
        other.yearMin == yearMin &&
        other.yearMax == yearMax &&
        other.city == city &&
        other.bodyType == bodyType &&
        other.priceMin == priceMin &&
        other.priceMax == priceMax &&
        other.mileageMin == mileageMin &&
        other.mileageMax == mileageMax &&
        other.transmission == transmission &&
        other.fuelType == fuelType &&
        other.verifiedOnly == verifiedOnly;
  }

  @override
  int get hashCode => Object.hash(
        make,
        model,
        yearMin,
        yearMax,
        city,
        bodyType,
        priceMin,
        priceMax,
        mileageMin,
        mileageMax,
        transmission,
        fuelType,
        verifiedOnly,
      );
}

List<String> uniqueCities(List<ViewingLocation> locations) {
  final cities = <String, String>{};
  for (final location in locations) {
    final city = location.city.trim();
    if (city.isNotEmpty) {
      cities.putIfAbsent(city.toLowerCase(), () => city);
    }
  }
  final values = cities.values.toList()..sort((a, b) => a.compareTo(b));
  return values;
}
