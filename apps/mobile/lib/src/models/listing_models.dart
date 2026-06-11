import 'json_utils.dart';

class VehicleImage {
  VehicleImage({
    required this.id,
    required this.url,
    required this.slot,
    required this.isCover,
  });

  final String id;
  final String url;
  final String slot;
  final bool isCover;

  factory VehicleImage.fromJson(Map<String, dynamic> json) {
    return VehicleImage(
      id: asString(json, 'id'),
      url: asString(json, 'url'),
      slot: asString(json, 'slot'),
      isCover: asBool(json, 'isCover'),
    );
  }
}

class InspectionFinding {
  InspectionFinding({
    required this.label,
    required this.rating,
    required this.note,
  });

  final String label;
  final String rating;
  final String? note;

  factory InspectionFinding.fromJson(Map<String, dynamic> json) {
    return InspectionFinding(
      label: asString(json, 'label'),
      rating: asString(json, 'rating'),
      note: asNullableString(json, 'note'),
    );
  }
}

class InspectionCategoryScore {
  InspectionCategoryScore({
    required this.category,
    required this.score,
    required this.worstRating,
  });

  final String category;
  final double score;
  final String worstRating;

  factory InspectionCategoryScore.fromJson(Map<String, dynamic> json) {
    return InspectionCategoryScore(
      category: asString(json, 'category'),
      score: asDouble(json, 'score'),
      worstRating: asString(json, 'worstRating'),
    );
  }
}

class InspectionSummary {
  InspectionSummary({
    required this.inspectionDate,
    required this.inspectorName,
    required this.overallScore,
    required this.roadworthy,
    required this.inspectorNote,
    required this.categories,
    required this.findings,
  });

  final String inspectionDate;
  final String inspectorName;
  final int overallScore;
  final bool roadworthy;
  final String? inspectorNote;
  final List<InspectionCategoryScore> categories;
  final List<InspectionFinding> findings;

  factory InspectionSummary.fromJson(Map<String, dynamic> json) {
    return InspectionSummary(
      inspectionDate: asString(json, 'inspectionDate'),
      inspectorName: asString(json, 'inspectorName'),
      overallScore: asInt(json, 'overallScore'),
      roadworthy: asBool(json, 'roadworthy'),
      inspectorNote: asNullableString(json, 'inspectorNote'),
      categories: asMapList(json['categories'])
          .map(InspectionCategoryScore.fromJson)
          .toList(growable: false),
      findings: asMapList(json['findings'])
          .map(InspectionFinding.fromJson)
          .toList(growable: false),
    );
  }
}

class ListingCard {
  ListingCard({
    required this.id,
    required this.slug,
    required this.year,
    required this.make,
    required this.model,
    required this.bodyType,
    required this.askPriceUsd,
    required this.negotiable,
    required this.city,
    required this.coverImageUrl,
    required this.bisellVerified,
    required this.inspectionScore,
    required this.daysListed,
  });

  final String id;
  final String slug;
  final int year;
  final String make;
  final String model;
  final String bodyType;
  final double askPriceUsd;
  final bool negotiable;
  final String city;
  final String? coverImageUrl;
  final bool bisellVerified;
  final int? inspectionScore;
  final int daysListed;

  String get title => '$year $make $model';

  factory ListingCard.fromJson(Map<String, dynamic> json) {
    final score = json['inspectionScore'];
    return ListingCard(
      id: asString(json, 'id'),
      slug: asString(json, 'slug'),
      year: asInt(json, 'year'),
      make: asString(json, 'make'),
      model: asString(json, 'model'),
      bodyType: asString(json, 'bodyType'),
      askPriceUsd: asDouble(json, 'askPriceUsd'),
      negotiable: asBool(json, 'negotiable'),
      city: asString(json, 'city'),
      coverImageUrl: asNullableString(json, 'coverImageUrl'),
      bisellVerified: asBool(json, 'bisellVerified'),
      inspectionScore: score == null ? null : int.parse(score.toString()),
      daysListed: asInt(json, 'daysListed'),
    );
  }
}

class ListingDetail {
  ListingDetail({
    required this.id,
    required this.slug,
    required this.year,
    required this.make,
    required this.model,
    required this.bodyType,
    required this.colour,
    required this.fuelType,
    required this.transmission,
    required this.driveType,
    required this.engineCapacity,
    required this.mileageKm,
    required this.askPriceUsd,
    required this.negotiable,
    required this.sellerDisclosure,
    required this.city,
    required this.coverImageUrl,
    required this.images,
    required this.inspectionSummary,
    required this.bisellVerified,
    required this.publishedAt,
    required this.daysListed,
    required this.viewCount,
  });

  final String id;
  final String slug;
  final int year;
  final String make;
  final String model;
  final String bodyType;
  final String colour;
  final String fuelType;
  final String transmission;
  final String driveType;
  final String? engineCapacity;
  final int mileageKm;
  final double askPriceUsd;
  final bool negotiable;
  final String? sellerDisclosure;
  final String city;
  final String? coverImageUrl;
  final List<VehicleImage> images;
  final InspectionSummary? inspectionSummary;
  final bool bisellVerified;
  final String publishedAt;
  final int daysListed;
  final int viewCount;

  String get title => '$year $make $model';

  factory ListingDetail.fromJson(Map<String, dynamic> json) {
    final summaryJson = json['inspectionSummary'];
    return ListingDetail(
      id: asString(json, 'id'),
      slug: asString(json, 'slug'),
      year: asInt(json, 'year'),
      make: asString(json, 'make'),
      model: asString(json, 'model'),
      bodyType: asString(json, 'bodyType'),
      colour: asString(json, 'colour'),
      fuelType: asString(json, 'fuelType'),
      transmission: asString(json, 'transmission'),
      driveType: asString(json, 'driveType'),
      engineCapacity: asNullableString(json, 'engineCapacity'),
      mileageKm: asInt(json, 'mileageKm'),
      askPriceUsd: asDouble(json, 'askPriceUsd'),
      negotiable: asBool(json, 'negotiable'),
      sellerDisclosure: asNullableString(json, 'sellerDisclosure'),
      city: asString(json, 'city'),
      coverImageUrl: asNullableString(json, 'coverImageUrl'),
      images: asMapList(json['images'])
          .map(VehicleImage.fromJson)
          .toList(growable: false),
      inspectionSummary: summaryJson is Map<String, dynamic>
          ? InspectionSummary.fromJson(summaryJson)
          : summaryJson is Map
              ? InspectionSummary.fromJson(summaryJson.cast<String, dynamic>())
              : null,
      bisellVerified: asBool(json, 'bisellVerified'),
      publishedAt: asString(json, 'publishedAt'),
      daysListed: asInt(json, 'daysListed'),
      viewCount: asInt(json, 'viewCount'),
    );
  }
}

class CataloguePage {
  CataloguePage({
    required this.data,
    required this.nextCursor,
    required this.hasMore,
  });

  final List<ListingCard> data;
  final String? nextCursor;
  final bool hasMore;

  factory CataloguePage.fromJson(Map<String, dynamic> json) {
    final meta = asMap(json['meta']);
    return CataloguePage(
      data: asMapList(json['data'])
          .map(ListingCard.fromJson)
          .toList(growable: false),
      nextCursor: asNullableString(meta, 'nextCursor'),
      hasMore: asBool(meta, 'hasMore'),
    );
  }
}
