import '../core/config/api_routes.dart';
import '../core/network/api_client.dart';
import '../models/activity_models.dart';
import '../models/listing_filters.dart';
import '../models/listing_models.dart';
import '../models/reference_data.dart';

class BuyerRepository {
  BuyerRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<CataloguePage> browse({
    ListingFilterState filters = const ListingFilterState(),
  }) {
    return _apiClient.getJson<CataloguePage>(
      ApiRoutes.catalogue,
      (json) => CataloguePage.fromJson((json as Map).cast<String, dynamic>()),
      queryParameters: {
        'limit': 20,
        'sortBy': 'publishedAt',
        'sortDir': 'DESC',
        ...filters.catalogueQuery,
      },
    );
  }

  Future<List<VehicleMake>> catalogueMakes() async {
    final namesFuture = _catalogueMakeNames();
    final modelsFuture = _catalogueModelsByMake();
    return _toVehicleMakes(await namesFuture, await modelsFuture);
  }

  Future<List<String>> _catalogueMakeNames() {
    return _apiClient.getJson<List<String>>(
      ApiRoutes.catalogueMakeFacets,
      _parseMakeNames,
    );
  }

  Future<Map<String, List<String>>> _catalogueModelsByMake() {
    return _apiClient.getJson<Map<String, List<String>>>(
      ApiRoutes.catalogueModelFacets,
      _parseModelsByMake,
    );
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

List<String> _parseMakeNames(dynamic json) {
  final names = (json as List)
      .map(_facetMap)
      .map((item) => item['make']?.toString().trim() ?? '')
      .where((value) => value.isNotEmpty);
  return _uniqueCaseInsensitive(names);
}

Map<String, List<String>> _parseModelsByMake(dynamic json) {
  final models = <String, List<String>>{};
  for (final item in (json as List).map(_facetMap)) {
    final make = item['make']?.toString().trim() ?? '';
    final model = item['model']?.toString().trim() ?? '';
    if (make.isEmpty || model.isEmpty) continue;
    models.putIfAbsent(make.toLowerCase(), () => []).add(model);
  }
  return models.map(
    (make, values) => MapEntry(make, _uniqueCaseInsensitive(values)),
  );
}

List<VehicleMake> _toVehicleMakes(
  List<String> makeNames,
  Map<String, List<String>> modelsByMake,
) {
  return makeNames
      .map(
        (make) => VehicleMake(
          id: make.toLowerCase().replaceAll(RegExp('[^a-z0-9]+'), '-'),
          name: make,
          popularModels: modelsByMake[make.toLowerCase()] ?? const [],
        ),
      )
      .toList(growable: false);
}

Map<String, dynamic> _facetMap(dynamic value) {
  return (value as Map).cast<String, dynamic>();
}

List<String> _uniqueCaseInsensitive(Iterable<String> values) {
  final seen = <String>{};
  return values
      .where((value) => seen.add(value.toLowerCase()))
      .toList(growable: false);
}
