import 'package:flutter/foundation.dart';

class AppConfig {
  AppConfig._();

  static const String _rawApiBaseUrl =
      String.fromEnvironment('AUTO_IQ_API_BASE_URL');

  static String get apiBaseUrl {
    if (_rawApiBaseUrl.isNotEmpty) {
      final normalized = _normalizeOrigin(_rawApiBaseUrl);
      _assertProductionScheme(normalized);
      return normalized;
    }
    return 'https://api-staging-bdfe.up.railway.app';
  }

  static String get apiLabel => '$apiBaseUrl/api/v1';

  /// True when the app is running against a non-loopback, non-HTTPS origin.
  /// Callers can gate UI cues (e.g. a red banner) on this.
  static bool get isInsecureRemote {
    final url = apiBaseUrl;
    if (url.startsWith('https://')) return false;
    // Loopback and Android emulator loopback are fine for dev.
    if (url.contains('localhost') ||
        url.contains('127.0.0.1') ||
        url.contains('10.0.2.2')) {
      return false;
    }
    return true;
  }

  static String _normalizeOrigin(String value) {
    final trimmed = value.trim().replaceAll(RegExp(r'/+$'), '');
    if (trimmed.endsWith('/api/v1')) {
      return trimmed.substring(0, trimmed.length - '/api/v1'.length);
    }
    return trimmed;
  }

  static void _assertProductionScheme(String url) {
    // In release builds, refuse to talk to a non-HTTPS remote origin. iOS ATS
    // and Android's default network security config would silently block it
    // anyway — better to fail loud than to ship a build that can't reach the
    // API.
    if (kReleaseMode &&
        !url.startsWith('https://') &&
        !url.contains('localhost') &&
        !url.contains('127.0.0.1') &&
        !url.contains('10.0.2.2')) {
      throw StateError(
        'AUTO_IQ_API_BASE_URL must use https:// in release builds. Got: $url',
      );
    }
  }
}
