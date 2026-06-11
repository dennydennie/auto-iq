import 'dart:typed_data';

import '../core/config/api_routes.dart';
import '../core/files/file_type_sniffer.dart';
import '../core/network/api_client.dart';
import '../models/seller_models.dart';

class LocalUpload {
  LocalUpload({
    required this.bytes,
    required this.fileType,
    required this.name,
  });

  final Uint8List bytes;
  final SniffedFileType fileType;
  final String name;
}

class SellerRepository {
  SellerRepository(this._apiClient);

  final ApiClient _apiClient;

  static const imageSlots = <String>[
    'FRONT_THREE_QUARTER',
    'REAR_THREE_QUARTER',
    'DRIVER_SIDE',
    'PASSENGER_SIDE',
    'INTERIOR_FRONT',
    'INTERIOR_REAR',
    'DASHBOARD',
    'ENGINE_BAY',
    'BOOT',
    'FRONT_LEFT_WHEEL',
    'ODOMETER',
    'VIN_PLATE',
  ];

  static const documentTypes = <String>[
    'REGISTRATION_BOOK',
    'INSURANCE_CERTIFICATE',
    'POLICE_CLEARANCE',
    'ROADWORTHY_CERTIFICATE',
    'PURCHASE_IMPORT_DOCS',
    'SELLER_ID',
  ];

  Future<List<SellerListingSummary>> listings() {
    return _apiClient.getJson<List<SellerListingSummary>>(
      ApiRoutes.meListings,
      (json) {
        final map = (json as Map).cast<String, dynamic>();
        return (map['data'] as List)
            .map(
              (value) => SellerListingSummary.fromJson(
                (value as Map).cast<String, dynamic>(),
              ),
            )
            .toList(growable: false);
      },
      queryParameters: const {
        'page': 1,
        'limit': 50,
        'sortBy': 'updatedAt',
        'sortDir': 'DESC',
      },
    );
  }

  Future<SellerListingDetail> detail(String listingId) {
    return _apiClient.getJson<SellerListingDetail>(
      ApiRoutes.listingDetail(listingId),
      (json) =>
          SellerListingDetail.fromJson((json as Map).cast<String, dynamic>()),
    );
  }

  Future<String> createDraft({
    required String make,
    required String model,
    required int year,
    required String bodyType,
    required String colour,
    required String fuelType,
    required String transmission,
    required String driveType,
    required String? engineCapacity,
    required int mileageKm,
    required String condition,
    required bool hasAccidentHistory,
    required String? accidentNote,
    required double askPriceUsd,
    required bool negotiable,
  }) async {
    final listing = await _apiClient.postJson<SellerListingDetail>(
      ApiRoutes.catalogue,
      {
        'make': make.trim(),
        'model': model.trim(),
        'year': year,
        'bodyType': bodyType,
        'colour': colour.trim(),
        'fuelType': fuelType,
        'transmission': transmission,
        'driveType': driveType,
        'engineCapacity': engineCapacity?.trim(),
        'mileageKm': mileageKm,
        'condition': condition,
        'hasAccidentHistory': hasAccidentHistory,
        'accidentNote': accidentNote?.trim(),
        'askPriceUsd': askPriceUsd,
        'negotiable': negotiable,
      },
      (json) =>
          SellerListingDetail.fromJson((json as Map).cast<String, dynamic>()),
      includeCsrf: true,
    );
    return listing.id;
  }

  Future<SellerListingDetail> updateSpecs({
    required String listingId,
    required String make,
    required String model,
    required int year,
    required String bodyType,
    required String colour,
    required String fuelType,
    required String transmission,
    required String driveType,
    required String? engineCapacity,
    required int mileageKm,
    required String condition,
    required bool hasAccidentHistory,
    required String? accidentNote,
  }) {
    return _apiClient.putJson<SellerListingDetail>(
      ApiRoutes.listingSpecs(listingId),
      {
        'make': make.trim(),
        'model': model.trim(),
        'year': year,
        'bodyType': bodyType,
        'colour': colour.trim(),
        'fuelType': fuelType,
        'transmission': transmission,
        'driveType': driveType,
        'engineCapacity': engineCapacity?.trim(),
        'mileageKm': mileageKm,
        'condition': condition,
        'hasAccidentHistory': hasAccidentHistory,
        'accidentNote': accidentNote?.trim(),
      },
      (json) =>
          SellerListingDetail.fromJson((json as Map).cast<String, dynamic>()),
      includeCsrf: true,
    );
  }

  Future<SellerListingDetail> updatePricing({
    required String listingId,
    required double askPriceUsd,
    required bool negotiable,
  }) {
    return _apiClient.putJson<SellerListingDetail>(
      ApiRoutes.listingPricing(listingId),
      {
        'askPriceUsd': askPriceUsd,
        'negotiable': negotiable,
      },
      (json) =>
          SellerListingDetail.fromJson((json as Map).cast<String, dynamic>()),
      includeCsrf: true,
    );
  }

  Future<SellerListingDetail> updateDisclosure({
    required String listingId,
    required String sellerDisclosure,
  }) {
    return _apiClient.patchJson<SellerListingDetail>(
      ApiRoutes.listingDetail(listingId),
      {'sellerDisclosure': sellerDisclosure.trim()},
      (json) =>
          SellerListingDetail.fromJson((json as Map).cast<String, dynamic>()),
      includeCsrf: true,
    );
  }

  Future<SellerListingDetail> submit({
    required String listingId,
    required String disclosure,
  }) {
    return _apiClient.postJson<SellerListingDetail>(
      ApiRoutes.listingSubmit(listingId),
      {'sellerDisclosure': disclosure.trim()},
      (json) =>
          SellerListingDetail.fromJson((json as Map).cast<String, dynamic>()),
      includeCsrf: true,
    );
  }

  Future<List<SellerTimelineEntry>> timeline(String listingId) {
    return _apiClient.getJson<List<SellerTimelineEntry>>(
      ApiRoutes.listingTimeline(listingId),
      (json) {
        final map = (json as Map).cast<String, dynamic>();
        return (map['history'] as List)
            .map(
              (value) => SellerTimelineEntry.fromJson(
                (value as Map).cast<String, dynamic>(),
              ),
            )
            .toList(growable: false);
      },
    );
  }

  Future<void> uploadImage({
    required String listingId,
    required LocalUpload file,
    required String slot,
    required bool isCover,
  }) async {
    final presign = await _apiClient.postJson<Map<String, dynamic>>(
      ApiRoutes.storageImagePresign,
      {
        'slot': slot,
        'contentType': file.fileType.contentType,
        'contentLength': file.bytes.length,
      },
      (json) => (json as Map).cast<String, dynamic>(),
      includeCsrf: true,
    );
    await _apiClient.uploadBinary(
      url: presign['uploadUrl']?.toString() ?? '',
      bytes: file.bytes,
      contentType: file.fileType.contentType,
    );
    await _apiClient.postJson<void>(
      ApiRoutes.listingImages(listingId),
      {
        'storageKey': presign['storageKey']?.toString(),
        'slot': slot,
        'isCover': isCover,
      },
      (_) {},
      includeCsrf: true,
    );
  }

  Future<void> uploadDocument({
    required String listingId,
    required LocalUpload file,
    required String documentType,
  }) async {
    final presign = await _apiClient.postJson<Map<String, dynamic>>(
      ApiRoutes.storageDocumentPresign,
      {
        'documentType': documentType,
        'contentType': file.fileType.contentType,
        'contentLength': file.bytes.length,
      },
      (json) => (json as Map).cast<String, dynamic>(),
      includeCsrf: true,
    );
    await _apiClient.uploadBinary(
      url: presign['uploadUrl']?.toString() ?? '',
      bytes: file.bytes,
      contentType: file.fileType.contentType,
    );
    await _apiClient.postJson<void>(
      ApiRoutes.listingDocuments(listingId),
      {
        'storageKey': presign['storageKey']?.toString(),
        'documentType': documentType,
      },
      (_) {},
      includeCsrf: true,
    );
  }
}
