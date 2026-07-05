import 'json_utils.dart';

class BuyerProfile {
  BuyerProfile({
    required this.city,
    required this.preferredBodyTypes,
    required this.preferredMakes,
    required this.budgetMin,
    required this.budgetMax,
  });

  final String city;
  final List<String> preferredBodyTypes;
  final List<String> preferredMakes;
  final double? budgetMin;
  final double? budgetMax;

  factory BuyerProfile.fromJson(Map<String, dynamic> json) {
    return BuyerProfile(
      city: asString(json, 'city'),
      preferredBodyTypes: asStringList(json, 'preferredBodyTypes'),
      preferredMakes: asStringList(json, 'preferredMakes'),
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
      city: sellerProfileJson is Map
          ? asString((sellerProfileJson).cast<String, dynamic>(), 'city')
          : buyerProfileJson is Map
              ? asString((buyerProfileJson).cast<String, dynamic>(), 'city')
              : '',
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
