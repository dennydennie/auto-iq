import 'dart:async';

import 'package:sentry_flutter/sentry_flutter.dart';

enum MobileFunnelEvent {
  catalogueSearch('catalogue_search'),
  quoteSubmitted('quote_submitted'),
  viewingSubmitted('viewing_submitted'),
  sellerStepCompleted('seller_step_completed'),
  uploadFailed('upload_failed'),
  inspectionSubmitted('inspection_submitted'),
  vehicleRequestSubmitted('vehicle_request_submitted'),
  validationFailed('validation_failed'),
  flowAbandoned('flow_abandoned'),
  contentLoaded('content_loaded');

  const MobileFunnelEvent(this.value);

  final String value;
}

abstract interface class MobileAnalytics {
  void record(
    MobileFunnelEvent event, {
    Map<String, Object?> attributes = const {},
  });
}

class SentryMobileAnalytics implements MobileAnalytics {
  const SentryMobileAnalytics();

  @override
  void record(
    MobileFunnelEvent event, {
    Map<String, Object?> attributes = const {},
  }) {
    unawaited(
      Sentry.addBreadcrumb(
        Breadcrumb(
          category: 'mobile.funnel',
          type: 'user',
          message: event.value,
          data: safeMobileAttributes(attributes),
          level: SentryLevel.info,
        ),
      ),
    );
  }
}

Map<String, Object?> safeMobileAttributes(
  Map<String, Object?> attributes,
) {
  const allowed = {
    'filter_count',
    'has_query',
    'result_count',
    'payment_plan',
    'step',
    'file_kind',
    'error_code',
    'finding_count',
    'flow',
    'surface',
    'duration_ms',
    'validation_count',
    'reason',
  };
  return Map.unmodifiable(
    Map.fromEntries(
      attributes.entries.where((entry) => allowed.contains(entry.key)),
    ),
  );
}
