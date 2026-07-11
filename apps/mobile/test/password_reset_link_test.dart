import 'dart:async';

import 'package:autoiq_mobile/src/core/navigation/password_reset_link.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('reads the reset token from the native link fragment', () {
    final uri = Uri.parse('autoiq://reset-password#token=abc_123-XYZ');

    expect(passwordResetToken(uri), 'abc_123-XYZ');
  });

  test('rejects non-native reset links', () {
    final uri = Uri.parse(
      'https://web.example.com/auth/reset-password#token=abc_123-XYZ',
    );

    expect(passwordResetToken(uri), isNull);
  });

  test('rejects native reset links without a token', () {
    expect(passwordResetToken(Uri.parse('autoiq://reset-password')), isNull);
  });

  testWidgets('opens the native reset screen for an incoming link',
      (tester) async {
    final links = StreamController<Uri>();
    final navigatorKey = GlobalKey<NavigatorState>();
    addTearDown(links.close);

    await tester.pumpWidget(
      MaterialApp(
        navigatorKey: navigatorKey,
        home: PasswordResetLinkListener(
          source: _FakeLinkSource(links.stream),
          navigatorKey: navigatorKey,
          child: const Scaffold(body: Text('Sign in')),
        ),
      ),
    );

    links.add(Uri.parse('autoiq://reset-password#token=reset-token'));
    await tester.pumpAndSettle();

    expect(find.text('Choose a new password'), findsOneWidget);
  });
}

class _FakeLinkSource implements PasswordResetLinkSource {
  _FakeLinkSource(this.uriLinkStream);

  @override
  final Stream<Uri> uriLinkStream;

  @override
  Future<Uri?> getInitialLink() async => null;
}
