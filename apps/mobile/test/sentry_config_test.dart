import 'package:autoiq_mobile/src/core/observability/sentry_config.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Sentry stays disabled when no DSN is supplied', () {
    const config = MobileSentryConfig(
      dsn: '',
      environment: 'test',
      release: 'mobile@test',
    );
    expect(config.isEnabled, isFalse);
  });

  test('Sentry configuration keeps environment and release tags', () {
    const config = MobileSentryConfig(
      dsn: 'https://public@example.ingest.sentry.io/1',
      environment: 'staging',
      release: 'mobile@abc123',
    );
    expect(config.isEnabled, isTrue);
    expect(config.environment, 'staging');
    expect(config.release, 'mobile@abc123');
  });
}
