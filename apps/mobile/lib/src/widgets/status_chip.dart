import 'package:flutter/material.dart';

import '../../theme/app_colors.dart';
import '../../theme/app_tokens.dart';
import '../core/i18n/app_localizations.dart';

class StatusChip extends StatelessWidget {
  const StatusChip({
    super.key,
    required this.label,
  });

  final String label;

  @override
  Widget build(BuildContext context) {
    final displayLabel = humanizeStatus(label);
    final colors = _palette(label);
    final semanticLabel = AutoIqLocalizations.of(context).formatText(
      'statusLabel',
      {'status': displayLabel},
    );
    return Semantics(
      label: semanticLabel,
      excludeSemantics: true,
      child: Container(
        constraints: const BoxConstraints(
          minHeight: AppSizes.minimumTouchTarget,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: colors.$2,
          borderRadius: BorderRadius.circular(AppRadii.pill),
        ),
        child: Text(
          displayLabel,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: colors.$1,
          ),
        ),
      ),
    );
  }

  (Color, Color) _palette(String status) {
    switch (status) {
      case 'PUBLISHED':
      case 'APPROVED':
      case 'COMPLETED':
      case 'SENT':
        return (AppColors.verifiedText, AppColors.verifiedSoft);
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      case 'REQUESTED':
      case 'CONFIRMED':
        return (AppColors.ink900, AppColors.amberSoft);
      case 'CHANGES_REQUESTED':
      case 'RESCHEDULED':
      case 'WATCH':
        return (AppColors.pendingText, AppColors.pendingSoft);
      case 'DECLINED':
      case 'REJECTED':
      case 'CANCELLED':
      case 'FAILED':
      case 'NO_SHOW':
      case 'FAIL':
        return (AppColors.reject, AppColors.rejectSoft);
      default:
        return (AppColors.ink700, AppColors.ink100);
    }
  }
}

String humanizeStatus(String status) {
  final words = status.trim().replaceAll('_', ' ').toLowerCase().split(' ');
  final normalized = words.where((word) => word.isNotEmpty).join(' ');
  return _capitalize(normalized);
}

String _capitalize(String value) {
  if (value.isEmpty) return value;
  return '${value[0].toUpperCase()}${value.substring(1)}';
}
