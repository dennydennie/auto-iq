import 'dart:typed_data';

import 'package:autoiq_mobile/src/core/network/api_client.dart';
import 'package:dio/dio.dart';
import 'package:autoiq_mobile/src/models/listing_filters.dart';
import 'package:autoiq_mobile/src/repositories/buyer_repository.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('browse sends the complete applied filter query to the catalogue',
      () async {
    final apiClient = _RecordingApiClient();
    final repository = BuyerRepository(apiClient);

    await repository.browse(
      query: 'Toyota Hilux',
      cursor: 'next-page',
      filters: const ListingFilterState(
        make: 'Toyota',
        model: 'Hilux',
        yearMin: 2019,
        yearMax: 2021,
        city: 'Harare',
        bodyType: 'BAKKIE',
        priceMin: 10000,
        priceMax: 25000,
        mileageMin: 40000,
        mileageMax: 150000,
        transmission: 'AUTOMATIC',
        fuelType: 'DIESEL',
        verifiedOnly: true,
      ),
    );

    expect(apiClient.path, '/api/v1/listings');
    expect(apiClient.queryParameters, {
      'limit': 20,
      'sortBy': 'publishedAt',
      'sortDir': 'DESC',
      'query': 'Toyota Hilux',
      'cursor': 'next-page',
      'make': ['Toyota'],
      'model': 'Hilux',
      'yearMin': 2019,
      'yearMax': 2021,
      'city': 'Harare',
      'bodyType': 'BAKKIE',
      'priceMin': 10000,
      'priceMax': 25000,
      'mileageMin': 40000,
      'mileageMax': 150000,
      'transmission': 'AUTOMATIC',
      'fuelType': 'DIESEL',
      'bisellVerified': true,
    });
  });

  test('browse omits optional filters after Clear', () async {
    final apiClient = _RecordingApiClient();
    final repository = BuyerRepository(apiClient);

    await repository.browse();

    expect(apiClient.queryParameters, {
      'limit': 20,
      'sortBy': 'publishedAt',
      'sortDir': 'DESC',
    });
  });

  test('catalogue makes use public facets and include dependent models',
      () async {
    final apiClient = _RecordingApiClient(
      responses: {
        '/api/v1/listings/facets/makes': [
          {'make': 'Toyota', 'count': 3},
          {'make': 'Honda', 'count': 1},
        ],
        '/api/v1/listings/facets/models': [
          {'make': 'Toyota', 'model': 'Hilux', 'count': 2},
          {'make': 'Toyota', 'model': 'Corolla', 'count': 1},
          {'make': 'Honda', 'model': 'Vezel', 'count': 1},
        ],
      },
    );

    final makes = await BuyerRepository(apiClient).catalogueMakes();

    expect(apiClient.paths, contains('/api/v1/listings/facets/makes'));
    expect(apiClient.paths, contains('/api/v1/listings/facets/models'));
    expect(makes.map((make) => make.name), ['Toyota', 'Honda']);
    expect(makes[0].popularModels, ['Hilux', 'Corolla']);
    expect(makes[1].popularModels, ['Vezel']);
  });
}

class _RecordingApiClient implements ApiClient {
  _RecordingApiClient({this.responses = const {}});

  final Map<String, dynamic> responses;
  final List<String> paths = [];
  String? path;
  Map<String, dynamic>? queryParameters;

  @override
  Future<T> getJson<T>(
    String path,
    T Function(dynamic json) parser, {
    Map<String, dynamic>? queryParameters,
  }) async {
    this.path = path;
    paths.add(path);
    this.queryParameters = queryParameters;
    final response = responses[path] ??
        {
          'data': <dynamic>[],
          'meta': {'nextCursor': null, 'hasMore': false},
        };
    return parser(response);
  }

  @override
  Future<void> clearSession() => throw UnimplementedError();

  @override
  Future<void> delete(String path, {bool includeCsrf = false}) =>
      throw UnimplementedError();

  @override
  Future<void> ensureCsrfToken() => throw UnimplementedError();

  @override
  Future<T> patchJson<T>(
    String path,
    dynamic body,
    T Function(dynamic json) parser, {
    bool includeCsrf = false,
  }) =>
      throw UnimplementedError();

  @override
  Future<T> postJson<T>(
    String path,
    dynamic body,
    T Function(dynamic json) parser, {
    bool includeCsrf = false,
  }) =>
      throw UnimplementedError();

  @override
  Future<T> putJson<T>(
    String path,
    dynamic body,
    T Function(dynamic json) parser, {
    bool includeCsrf = false,
  }) =>
      throw UnimplementedError();

  @override
  Future<void> uploadBinary({
    required String url,
    required Uint8List bytes,
    required String contentType,
  }) =>
      throw UnimplementedError();

  @override
  Future<void> uploadStream({
    required String url,
    required Stream<List<int>> Function() openRead,
    required int contentLength,
    required String contentType,
    ProgressCallback? onSendProgress,
    CancelToken? cancelToken,
  }) =>
      throw UnimplementedError();
}
