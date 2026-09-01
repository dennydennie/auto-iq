import 'package:flutter/material.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import 'src/app.dart';
import 'src/core/observability/sentry_config.dart';
import 'src/core/network/api_client.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final apiClient = await ApiClient.create();
  const sentry = MobileSentryConfig.fromEnvironment;
  if (!sentry.isEnabled) {
    runApp(AutoIqApp(apiClient: apiClient));
    return;
  }

  await SentryFlutter.init(
    (options) {
      options
        ..dsn = sentry.dsn
        ..environment = sentry.environment
        ..release = sentry.release
        ..sendDefaultPii = false
        ..maxRequestBodySize = MaxRequestBodySize.never
        ..tracesSampleRate = 0.1;
    },
    appRunner: () => runApp(AutoIqApp(apiClient: apiClient)),
  );
}
