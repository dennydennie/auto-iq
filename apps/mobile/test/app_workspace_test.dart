import 'package:autoiq_mobile/src/app.dart';
import 'package:autoiq_mobile/src/core/network/api_client.dart';
import 'package:autoiq_mobile/src/core/network/api_exception.dart';
import 'package:autoiq_mobile/src/models/app_user.dart';
import 'package:autoiq_mobile/src/models/reference_data.dart';
import 'package:autoiq_mobile/src/repositories/inspector_repository.dart';
import 'package:autoiq_mobile/src/state/session_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

void main() {
  testWidgets('multi-role users choose buyer, seller, or inspector workspace',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(home: AuthenticatedWorkspace(user: _user)),
    );

    expect(find.text('Choose your workspace'), findsOneWidget);
    expect(find.byKey(const Key('workspace-buyer')), findsOneWidget);
    expect(find.byKey(const Key('workspace-seller')), findsOneWidget);
    expect(find.byKey(const Key('workspace-inspector')), findsOneWidget);
  });

  testWidgets('inspector workspace opens assigned mobile inspection tasks',
      (tester) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider<SessionController>.value(
            value: _WorkspaceSession(),
          ),
          Provider<InspectorRepository>.value(
            value: InspectorRepository(_InspectorApiClient()),
          ),
        ],
        child: MaterialApp(home: AuthenticatedWorkspace(user: _user)),
      ),
    );

    await tester.tap(find.byKey(const Key('workspace-inspector')));
    await tester.pumpAndSettle();

    expect(find.text('Assigned inspections'), findsOneWidget);
    expect(find.text('2021 Honda Vezel'), findsOneWidget);
    expect(find.text('Open task'), findsOneWidget);
  });
}

final _user = AppUser(
  id: 'user-1',
  fullName: 'Tariro Moyo',
  email: 'tariro@example.com',
  phone: '+263771234567',
  status: 'ACTIVE',
  roles: const ['BUYER', 'SELLER', 'INSPECTOR'],
  phoneVerified: true,
  emailVerified: true,
  city: 'Harare',
  buyerProfile: null,
  sellerProfile: null,
);

class _InspectorApiClient extends Fake implements ApiClient {
  @override
  Future<T> getJson<T>(
    String path,
    T Function(dynamic json) parser, {
    Map<String, dynamic>? queryParameters,
  }) async {
    return parser({
      'data': [_task],
      'meta': const {},
    });
  }
}

class _WorkspaceSession extends ChangeNotifier implements SessionController {
  @override
  ApiException? get bootstrapError => null;

  @override
  String? get errorMessage => null;

  @override
  bool get isAuthenticated => true;

  @override
  bool get isBooting => false;

  @override
  bool get isBusy => false;

  @override
  bool get isSessionUnavailable => false;

  @override
  List<String> get requiredConsents => const [];

  @override
  ReferenceDataSet? get referenceData => null;

  @override
  AppUser get user => _user;

  @override
  Future<void> bootstrap() async {}

  @override
  void clearError() {}

  @override
  Future<void> completeRequiredConsents(Set<String> acceptedConsents) async {}

  @override
  Future<void> login({
    required String identifier,
    required String password,
  }) async {}

  @override
  Future<void> logout() async {}

  @override
  Future<void> refreshProfile() async {}

  @override
  Future<void> requestAccountDeletion() async {}

  @override
  Future<void> updateProfile(Map<String, dynamic> payload) async {}
}

const _task = {
  'id': 'task-1',
  'listingId': 'listing-1',
  'listingSnapshot': {
    'year': 2021,
    'make': 'Honda',
    'model': 'Vezel',
    'coverImageUrl': null,
    'city': 'Harare',
  },
  'status': 'SCHEDULED',
  'scheduledAt': '2026-08-15T09:00:00.000Z',
  'completedAt': null,
};
