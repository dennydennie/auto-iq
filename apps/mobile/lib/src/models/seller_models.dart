import 'json_utils.dart';
import 'listing_models.dart';

class SellerListingSummary {
  SellerListingSummary({
    required this.id,
    required this.slug,
    required this.status,
    required this.year,
    required this.make,
    required this.model,
    required this.bodyType,
    required this.askPriceUsd,
    required this.coverImageUrl,
    required this.viewCount,
    required this.viewingCount,
    required this.quoteCount,
    required this.changesNote,
    required this.updatedAt,
  });

  final String id;
  final String slug;
  final String status;
  final int year;
  final String make;
  final String model;
  final String bodyType;
  final double askPriceUsd;
  final String? coverImageUrl;
  final int viewCount;
  final int viewingCount;
  final int quoteCount;
  final String? changesNote;
  final String updatedAt;

  String get title => '$year $make $model';

  factory SellerListingSummary.fromJson(Map<String, dynamic> json) {
    return SellerListingSummary(
      id: asString(json, 'id'),
      slug: asString(json, 'slug'),
      status: asString(json, 'status'),
      year: asInt(json, 'year'),
      make: asString(json, 'make'),
      model: asString(json, 'model'),
      bodyType: asString(json, 'bodyType'),
      askPriceUsd: asDouble(json, 'askPriceUsd'),
      coverImageUrl: asNullableString(json, 'coverImageUrl'),
      viewCount: asInt(json, 'viewCount'),
      viewingCount: asInt(json, 'viewingCount'),
      quoteCount: asInt(json, 'quoteCount'),
      changesNote: asNullableString(json, 'changesNote'),
      updatedAt: asString(json, 'updatedAt'),
    );
  }
}

class SellerDocument {
  SellerDocument({
    required this.id,
    required this.documentType,
    required this.reviewStatus,
  });

  final String id;
  final String documentType;
  final String reviewStatus;

  factory SellerDocument.fromJson(Map<String, dynamic> json) {
    return SellerDocument(
      id: asString(json, 'id'),
      documentType: asString(json, 'documentType'),
      reviewStatus: asString(json, 'reviewStatus'),
    );
  }
}

class ListingSpecs {
  ListingSpecs({
    required this.make,
    required this.model,
    required this.year,
    required this.bodyType,
    required this.colour,
    required this.fuelType,
    required this.transmission,
    required this.driveType,
    required this.engineCapacity,
    required this.mileageKm,
    required this.condition,
    required this.hasAccidentHistory,
    required this.accidentNote,
  });

  final String make;
  final String model;
  final int year;
  final String bodyType;
  final String colour;
  final String fuelType;
  final String transmission;
  final String driveType;
  final String? engineCapacity;
  final int mileageKm;
  final String condition;
  final bool hasAccidentHistory;
  final String? accidentNote;

  factory ListingSpecs.fromJson(Map<String, dynamic> json) {
    return ListingSpecs(
      make: asString(json, 'make'),
      model: asString(json, 'model'),
      year: asInt(json, 'year'),
      bodyType: asString(json, 'bodyType'),
      colour: asString(json, 'colour'),
      fuelType: asString(json, 'fuelType'),
      transmission: asString(json, 'transmission'),
      driveType: asString(json, 'driveType'),
      engineCapacity: asNullableString(json, 'engineCapacity'),
      mileageKm: asInt(json, 'mileageKm'),
      condition: asString(json, 'condition'),
      hasAccidentHistory: asBool(json, 'hasAccidentHistory'),
      accidentNote: asNullableString(json, 'accidentNote'),
    );
  }
}

class SellerPricing {
  SellerPricing({
    required this.askPriceUsd,
    required this.negotiable,
  });

  final double askPriceUsd;
  final bool negotiable;

  factory SellerPricing.fromJson(Map<String, dynamic> json) {
    return SellerPricing(
      askPriceUsd: asDouble(json, 'askPriceUsd'),
      negotiable: asBool(json, 'negotiable'),
    );
  }
}

class SellerListingDetail {
  SellerListingDetail({
    required this.id,
    required this.status,
    required this.slug,
    required this.sellerDisclosure,
    required this.viewCount,
    required this.viewingCount,
    required this.quoteCount,
    required this.changesNote,
    required this.specs,
    required this.pricing,
    required this.images,
    required this.documents,
  });

  final String id;
  final String status;
  final String slug;
  final String? sellerDisclosure;
  final int viewCount;
  final int viewingCount;
  final int quoteCount;
  final String? changesNote;
  final ListingSpecs specs;
  final SellerPricing pricing;
  final List<VehicleImage> images;
  final List<SellerDocument> documents;

  bool get isEditable => status == 'DRAFT' || status == 'CHANGES_REQUESTED';

  String get title => '${specs.year} ${specs.make} ${specs.model}';

  factory SellerListingDetail.fromJson(Map<String, dynamic> json) {
    return SellerListingDetail(
      id: asString(json, 'id'),
      status: asString(json, 'status'),
      slug: asString(json, 'slug'),
      sellerDisclosure: asNullableString(json, 'sellerDisclosure'),
      viewCount: asInt(json, 'viewCount'),
      viewingCount: asInt(json, 'viewingCount'),
      quoteCount: asInt(json, 'quoteCount'),
      changesNote: asNullableString(json, 'changesNote'),
      specs: ListingSpecs.fromJson(asMap(json['specs'])),
      pricing: SellerPricing.fromJson(asMap(json['pricing'])),
      images: asMapList(json['images'])
          .map(VehicleImage.fromJson)
          .toList(growable: false),
      documents: asMapList(json['documents'])
          .map(SellerDocument.fromJson)
          .toList(growable: false),
    );
  }
}

class SellerTimelineEntry {
  SellerTimelineEntry({
    required this.id,
    required this.status,
    required this.actorRole,
    required this.note,
    required this.occurredAt,
  });

  final String id;
  final String status;
  final String actorRole;
  final String? note;
  final String occurredAt;

  factory SellerTimelineEntry.fromJson(Map<String, dynamic> json) {
    return SellerTimelineEntry(
      id: asString(json, 'id'),
      status: asString(json, 'status'),
      actorRole: asString(json, 'actorRole'),
      note: asNullableString(json, 'note'),
      occurredAt: asString(json, 'occurredAt'),
    );
  }
}
