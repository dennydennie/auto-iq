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
}
