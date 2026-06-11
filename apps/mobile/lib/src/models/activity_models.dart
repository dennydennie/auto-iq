import 'json_utils.dart';
import 'listing_models.dart';
import 'reference_data.dart';

class SavedVehicleItem {
  SavedVehicleItem({
    required this.id,
    required this.savedAt,
    required this.listing,
  });

  final String id;
  final String savedAt;
  final ListingCard listing;

  factory SavedVehicleItem.fromJson(Map<String, dynamic> json) {
    return SavedVehicleItem(
      id: asString(json, 'id'),
      savedAt: asString(json, 'savedAt'),
      listing: ListingCard.fromJson(asMap(json['listing'])),
    );
  }
}

class QuoteItem {
  QuoteItem({
    required this.id,
    required this.listingId,
    required this.offerPriceUsd,
    required this.askPriceUsd,
    required this.paymentPlan,
    required this.message,
    required this.status,
    required this.counterPriceUsd,
    required this.responseNote,
    required this.createdAt,
  });

  final String id;
  final String listingId;
  final double offerPriceUsd;
  final double askPriceUsd;
  final String paymentPlan;
  final String? message;
  final String status;
  final double? counterPriceUsd;
  final String? responseNote;
  final String createdAt;

  factory QuoteItem.fromJson(Map<String, dynamic> json) {
    return QuoteItem(
      id: asString(json, 'id'),
      listingId: asString(json, 'listingId'),
      offerPriceUsd: asDouble(json, 'offerPriceUsd'),
      askPriceUsd: asDouble(json, 'askPriceUsd'),
      paymentPlan: asString(json, 'paymentPlan'),
      message: asNullableString(json, 'message'),
      status: asString(json, 'status'),
      counterPriceUsd: json['counterPriceUsd'] == null
          ? null
          : asDouble(json, 'counterPriceUsd'),
      responseNote: asNullableString(json, 'responseNote'),
      createdAt: asString(json, 'createdAt'),
    );
  }
}

class VehicleRequestItem {
  VehicleRequestItem({
    required this.id,
    required this.maxBudgetCents,
    required this.makeName,
    required this.model,
    required this.yearMin,
    required this.yearMax,
    required this.maxOdometerKm,
    required this.urgency,
    required this.status,
    required this.notes,
    required this.adminNote,
    required this.createdAt,
  });

  final String id;
  final int maxBudgetCents;
  final String? makeName;
  final String? model;
  final int? yearMin;
  final int? yearMax;
  final int? maxOdometerKm;
  final String urgency;
  final String status;
  final String? notes;
  final String? adminNote;
  final String createdAt;

  factory VehicleRequestItem.fromJson(Map<String, dynamic> json) {
    return VehicleRequestItem(
      id: asString(json, 'id'),
      maxBudgetCents: asInt(json, 'maxBudgetCents'),
      makeName: asNullableString(json, 'makeName'),
      model: asNullableString(json, 'model'),
      yearMin: json['yearMin'] == null ? null : asInt(json, 'yearMin'),
      yearMax: json['yearMax'] == null ? null : asInt(json, 'yearMax'),
      maxOdometerKm:
          json['maxOdometerKm'] == null ? null : asInt(json, 'maxOdometerKm'),
      urgency: asString(json, 'urgency'),
      status: asString(json, 'status'),
      notes: asNullableString(json, 'notes'),
      adminNote: asNullableString(json, 'adminNote'),
      createdAt: asString(json, 'createdAt'),
    );
  }
}

class ViewingParticipant {
  ViewingParticipant({
    required this.name,
    required this.role,
    required this.confirmed,
  });

  final String name;
  final String role;
  final bool confirmed;

  factory ViewingParticipant.fromJson(Map<String, dynamic> json) {
    return ViewingParticipant(
      name: asString(json, 'name'),
      role: asString(json, 'role'),
      confirmed: asBool(json, 'confirmed'),
    );
  }
}

class ViewingItem {
  ViewingItem({
    required this.id,
    required this.listingId,
    required this.status,
    required this.preferredSlot,
    required this.confirmedSlot,
    required this.location,
    required this.note,
    required this.outcomeNote,
    required this.participants,
    required this.snapshotTitle,
  });

  final String id;
  final String listingId;
  final String status;
  final String preferredSlot;
  final String? confirmedSlot;
  final ViewingLocation? location;
  final String? note;
  final String? outcomeNote;
  final List<ViewingParticipant> participants;
  final String snapshotTitle;

  factory ViewingItem.fromJson(Map<String, dynamic> json) {
    final locationJson = json['location'];
    final snapshot = asMap(json['listingSnapshot']);
    return ViewingItem(
      id: asString(json, 'id'),
      listingId: asString(json, 'listingId'),
      status: asString(json, 'status'),
      preferredSlot: asString(json, 'preferredSlot'),
      confirmedSlot: asNullableString(json, 'confirmedSlot'),
      location: locationJson is Map<String, dynamic>
          ? ViewingLocation.fromJson(locationJson)
          : locationJson is Map
              ? ViewingLocation.fromJson(locationJson.cast<String, dynamic>())
              : null,
      note: asNullableString(json, 'note'),
      outcomeNote: asNullableString(json, 'outcomeNote'),
      participants: asMapList(json['participants'])
          .map(ViewingParticipant.fromJson)
          .toList(growable: false),
      snapshotTitle:
          '${asString(snapshot, 'year')} ${asString(snapshot, 'make')} ${asString(snapshot, 'model')}',
    );
  }
}
