import 'dart:typed_data';

import 'package:autoiq_mobile/src/core/network/api_client.dart';
import 'package:autoiq_mobile/src/models/listing_filters.dart';
import 'package:autoiq_mobile/src/repositories/buyer_repository.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('browse sends the complete applied filter query to the catalogue',
      () async {
    final apiClient = _RecordingApiClient();
    final repository = BuyerRepository(apiClient);

    await repository.browse(
      filters: const ListingFilterState(
        make: 'Toyota',
        model: 'Hilux',
        year: 2021,
        city: 'Harare',
        bodyType: 'BAKKIE',
        verifiedOnly: true,
      ),
    );

    expect(apiClient.path, '/api/v1/listings');
    expect(apiClient.queryParameters, {
      'limit': 20,
      'sortBy': 'publishedAt',
      'sortDir': 'DESC',
      'make': ['Toyota'],
      'model': 'Hilux',
      'yearMin': 2021,
      'yearMax': 2021,
      'city': 'Harare',
      'bodyType': 'BAKKIE',
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
}

class _RecordingApiClient implements ApiClient {
  String? path;
  Map<String, dynamic>? queryParameters;

  @override
  Future<T> getJson<T>(
    String path,
    T Function(dynamic json) parser, {
    Map<String, dynamic>? queryParameters,
  }) async {
    this.path = path;
    this.queryParameters = queryParameters;
    return parser({
      'data': <dynamic>[],
      'meta': {'nextCursor': null, 'hasMore': false},
    });
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
}
