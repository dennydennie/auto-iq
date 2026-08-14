import 'json_utils.dart';

class BuyerProfile {
  BuyerProfile({
    required this.city,
    required this.vehiclePurpose,
    required this.searchRadiusKm,
    required this.deliveryPreference,
    required this.paymentPreference,
    required this.preferredBodyTypes,
    required this.preferredMakes,
    required this.preferredFuelTypes,
    required this.preferredTransmissions,
    required this.minSeats,
    required this.maxMileageKm,
    required this.yearMin,
    required this.yearMax,
    required this.budgetMin,
    required this.budgetMax,
  });

  final String city;
  final String? vehiclePurpose;
  final int? searchRadiusKm;
  final String? deliveryPreference;
  final String? paymentPreference;
  final List<String> preferredBodyTypes;
  final List<String> preferredMakes;
  final List<String> preferredFuelTypes;
  final List<String> preferredTransmissions;
  final int? minSeats;
  final int? maxMileageKm;
  final int? yearMin;
  final int? yearMax;
  final double? budgetMin;
  final double? budgetMax;

  factory BuyerProfile.fromJson(Map<String, dynamic> json) {
    return BuyerProfile(
      city: asString(json, 'city'),
      vehiclePurpose: asNullableString(json, 'vehiclePurpose'),
      searchRadiusKm: _integer(json['searchRadiusKm']),
      deliveryPreference: asNullableString(json, 'deliveryPreference'),
      paymentPreference: asNullableString(json, 'paymentPreference'),
      preferredBodyTypes: asStringList(json, 'preferredBodyTypes'),
      preferredMakes: asStringList(json, 'preferredMakes'),
      preferredFuelTypes: asStringList(json, 'preferredFuelTypes'),
      preferredTransmissions: asStringList(json, 'preferredTransmissions'),
      minSeats: _integer(json['minSeats']),
      maxMileageKm: _integer(json['maxMileageKm']),
      yearMin: _integer(json['yearMin']),
      yearMax: _integer(json['yearMax']),
      budgetMin: _money(json['budgetMin']),
      budgetMax: _money(json['budgetMax']),
    );
  }
}

class SellerProfile {
  SellerProfile({
    required this.city,
    required this.businessName,
    required this.consentsComplete,
    required this.verified,
  });

  final String city;
  final String? businessName;
  final bool consentsComplete;
  final bool verified;

  factory SellerProfile.fromJson(Map<String, dynamic> json) {
    return SellerProfile(
      city: asString(json, 'city'),
      businessName: asNullableString(json, 'businessName'),
      consentsComplete: asBool(json, 'consentsComplete'),
      verified: asBool(json, 'verified'),
    );
  }
}

class AppUser {
  AppUser({
    required this.id,
    required this.fullName,
    required this.email,
    required this.phone,
    required this.status,
    required this.roles,
    required this.phoneVerified,
    required this.emailVerified,
    required this.city,
    required this.buyerProfile,
    required this.sellerProfile,
  });

  final String id;
  final String fullName;
  final String email;
  final String phone;
  final String status;
  final List<String> roles;
  final bool phoneVerified;
  final bool emailVerified;
  final String city;
  final BuyerProfile? buyerProfile;
  final SellerProfile? sellerProfile;

  bool get isBuyer => roles.contains('BUYER');
  bool get isSeller => roles.contains('SELLER');
  bool get isInspector => roles.contains('INSPECTOR');

  List<String> get mobileRoles => const ['BUYER', 'SELLER', 'INSPECTOR']
      .where((role) => roles.contains(role))
      .toList(growable: false);

  /// True when the account has captured all consents required for its role.
  ///
  /// NOTE: buyer consent is currently short-circuited to `true` because the
  /// backend does not yet return a `consentsComplete` flag on `BuyerProfile`.
  /// When the backend adds it, propagate through `BuyerProfile.consentsComplete`
  /// and drop this fallback. Silently returning `true` here is fine for MVP
  /// where consent is captured at registration via the accepted-rules
  /// checkbox — but before shipping to app stores, wire this up properly.
  bool get consentsComplete {
    if (isSeller) {
      return sellerProfile?.consentsComplete ?? false;
    }
    return true;
  }

  factory AppUser.fromJson(Map<String, dynamic> json) {
    final buyerProfileJson = json['buyerProfile'];
    final sellerProfileJson = json['sellerProfile'];
    return AppUser(
      id: asString(json, 'id'),
      fullName: asString(json, 'fullName'),
      email: asString(json, 'email'),
      phone: asString(json, 'phone'),
      status: asString(json, 'status'),
      roles: asStringList(json, 'roles'),
      phoneVerified: asBool(json, 'phoneVerified'),
      emailVerified: asBool(json, 'emailVerified'),
      city: asNullableString(json, 'city') ??
          (sellerProfileJson is Map
              ? asString((sellerProfileJson).cast<String, dynamic>(), 'city')
              : buyerProfileJson is Map
                  ? asString((buyerProfileJson).cast<String, dynamic>(), 'city')
                  : ''),
      buyerProfile: buyerProfileJson is Map<String, dynamic>
          ? BuyerProfile.fromJson(buyerProfileJson)
          : buyerProfileJson is Map
              ? BuyerProfile.fromJson(buyerProfileJson.cast<String, dynamic>())
              : null,
      sellerProfile: sellerProfileJson is Map<String, dynamic>
          ? SellerProfile.fromJson(sellerProfileJson)
          : sellerProfileJson is Map
              ? SellerProfile.fromJson(
                  sellerProfileJson.cast<String, dynamic>())
              : null,
    );
  }
}

double? _money(dynamic value) {
  if (value == null) {
    return null;
  }
  if (value is num) {
    return value.toDouble();
  }
  return double.tryParse(value.toString());
}

int? _integer(dynamic value) {
  if (value == null) {
    return null;
  }
  if (value is num) {
    return value.toInt();
  }
  return int.tryParse(value.toString());
}
