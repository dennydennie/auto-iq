import 'package:autoiq_mobile/src/core/network/api_client.dart';
import 'package:autoiq_mobile/src/repositories/seller_repository.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('seller submissions require the three ownership documents', () {
    expect(
      SellerRepository.requiredDocumentTypes,
      const ['REGISTRATION_BOOK', 'SELLER_ID', 'PURCHASE_IMPORT_DOCS'],
    );
    expect(
      SellerRepository.documentTypes.take(3),
      SellerRepository.requiredDocumentTypes,
    );
  });

  test('seller can load and acknowledge viewing requests', () async {
    final api = _SellerApiClient();
    final repository = SellerRepository(api);

    final viewings = await repository.viewings();
    await repository.acknowledgeViewing('viewing-1');

    expect(viewings.single.buyerName, 'Buyer One');
    expect(api.getPath, '/api/v1/me/seller-viewings');
    expect(api.getQuery, {'page': 1, 'limit': 50});
    expect(
      api.postPath,
      '/api/v1/me/viewings/viewing-1/seller-confirm',
    );
    expect(api.postCsrf, isTrue);
  });
}

class _SellerApiClient extends Fake implements ApiClient {
  String? getPath;
  Map<String, dynamic>? getQuery;
  String? postPath;
  bool postCsrf = false;

  @override
  Future<T> getJson<T>(
    String path,
    T Function(dynamic json) parser, {
    Map<String, dynamic>? queryParameters,
  }) async {
    getPath = path;
    getQuery = queryParameters;
    return parser({
      'data': [_viewing],
      'meta': const {},
    });
  }

  @override
  Future<T> postJson<T>(
    String path,
    dynamic body,
    T Function(dynamic json) parser, {
    bool includeCsrf = false,
  }) async {
    postPath = path;
    postCsrf = includeCsrf;
    return parser({..._viewing, 'status': 'PENDING_SELLER_CONFIRMATION'});
  }
}

const _viewing = {
  'id': 'viewing-1',
  'listingId': 'listing-1',
  'buyerName': 'Buyer One',
  'status': 'REQUESTED',
  'preferredSlot': '2026-08-15T09:00:00.000Z',
  'confirmedSlot': null,
  'location': null,
  'note': null,
  'outcomeNote': null,
  'participants': <dynamic>[],
  'listingSnapshot': {
    'year': 2021,
    'make': 'Honda',
    'model': 'Vezel',
  },
};
