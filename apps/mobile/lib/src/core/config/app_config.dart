class AppConfig {
  AppConfig._();

  static const String _defaultApiBaseUrl =
      'https://api-staging-bdfe.up.railway.app';
  static const String _rawApiBaseUrl = String.fromEnvironment(
    'AUTO_IQ_API_BASE_URL',
  );

  static String get apiBaseUrl {
    final value = _rawApiBaseUrl.isNotEmpty
        ? _rawApiBaseUrl
        : _defaultApiBaseUrl;
    return _normalizeOrigin(value);
  }

  static String get apiLabel => '$apiBaseUrl/api/v1';

  static String _normalizeOrigin(String value) {
    final trimmed = value.trim().replaceAll(RegExp(r'/+$'), '');
    if (trimmed.endsWith('/api/v1')) {
      return trimmed.substring(0, trimmed.length - '/api/v1'.length);
    }
    return trimmed;
  }
}
