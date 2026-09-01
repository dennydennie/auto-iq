import 'package:autoiq_mobile/src/core/network/api_client.dart';
import 'package:autoiq_mobile/src/repositories/auth_repository.dart';
import 'package:autoiq_mobile/src/repositories/reference_repository.dart';
import 'package:autoiq_mobile/src/screens/auth/consent_screen.dart';
import 'package:autoiq_mobile/src/state/session_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

void main() {
  testWidgets('each role-required consent needs its own explicit acceptance',
      (tester) async {
    final api = _ConsentApiClient();
    final session = SessionController(
      authRepository: AuthRepository(api),
      referenceRepository: ReferenceRepository(api),
    );
    await session.bootstrap();

    await tester.pumpWidget(
      ChangeNotifierProvider<SessionController>.value(
        value: session,
        child: MaterialApp(home: ConsentScreen(user: session.user!)),
      ),
    );

    expect(find.byType(CheckboxListTile), findsNWidgets(4));
    expect(_acceptButton(tester).onPressed, isNull);
    for (final type in _required) {
      final tile = tester.widget<CheckboxListTile>(
        find.byKey(Key('consent-$type')),
      );
      tile.onChanged!(true);
      await tester.pump();
    }
    expect(_acceptButton(tester).onPressed, isNotNull);

    await tester.ensureVisible(find.byKey(const Key('accept-consents')));
    await tester.tap(find.byKey(const Key('accept-consents')));
    await tester.pumpAndSettle();

    expect(api.recordedConsents, _required);
    expect(api.recordedVersions, everyElement('1.0.0'));
    expect(session.user?.consentsComplete, isTrue);
  });
}

ElevatedButton _acceptButton(WidgetTester tester) {
  return tester
      .widget<ElevatedButton>(find.byKey(const Key('accept-consents')));
}

const _required = ['TERMS', 'PRIVACY', 'BUYER_RULES', 'NO_SIDE_DEAL'];

class _ConsentApiClient extends Fake implements ApiClient {
  final recordedConsents = <String>[];
  final recordedVersions = <String>[];

  @override
  Future<T> getJson<T>(
    String path,
    T Function(dynamic json) parser, {
    Map<String, dynamic>? queryParameters,
  }) async {
    if (path == '/api/v1/reference-data') return parser(_referenceData);
    return parser(_user(recordedConsents.length == _required.length));
  }

  @override
  Future<T> postJson<T>(
    String path,
    dynamic body,
    T Function(dynamic json) parser, {
    bool includeCsrf = false,
  }) async {
    if (path == '/api/v1/me/consents') {
      final map = (body as Map).cast<String, dynamic>();
      recordedConsents.add(map['consentType']!.toString());
      recordedVersions.add(map['version']!.toString());
    }
    return parser(const {});
  }
}

Map<String, dynamic> _user(bool complete) => {
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
      'acceptedConsents': complete ? _required : <String>[],
      'consentsComplete': complete,
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
