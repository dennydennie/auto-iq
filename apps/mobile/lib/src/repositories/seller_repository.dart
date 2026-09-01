import 'package:dio/dio.dart';

import '../core/config/api_routes.dart';
import '../core/files/local_upload.dart';
import '../core/network/api_client.dart';
import '../models/activity_models.dart';
import '../models/seller_models.dart';

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

  static const requiredDocumentTypes = <String>[
    'REGISTRATION_BOOK',
    'SELLER_ID',
    'PURCHASE_IMPORT_DOCS',
  ];

  static const documentTypes = <String>[
    ...requiredDocumentTypes,
    'INSURANCE_CERTIFICATE',
    'POLICE_CLEARANCE',
    'ROADWORTHY_CERTIFICATE',
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

  Future<List<ViewingItem>> viewings() {
    return _apiClient.getJson<List<ViewingItem>>(
      ApiRoutes.meSellerViewings,
      (json) => _offsetData(json, ViewingItem.fromJson),
      queryParameters: const {'page': 1, 'limit': 50},
    );
  }

  Future<ViewingItem> acknowledgeViewing(String viewingId) {
    return _apiClient.postJson<ViewingItem>(
      ApiRoutes.sellerViewingConfirm(viewingId),
      const {},
      (json) => ViewingItem.fromJson(
        (json as Map).cast<String, dynamic>(),
      ),
      includeCsrf: true,
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
    ProgressCallback? onProgress,
    CancelToken? cancelToken,
  }) async {
    final presign = await _apiClient.postJson<Map<String, dynamic>>(
      ApiRoutes.storageImagePresign,
      {
        'listingId': listingId,
        'slot': slot,
        'contentType': file.fileType.contentType,
        'contentLength': file.length,
      },
      (json) => (json as Map).cast<String, dynamic>(),
      includeCsrf: true,
    );
    await _apiClient.uploadStream(
      url: presign['uploadUrl']?.toString() ?? '',
      openRead: file.openRead,
      contentLength: file.length,
      contentType: file.fileType.contentType,
      onSendProgress: onProgress,
      cancelToken: cancelToken,
    );
    await _apiClient.postJson<void>(
      ApiRoutes.listingImages(listingId),
      {
        'storageKey': presign['storageKey']?.toString(),
        'slot': slot,
        'contentType': file.fileType.contentType,
        'contentLength': file.length,
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
    ProgressCallback? onProgress,
    CancelToken? cancelToken,
  }) async {
    final presign = await _apiClient.postJson<Map<String, dynamic>>(
      ApiRoutes.storageDocumentPresign,
      {
        'listingId': listingId,
        'documentType': documentType,
        'contentType': file.fileType.contentType,
        'contentLength': file.length,
      },
      (json) => (json as Map).cast<String, dynamic>(),
      includeCsrf: true,
    );
    await _apiClient.uploadStream(
      url: presign['uploadUrl']?.toString() ?? '',
      openRead: file.openRead,
      contentLength: file.length,
      contentType: file.fileType.contentType,
      onSendProgress: onProgress,
      cancelToken: cancelToken,
    );
    await _apiClient.postJson<void>(
      ApiRoutes.listingDocuments(listingId),
      {
        'storageKey': presign['storageKey']?.toString(),
        'documentType': documentType,
        'contentType': file.fileType.contentType,
        'contentLength': file.length,
      },
      (_) {},
      includeCsrf: true,
    );
  }

  Future<void> setCoverImage({
    required String listingId,
    required String imageId,
  }) async {
    await _apiClient.patchJson<void>(
      ApiRoutes.listingImage(listingId, imageId),
      const {'isCover': true},
      (_) {},
      includeCsrf: true,
    );
  }

  Future<void> reorderImages({
    required String listingId,
    required List<String> imageIds,
  }) async {
    await _apiClient.putJson<void>(
      ApiRoutes.listingImageOrder(listingId),
      {'imageIds': imageIds},
      (_) {},
      includeCsrf: true,
    );
  }

  Future<void> deleteImage({
    required String listingId,
    required String imageId,
  }) {
    return _apiClient.delete(
      ApiRoutes.listingImage(listingId, imageId),
      includeCsrf: true,
    );
  }

  Future<void> deleteDocument({
    required String listingId,
    required String documentId,
  }) {
    return _apiClient.delete(
      ApiRoutes.listingDocument(listingId, documentId),
      includeCsrf: true,
    );
  }

  List<T> _offsetData<T>(
    dynamic json,
    T Function(Map<String, dynamic> value) parser,
  ) {
    final data = ((json as Map)['data'] as List).cast<dynamic>();
    return data
        .map((value) => parser((value as Map).cast<String, dynamic>()))
        .toList(growable: false);
  }
}
