import '../core/config/api_routes.dart';
import '../core/network/api_client.dart';
import '../models/activity_models.dart';
import '../models/listing_models.dart';
import 'catalogue_pager.dart';

class BuyerRepository {
  BuyerRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<CataloguePage> browse({
    String? bodyType,
    String? city,
    bool? verifiedOnly,
    String? cursor,
    int limit = 100,
  }) {
    return _apiClient.getJson<CataloguePage>(
      ApiRoutes.catalogue,
      (json) => CataloguePage.fromJson((json as Map).cast<String, dynamic>()),
      queryParameters: {
        'limit': limit,
        'cursor': cursor,
        'sortBy': 'publishedAt',
        'sortDir': 'DESC',
        'bodyType': bodyType,
        'city': city,
        'bisellVerified': verifiedOnly,
      },
    );
  }

  Future<List<ListingCard>> browseAll({
    String? bodyType,
    String? city,
    bool? verifiedOnly,
  }) {
    return CataloguePager(
      fetchPage: ({String? cursor}) => browse(
        bodyType: bodyType,
        city: city,
        verifiedOnly: verifiedOnly,
        cursor: cursor,
      ),
    ).loadAll();
  }

  Future<ListingDetail> fetchDetail(String listingId) {
    return _apiClient.getJson<ListingDetail>(
      ApiRoutes.catalogueDetail(listingId),
      (json) => ListingDetail.fromJson((json as Map).cast<String, dynamic>()),
    );
  }

  Future<InspectionSummary> fetchInspectionSummary(String listingId) {
    return _apiClient.getJson<InspectionSummary>(
      ApiRoutes.inspectionSummary(listingId),
      (json) =>
          InspectionSummary.fromJson((json as Map).cast<String, dynamic>()),
    );
  }

  Future<List<SavedVehicleItem>> savedVehicles() {
    return _apiClient.getJson<List<SavedVehicleItem>>(
      ApiRoutes.meSavedVehicles,
      (json) => _offsetData(json, SavedVehicleItem.fromJson),
    );
  }

  Future<void> saveVehicle(String listingId) async {
    await _apiClient.postJson<void>(
      ApiRoutes.savedVehicle(listingId),
      const {},
      (_) {},
      includeCsrf: true,
    );
  }

  Future<void> removeSavedVehicle(String listingId) {
    return _apiClient.delete(
      ApiRoutes.savedVehicle(listingId),
      includeCsrf: true,
    );
  }

  Future<List<QuoteItem>> quotes() {
    return _apiClient.getJson<List<QuoteItem>>(
      ApiRoutes.meQuotes,
      (json) => _offsetData(json, QuoteItem.fromJson),
    );
  }

  Future<void> createQuote({
    required String listingId,
    required double offerPriceUsd,
    required String paymentPlan,
    String? message,
  }) async {
    await _apiClient.postJson<void>(
      ApiRoutes.createQuote(listingId),
      {
        'offerPriceUsd': offerPriceUsd,
        'paymentPlan': paymentPlan,
        'message': message?.trim(),
      },
      (_) {},
      includeCsrf: true,
    );
  }

  Future<List<VehicleRequestItem>> vehicleRequests() {
    return _apiClient.getJson<List<VehicleRequestItem>>(
      ApiRoutes.meVehicleRequests,
      (json) => _offsetData(json, VehicleRequestItem.fromJson),
    );
  }

  Future<void> createVehicleRequest({
    required int maxBudgetCents,
    String? makeId,
    String? model,
    int? yearMin,
    int? yearMax,
    String? bodyTypeId,
    String? fuelTypeId,
    String? transmissionTypeId,
    int? maxOdometerKm,
    required String urgency,
    String? notes,
  }) async {
    await _apiClient.postJson<void>(
      ApiRoutes.vehicleRequests,
      {
        'maxBudgetCents': maxBudgetCents,
        'makeId': makeId,
        'model': model?.trim(),
        'yearMin': yearMin,
        'yearMax': yearMax,
        'bodyTypeId': bodyTypeId,
        'fuelTypeId': fuelTypeId,
        'transmissionTypeId': transmissionTypeId,
        'maxOdometerKm': maxOdometerKm,
        'urgency': urgency,
        'notes': notes?.trim(),
      },
      (_) {},
      includeCsrf: true,
    );
  }

  Future<List<ViewingItem>> viewings() {
    return _apiClient.getJson<List<ViewingItem>>(
      ApiRoutes.meViewings,
      (json) => _offsetData(json, ViewingItem.fromJson),
    );
  }

  Future<void> requestViewing({
    required String listingId,
    required String preferredDate,
    required String preferredTime,
    required String locationId,
    String? note,
  }) async {
    await _apiClient.postJson<void>(
      ApiRoutes.createViewing(listingId),
      {
        'preferredDate': preferredDate,
        'preferredTime': preferredTime,
        'locationId': locationId,
        'note': note?.trim(),
      },
      (_) {},
      includeCsrf: true,
    );
  }

  List<T> _offsetData<T>(
    dynamic json,
    T Function(Map<String, dynamic> value) parser,
  ) {
    final map = (json as Map).cast<String, dynamic>();
    final items = (map['data'] as List)
        .map((value) => parser((value as Map).cast<String, dynamic>()))
        .toList(growable: false);
    return items;
  }
}
