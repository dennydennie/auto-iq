import 'package:flutter/material.dart';

abstract final class AppSpacing {
  static const xxs = 4.0;
  static const xs = 8.0;
  static const sm = 12.0;
  static const md = 16.0;
  static const lg = 24.0;
  static const xl = 32.0;
  static const xxl = 48.0;
}

abstract final class AppRadii {
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 24.0;
  static const pill = 999.0;
}

abstract final class AppBreakpoints {
  static const compact = 600.0;
  static const expanded = 900.0;
  static const formMaxWidth = 680.0;
  static const contentMaxWidth = 1120.0;
}

abstract final class AppSizes {
  static const minimumTouchTarget = 48.0;
  static const navigationRailWidth = 240.0;
}

abstract final class AppMotion {
  static const fast = Duration(milliseconds: 150);
  static const standard = Duration(milliseconds: 250);
}

EdgeInsets adaptivePageInsets(double width) {
  if (width >= AppBreakpoints.expanded) {
    return const EdgeInsets.all(AppSpacing.xl);
  }
  if (width >= AppBreakpoints.compact) {
    return const EdgeInsets.all(AppSpacing.lg);
  }
  return const EdgeInsets.all(AppSpacing.md);
}
