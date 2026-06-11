import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class ScoreGauge extends StatelessWidget {
  final int score;
  final double size;
  final bool light;

  const ScoreGauge(
      {super.key, required this.score, this.size = 80, this.light = false});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(painter: _GaugePainter(score: score, light: light)),
    );
  }
}

class _GaugePainter extends CustomPainter {
  final int score;
  final bool light;

  _GaugePainter({required this.score, required this.light});

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final r = cx - 8;

    final trackColor =
        light ? Colors.white.withValues(alpha: 0.15) : AppColors.ink100;
    final arcColor = score >= 80
        ? AppColors.verified
        : score >= 60
            ? AppColors.amber
            : AppColors.reject;
    final textColor = light ? Colors.white : AppColors.ink900;
    final subColor =
        light ? Colors.white.withValues(alpha: 0.5) : AppColors.ink400;

    // Track
    canvas.drawCircle(
        Offset(cx, cy),
        r,
        Paint()
          ..color = trackColor
          ..style = PaintingStyle.stroke
          ..strokeWidth = 6);

    // Arc
    final sweep = (score / 100) * 2 * math.pi;
    canvas.drawArc(
      Rect.fromCircle(center: Offset(cx, cy), radius: r),
      -math.pi / 2,
      sweep,
      false,
      Paint()
        ..color = arcColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = 6
        ..strokeCap = StrokeCap.round,
    );

    // Score text
    final scoreTp = TextPainter(
      text: TextSpan(
        text: '$score',
        style: TextStyle(
          fontFamily: 'monospace',
          fontSize: size.width * 0.26,
          fontWeight: FontWeight.w700,
          color: textColor,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    scoreTp.paint(
        canvas,
        Offset(cx - scoreTp.width / 2,
            cy - scoreTp.height / 2 - size.height * 0.05));

    // "/100" label
    final subTp = TextPainter(
      text: TextSpan(
        text: '/100',
        style: TextStyle(
          fontFamily: 'monospace',
          fontSize: size.width * 0.14,
          color: subColor,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    subTp.paint(canvas, Offset(cx - subTp.width / 2, cy + size.height * 0.12));
  }

  @override
  bool shouldRepaint(_GaugePainter old) =>
      old.score != score || old.light != light;
}
