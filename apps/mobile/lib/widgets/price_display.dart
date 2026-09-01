import 'package:flutter/material.dart';
import '../src/core/i18n/app_localizations.dart';
import '../theme/app_colors.dart';
import '../src/core/i18n/app_formatters.dart';

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
    final value = double.tryParse(amount.replaceAll(',', '')) ?? 0;
    final formatted = AppFormatters.decimal(context, value);
    final semanticLabel = AutoIqLocalizations.of(context).formatText(
      'priceSemanticLabel',
      {'amount': formatted},
    );
    return Semantics(
      label: semanticLabel,
      excludeSemantics: true,
      child: Wrap(
        crossAxisAlignment: WrapCrossAlignment.end,
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
            formatted,
            style: TextStyle(
              fontFamily: 'monospace',
              fontSize: fontSize,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
