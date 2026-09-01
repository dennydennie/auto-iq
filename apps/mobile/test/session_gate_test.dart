import 'package:autoiq_mobile/src/app.dart';
import 'package:autoiq_mobile/src/core/network/api_client.dart';
import 'package:autoiq_mobile/src/core/network/api_exception.dart';
import 'package:autoiq_mobile/src/repositories/auth_repository.dart';
import 'package:autoiq_mobile/src/repositories/reference_repository.dart';
import 'package:autoiq_mobile/src/state/session_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('network bootstrap failure is not treated as signed out', () async {
    final api = _BootstrapApiClient();
    final session = SessionController(
      authRepository: AuthRepository(api),
      referenceRepository: ReferenceRepository(api),
    );

    await session.bootstrap();
    expect(session.isSessionUnavailable, isTrue);
    expect(session.isAuthenticated, isFalse);
    expect(session.bootstrapError?.code, 'NETWORK_ERROR');

    api.online = true;
    await session.bootstrap();
    expect(session.isSessionUnavailable, isFalse);
    expect(session.isAuthenticated, isTrue);
  });

  testWidgets(
      'session unavailable screen offers a retry with support reference',
      (tester) async {
    var retries = 0;
    await tester.pumpWidget(
      MaterialApp(
        home: SessionUnavailableScreen(
          error: ApiException(
            message: 'Network unavailable.',
            statusCode: 0,
            code: 'NETWORK_ERROR',
            correlationId: 'trace-42',
          ),
          onRetry: () async => retries += 1,
        ),
      ),
    );

    expect(find.textContaining('not been signed out'), findsOneWidget);
    expect(find.textContaining('trace-42'), findsOneWidget);
    await tester.tap(find.byKey(const Key('retry-session')));
    expect(retries, 1);
  });
}

class _BootstrapApiClient extends Fake implements ApiClient {
  bool online = false;

  @override
  Future<T> getJson<T>(
    String path,
    T Function(dynamic json) parser, {
    Map<String, dynamic>? queryParameters,
  }) async {
    if (!online) {
      throw ApiException(
        message: 'Network unavailable.',
        statusCode: 0,
        code: 'NETWORK_ERROR',
      );
    }
    if (path == '/api/v1/reference-data') return parser(_referenceData);
    return parser(_user);
  }
}

const _user = <String, dynamic>{
  'id': 'buyer-1',
  'fullName': 'Tariro Moyo',
  'email': 'buyer@example.com',
  'phone': '+263771234567',
  'city': 'Harare',
  'status': 'ACTIVE',
  'roles': ['BUYER'],
  'phoneVerified': true,
  'emailVerified': true,
  'buyerProfile': null,
  'sellerProfile': null,
  'acceptedConsents': ['TERMS', 'PRIVACY', 'BUYER_RULES', 'NO_SIDE_DEAL'],
  'consentsComplete': true,
};

const _referenceData = <String, dynamic>{
  'makes': <dynamic>[],
  'bodyTypes': <dynamic>[],
  'fuelTypes': <dynamic>[],
  'transmissionTypes': <dynamic>[],
  'driveTypes': <dynamic>[],
  'conditionGrades': <dynamic>[],
  'viewingLocations': <dynamic>[],
};
