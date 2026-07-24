import 'reference_data.dart';

const _unset = Object();

class ListingFilterState {
  const ListingFilterState({
    this.make,
    this.model,
    this.year,
    this.city,
    this.bodyType,
    this.verifiedOnly = false,
  });

  final String? make;
  final String? model;
  final int? year;
  final String? city;
  final String? bodyType;
  final bool verifiedOnly;

  Map<String, dynamic> get catalogueQuery {
    return {
      if (make != null) 'make': [make],
      if (model != null) 'model': model,
      if (year != null) 'yearMin': year,
      if (year != null) 'yearMax': year,
      if (city != null) 'city': city,
      if (bodyType != null) 'bodyType': bodyType,
      if (verifiedOnly) 'bisellVerified': true,
    };
  }

  ListingFilterState copyWith({
    Object? make = _unset,
    Object? model = _unset,
    Object? year = _unset,
    Object? city = _unset,
    Object? bodyType = _unset,
    Object? verifiedOnly = _unset,
  }) {
    return ListingFilterState(
      make: identical(make, _unset) ? this.make : make as String?,
      model: identical(model, _unset) ? this.model : model as String?,
      year: identical(year, _unset) ? this.year : year as int?,
      city: identical(city, _unset) ? this.city : city as String?,
      bodyType:
          identical(bodyType, _unset) ? this.bodyType : bodyType as String?,
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
        other.year == year &&
        other.city == city &&
        other.bodyType == bodyType &&
        other.verifiedOnly == verifiedOnly;
  }

  @override
  int get hashCode => Object.hash(
        make,
        model,
        year,
        city,
        bodyType,
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
