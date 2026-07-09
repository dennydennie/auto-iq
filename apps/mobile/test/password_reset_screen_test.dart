import 'package:autoiq_mobile/src/core/network/api_exception.dart';
import 'package:autoiq_mobile/src/models/app_user.dart';
import 'package:autoiq_mobile/src/repositories/auth_repository.dart';
import 'package:autoiq_mobile/src/screens/auth/password_reset_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

void main() {
  test('extracts reset token from pasted web reset links', () {
    expect(
      extractResetToken(
        'https://web-staging-1017.up.railway.app/auth/reset-password#token=abc123',
      ),
      'abc123',
    );
    expect(extractResetToken('raw-token'), 'raw-token');
    expect(extractResetToken('raw%token'), 'raw%token');
  });

  testWidgets('requests reset email and submits a new password with token',
      (tester) async {
    final repository = _RecordingAuthRepository();

    await tester.pumpWidget(
      Provider<AuthRepository>.value(
        value: repository,
        child: const MaterialApp(home: PasswordResetScreen()),
      ),
    );

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Account email'),
      'buyer@example.com',
    );
    await tester.tap(find.widgetWithText(ElevatedButton, 'Send reset link'));
    await tester.pump();

    expect(repository.forgotPasswordEmails, ['buyer@example.com']);
    expect(find.textContaining('Check your email'), findsOneWidget);

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Reset link or token'),
      'https://web.example.com/auth/reset-password#token=reset-token',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'New password'),
      'Password123',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Confirm password'),
      'Password123',
    );
    await tester.drag(find.byType(ListView), const Offset(0, -450));
    await tester.pump();
    await tester.tap(find.widgetWithText(ElevatedButton, 'Reset password'));
    await tester.pump();

    expect(repository.resetPasswordCalls, [
      const _ResetPasswordCall(token: 'reset-token', password: 'Password123'),
    ]);
    expect(find.textContaining('Password updated'), findsOneWidget);
  });
}

class _ResetPasswordCall {
  const _ResetPasswordCall({required this.token, required this.password});

  final String token;
  final String password;

  @override
  bool operator ==(Object other) {
    return other is _ResetPasswordCall &&
        other.token == token &&
        other.password == password;
  }

  @override
  int get hashCode => Object.hash(token, password);
}

class _RecordingAuthRepository implements AuthRepository {
  final forgotPasswordEmails = <String>[];
  final resetPasswordCalls = <_ResetPasswordCall>[];

  @override
  Future<void> forgotPassword(String email) async {
    forgotPasswordEmails.add(email);
  }

  @override
  Future<void> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    resetPasswordCalls.add(
      _ResetPasswordCall(token: token, password: newPassword),
    );
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
  Future<void> recordConsent(String consentType) {
    throw UnimplementedError();
  }

  @override
  Future<RegisterResult> register(RegisterInput input) {
    throw UnimplementedError();
  }

  @override
  Future<void> sendOtp({required String identifier, String? phone}) {
    throw ApiException(
      message: 'Not expected in this test',
      statusCode: 500,
    );
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
