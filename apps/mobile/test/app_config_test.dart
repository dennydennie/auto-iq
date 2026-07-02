import 'package:autoiq_mobile/src/core/config/app_config.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('uses the Railway staging API by default', () {
    expect(AppConfig.apiBaseUrl, 'https://api-staging-bdfe.up.railway.app');
    expect(
      AppConfig.apiLabel,
      'https://api-staging-bdfe.up.railway.app/api/v1',
    );
  });
}
