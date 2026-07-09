import 'package:autoiq_mobile/src/core/network/api_exception.dart';
import 'package:autoiq_mobile/src/models/app_user.dart';
import 'package:autoiq_mobile/src/models/reference_data.dart';
import 'package:autoiq_mobile/src/repositories/auth_repository.dart';
import 'package:autoiq_mobile/src/state/session_controller.dart';
import 'package:autoiq_mobile/src/screens/auth/auth_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

void main() {
  testWidgets('shows OTP entry when login requires verification',
      (tester) async {
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider<SessionController>.value(
            value: _PendingVerificationSession(),
          ),
          Provider<AuthRepository>.value(value: _UnusedAuthRepository()),
        ],
        child: const MaterialApp(home: AuthScreen()),
      ),
    );

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Email or phone'),
      'henrygowas@gmail.com',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Password'),
      'password-123',
    );
    await tester.tap(find.widgetWithText(ElevatedButton, 'Sign in'));
    await tester.pump();
    await tester.pump();

    expect(find.text('Enter the 6-digit code'), findsOneWidget);
    expect(find.widgetWithText(TextField, 'Verification code'), findsOneWidget);
    expect(find.textContaining('SMS and email'), findsWidgets);
  });
}

class _PendingVerificationSession extends ChangeNotifier
    implements SessionController {
  @override
  String? get errorMessage => null;

  @override
  bool get isAuthenticated => false;

  @override
  bool get isBooting => false;

  @override
  bool get isBusy => false;

  @override
  ReferenceDataSet? get referenceData => null;

  @override
  AppUser? get user => null;

  @override
  Future<void> bootstrap() async {}

  @override
  void clearError() {}

  @override
  Future<void> completeRequiredConsents() async {}

  @override
  Future<void> login({
    required String identifier,
    required String password,
  }) async {
    throw ApiException(
      code: 'OTP_REQUIRED',
      message: 'Verify your account with the code sent by SMS and email.',
      statusCode: 401,
    );
  }

  @override
  Future<void> logout() async {}

  @override
  Future<void> refreshProfile() async {}

  @override
  Future<void> updateProfile(Map<String, dynamic> payload) async {}
}

class _UnusedAuthRepository implements AuthRepository {
  @override
  Future<void> login({required String identifier, required String password}) {
    throw UnimplementedError();
  }

  @override
  Future<AppUser> me() {
    throw UnimplementedError();
  }

  @override
  Future<void> logout() {
    throw UnimplementedError();
  }

  @override
  Future<void> recordConsent(String consentType) {
    throw UnimplementedError();
  }

  @override
  Future<RegisterResult> register(RegisterInput input) {
    throw UnimplementedError();
  }

  @override
  Future<void> sendOtp({required String identifier, String? phone}) {
    return Future<void>.value();
  }

  @override
  Future<void> forgotPassword(String email) {
    throw UnimplementedError();
  }

  @override
  Future<void> resetPassword({
    required String token,
    required String newPassword,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<AppUser> updateProfile(Map<String, dynamic> payload) {
    throw UnimplementedError();
  }

  @override
  Future<void> verifyOtp({
    required String identifier,
    required String code,
    String? phone,
  }) {
    throw UnimplementedError();
  }
}
