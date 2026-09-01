import 'package:autoiq_mobile/src/core/forms/form_validators.dart';
import 'package:autoiq_mobile/src/core/network/api_exception.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('typed form validation', () {
    test('rejects malformed numeric input without throwing', () {
      expect(
        FormValidators.decimal('twelve', label: 'Offer'),
        'Offer must be a number.',
      );
      expect(
        FormValidators.integer('12.5', label: 'Mileage'),
        'Mileage must be a whole number.',
      );
      expect(optionalDouble('twelve'), isNull);
      expect(optionalInt('12.5'), isNull);
    });

    test('enforces finite values and configured ranges', () {
      expect(
        FormValidators.decimal('NaN', label: 'Price'),
        'Price must be a number.',
      );
      expect(
        FormValidators.integer('-1', label: 'Mileage', minimum: 0),
        'Mileage must be at least 0.',
      );
      expect(
        FormValidators.decimal('1200', label: 'Price', minimum: 1),
        isNull,
      );
    });
  });

  test('API errors retain field errors and support references', () {
    final error = ApiException.fromResponse({
      'code': 'VALIDATION_FAILED',
      'message': 'Check the highlighted fields.',
      'correlationId': 'trace-123',
      'details': [
        {'field': 'askPriceUsd', 'message': 'Price must be positive'},
      ],
    }, 422);

    expect(error.fieldError('askPriceUsd'), 'Price must be positive');
    expect(error.supportMessage, contains('trace-123'));
    expect(error.toString(), 'Check the highlighted fields.');
  });
}
