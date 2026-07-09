import 'package:autoiq_mobile/src/core/config/app_config.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('uses a local API by default for test and desktop development', () {
    expect(AppConfig.apiBaseUrl, 'http://localhost:4000');
    expect(AppConfig.apiLabel, 'http://localhost:4000/api/v1');
  });
}
