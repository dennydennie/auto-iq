class MobileSentryConfig {
  const MobileSentryConfig({
    required this.dsn,
    required this.environment,
    required this.release,
  });

  static const fromEnvironment = MobileSentryConfig(
    dsn: String.fromEnvironment('AUTO_IQ_SENTRY_DSN'),
    environment: String.fromEnvironment(
      'AUTO_IQ_SENTRY_ENVIRONMENT',
      defaultValue: 'development',
    ),
    release: String.fromEnvironment(
      'AUTO_IQ_SENTRY_RELEASE',
      defaultValue: 'mobile@local',
    ),
  );

  final String dsn;
  final String environment;
  final String release;

  bool get isEnabled => dsn.trim().isNotEmpty;
}
