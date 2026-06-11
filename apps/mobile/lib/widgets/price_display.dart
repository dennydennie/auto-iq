import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class PriceDisplay extends StatelessWidget {
  final String amount;
  final double fontSize;
  final Color color;

  const PriceDisplay({
    super.key,
    required this.amount,
    this.fontSize = 26,
    this.color = AppColors.ink900,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.baseline,
      textBaseline: TextBaseline.alphabetic,
      children: [
        Text(
          'USD ',
          style: TextStyle(
            fontFamily: 'monospace',
            fontSize: fontSize * 0.45,
            fontWeight: FontWeight.w600,
            color: color.withValues(alpha: 0.55),
          ),
        ),
        Text(
          amount,
          style: TextStyle(
            fontFamily: 'monospace',
            fontSize: fontSize,
            fontWeight: FontWeight.w800,
            color: color,
          ),
        ),
      ],
    );
  }
}
