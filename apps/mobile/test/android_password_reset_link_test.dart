import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Android registers the Auto IQ password reset link', () {
    final manifest =
        File('android/app/src/main/AndroidManifest.xml').readAsStringSync();

    expect(manifest, contains('android:scheme="autoiq"'));
    expect(manifest, contains('android:host="reset-password"'));
    expect(manifest, contains('android.intent.category.BROWSABLE'));
    expect(manifest, contains('flutter_deeplinking_enabled'));
  });
}
