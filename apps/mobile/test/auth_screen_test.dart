import 'package:autoiq_mobile/src/core/network/api_exception.dart';
import 'package:autoiq_mobile/src/models/app_user.dart';
import 'package:autoiq_mobile/src/models/reference_data.dart';
import 'package:autoiq_mobile/src/repositories/auth_repository.dart';
import 'package:autoiq_mobile/src/state/session_controller.dart';
import 'package:autoiq_mobile/src/screens/auth/auth_screen.dart';
import 'package:autoiq_mobile/src/screens/auth/otp_verification_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

void main() {
  testWidgets('opens the native forgot password screen', (tester) async {
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

    await tester.tap(find.text('Forgot password?'));
    await tester.pumpAndSettle();

    expect(find.text('Recover your account'), findsOneWidget);
    expect(find.textContaining('browser'), findsNothing);
  });

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
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text('Enter the 6-digit code'), findsOneWidget);
    expect(find.widgetWithText(TextField, 'OTP code'), findsOneWidget);
    expect(find.textContaining('Resend in'), findsOneWidget);
  });

  testWidgets('shows and fills an on-screen OTP for the configured test buyer',
      (tester) async {
    await tester.pumpWidget(
      Provider<AuthRepository>.value(
        value: _UnusedAuthRepository(testOtpCode: '654321'),
        child: const MaterialApp(
          home: OtpVerificationScreen(
            identifier: 'henrygowas@gmail.com',
          ),
        ),
      ),
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 1));

    expect(find.text('Testing code'), findsOneWidget);
    expect(find.text('654321'), findsOneWidget);
    expect(
      find.text('Test code generated. No SMS credit was used.'),
      findsOneWidget,
    );

    await tester.tap(find.widgetWithText(TextButton, 'Use code'));
    await tester.pump();

    final codeField = tester.widget<TextField>(find.byType(TextField));
    expect(codeField.controller?.text, '654321');
    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('public registration offers Buyer and Seller but not Inspector',
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

    await tester.tap(find.text('Register'));
    await tester.pumpAndSettle();
    final rolePicker = find.byType(DropdownButtonFormField<String>);
    await tester.ensureVisible(rolePicker);
    await tester.tap(rolePicker);
    await tester.pumpAndSettle();

    expect(find.text('Browse and buy vehicles'), findsWidgets);
    expect(find.text('List and sell a vehicle'), findsOneWidget);
    expect(find.textContaining('Inspector'), findsNothing);
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
  Future<void> requestAccountDeletion() async {}

  @override
  Future<void> refreshProfile() async {}

  @override
  Future<void> updateProfile(Map<String, dynamic> payload) async {}
}

class _UnusedAuthRepository implements AuthRepository {
  _UnusedAuthRepository({this.testOtpCode});

  final String? testOtpCode;

  @override
  Future<void> forgotPassword(String email) {
    throw UnimplementedError();
  }

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
  Future<void> requestAccountDeletion() {
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
  Future<void> resetPassword({
    required String token,
    required String newPassword,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<void> resetPasswordWithCode({
    required String email,
    required String code,
    required String newPassword,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<String?> sendOtp({required String identifier, String? phone}) async =>
      testOtpCode;

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
