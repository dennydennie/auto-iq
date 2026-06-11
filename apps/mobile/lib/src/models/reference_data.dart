import 'json_utils.dart';

class ReferenceOption {
  const ReferenceOption({
    required this.value,
    required this.label,
  });

  final String value;
  final String label;

  factory ReferenceOption.fromJson(Map<String, dynamic> json) {
    return ReferenceOption(
      value: asString(json, 'value'),
      label: asString(json, 'label'),
    );
  }
}

class VehicleMake {
  VehicleMake({
    required this.id,
    required this.name,
    required this.popularModels,
  });

  final String id;
  final String name;
  final List<String> popularModels;

  factory VehicleMake.fromJson(Map<String, dynamic> json) {
    return VehicleMake(
      id: asString(json, 'id'),
      name: asString(json, 'name'),
      popularModels: asStringList(json, 'popularModels'),
    );
  }
}

class ViewingLocation {
  ViewingLocation({
    required this.id,
    required this.name,
    required this.addressLine1,
    required this.addressLine2,
    required this.city,
  });

  final String id;
  final String name;
  final String addressLine1;
  final String? addressLine2;
  final String city;

  String get displayLine => addressLine2 == null
      ? '$addressLine1, $city'
      : '$addressLine1, $addressLine2, $city';

  factory ViewingLocation.fromJson(Map<String, dynamic> json) {
    return ViewingLocation(
      id: asString(json, 'id'),
      name: asString(json, 'name'),
      addressLine1: asString(json, 'addressLine1'),
      addressLine2: asNullableString(json, 'addressLine2'),
      city: asString(json, 'city'),
    );
  }
}

class ReferenceDataSet {
  ReferenceDataSet({
    required this.makes,
    required this.bodyTypes,
    required this.fuelTypes,
    required this.transmissionTypes,
    required this.driveTypes,
    required this.viewingLocations,
  });

  final List<VehicleMake> makes;
  final List<ReferenceOption> bodyTypes;
  final List<ReferenceOption> fuelTypes;
  final List<ReferenceOption> transmissionTypes;
  final List<ReferenceOption> driveTypes;
  final List<ViewingLocation> viewingLocations;

  factory ReferenceDataSet.fromJson(Map<String, dynamic> json) {
    return ReferenceDataSet(
      makes: asMapList(json['makes'])
          .map(VehicleMake.fromJson)
          .toList(growable: false),
      bodyTypes: asMapList(json['bodyTypes'])
          .map(ReferenceOption.fromJson)
          .toList(growable: false),
      fuelTypes: asMapList(json['fuelTypes'])
          .map(ReferenceOption.fromJson)
          .toList(growable: false),
      transmissionTypes: asMapList(json['transmissionTypes'])
          .map(ReferenceOption.fromJson)
          .toList(growable: false),
      driveTypes: asMapList(json['driveTypes'])
          .map(ReferenceOption.fromJson)
          .toList(growable: false),
      viewingLocations: asMapList(json['viewingLocations'])
          .map(ViewingLocation.fromJson)
          .toList(growable: false),
    );
  }
}
