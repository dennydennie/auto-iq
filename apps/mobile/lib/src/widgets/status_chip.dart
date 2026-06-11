import 'package:flutter/material.dart';

import '../../theme/app_colors.dart';

class StatusChip extends StatelessWidget {
  const StatusChip({
    super.key,
    required this.label,
  });

  final String label;

  @override
  Widget build(BuildContext context) {
    final colors = _palette(label);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: colors.$2,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label.replaceAll('_', ' '),
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: colors.$1,
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
        return (AppColors.verified, AppColors.verifiedSoft);
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      case 'REQUESTED':
      case 'CONFIRMED':
        return (AppColors.amberDark, AppColors.amberSoft);
      case 'CHANGES_REQUESTED':
      case 'RESCHEDULED':
      case 'WATCH':
        return (AppColors.ember, AppColors.pendingSoft);
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
