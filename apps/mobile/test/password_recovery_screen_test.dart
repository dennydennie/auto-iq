import 'package:autoiq_mobile/src/models/app_user.dart';
import 'package:autoiq_mobile/src/repositories/auth_repository.dart';
import 'package:autoiq_mobile/src/screens/auth/forgot_password_screen.dart';
import 'package:autoiq_mobile/src/screens/auth/reset_password_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

void main() {
  testWidgets('requests a mobile reset code and opens code entry',
      (tester) async {
    final repository = _RecordingAuthRepository();
    await tester.pumpWidget(
      Provider<AuthRepository>.value(
        value: repository,
        child: const MaterialApp(home: ForgotPasswordScreen()),
      ),
    );

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Email address'),
      'Buyer@Example.com',
    );
    await tester.tap(find.widgetWithText(ElevatedButton, 'Send reset code'));
    await tester.pumpAndSettle();

    expect(repository.forgottenEmail, 'Buyer@Example.com');
    expect(find.text('Enter reset code'), findsOneWidget);
    expect(find.widgetWithText(TextFormField, 'Email address'), findsOneWidget);
    expect(find.widgetWithText(TextFormField, 'Reset code'), findsOneWidget);
  });

  testWidgets('resets the password from the native token', (tester) async {
    final repository = _RecordingAuthRepository();
    await tester.pumpWidget(
      Provider<AuthRepository>.value(
        value: repository,
        child: const MaterialApp(
          home: ResetPasswordScreen(token: 'reset-token'),
        ),
      ),
    );

    await tester.enterText(
      find.widgetWithText(TextFormField, 'New password'),
      'Secure123',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Confirm password'),
      'Secure123',
    );
    await tester.tap(find.widgetWithText(ElevatedButton, 'Reset password'));
    await tester.pumpAndSettle();

    expect(repository.resetToken, 'reset-token');
    expect(repository.resetPasswordValue, 'Secure123');
    expect(find.text('Password updated'), findsOneWidget);
  });

  testWidgets('resets the password from a mobile email code', (tester) async {
    final repository = _RecordingAuthRepository();
    await tester.pumpWidget(
      Provider<AuthRepository>.value(
        value: repository,
        child: const MaterialApp(
          home: ResetPasswordScreen(email: 'Buyer@Example.com'),
        ),
      ),
    );

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Reset code'),
      '123456',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'New password'),
      'Secure123',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Confirm password'),
      'Secure123',
    );
    await tester.tap(find.widgetWithText(ElevatedButton, 'Reset password'));
    await tester.pumpAndSettle();

    expect(repository.resetEmail, 'Buyer@Example.com');
    expect(repository.resetCode, '123456');
    expect(repository.resetPasswordValue, 'Secure123');
    expect(find.text('Password updated'), findsOneWidget);
  });
}

class _RecordingAuthRepository implements AuthRepository {
  String? forgottenEmail;
  String? resetCode;
  String? resetEmail;
  String? resetToken;
  String? resetPasswordValue;

  @override
  Future<void> forgotPassword(String email) async {
    forgottenEmail = email;
  }

  @override
  Future<void> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    resetToken = token;
    resetPasswordValue = newPassword;
  }

  @override
  Future<void> resetPasswordWithCode({
    required String email,
    required String code,
    required String newPassword,
  }) async {
    resetEmail = email;
    resetCode = code;
    resetPasswordValue = newPassword;
  }

  @override
  Future<void> login({required String identifier, required String password}) =>
      throw UnimplementedError();

  @override
  Future<void> logout() => throw UnimplementedError();

  @override
  Future<AppUser> me() => throw UnimplementedError();

  @override
  Future<void> recordConsent(String consentType) => throw UnimplementedError();

  @override
  Future<RegisterResult> register(RegisterInput input) =>
      throw UnimplementedError();

  @override
  Future<void> sendOtp({required String identifier, String? phone}) =>
      throw UnimplementedError();

  @override
  Future<AppUser> updateProfile(Map<String, dynamic> payload) =>
      throw UnimplementedError();

  @override
  Future<void> verifyOtp({
    required String identifier,
    required String code,
    String? phone,
  }) =>
      throw UnimplementedError();
}
