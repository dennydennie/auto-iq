import 'dart:io';

class AppConfig {
  AppConfig._();

  static const String _rawApiBaseUrl =
      String.fromEnvironment('AUTO_IQ_API_BASE_URL');

  static String get apiBaseUrl {
    if (_rawApiBaseUrl.isNotEmpty) {
      return _normalizeOrigin(_rawApiBaseUrl);
    }
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:4000';
    }
    return 'http://localhost:4000';
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
