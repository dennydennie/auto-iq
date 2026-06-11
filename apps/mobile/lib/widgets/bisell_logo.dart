import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class BiSellLogo extends StatelessWidget {
  final double size;
  const BiSellLogo({super.key, this.size = 32});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: size,
          height: size,
          child: CustomPaint(painter: _HexPainter()),
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'BiSell.',
              style: TextStyle(
                fontSize: size * 0.60,
                fontWeight: FontWeight.w800,
                color: AppColors.ink900,
                letterSpacing: -0.5,
                height: 1,
              ),
            ),
            Text(
              'AUTO·IQ',
              style: TextStyle(
                fontFamily: 'monospace',
                fontSize: size * 0.28,
                fontWeight: FontWeight.w700,
                color: AppColors.amber,
                letterSpacing: 2,
                height: 1.2,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _HexPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final r = size.width / 2 - 1;

    Path hexPath(double radius) {
      final p = Path();
      for (int i = 0; i < 6; i++) {
        final a = (i * 60 - 90) * math.pi / 180;
        final x = cx + radius * math.cos(a);
        final y = cy + radius * math.sin(a);
        if (i == 0) {
          p.moveTo(x, y);
        } else {
          p.lineTo(x, y);
        }
      }
      p.close();
      return p;
    }

    canvas.drawPath(hexPath(r), Paint()..color = AppColors.amber);
    canvas.drawPath(hexPath(r * 0.72), Paint()..color = AppColors.ink900);

    final tp = TextPainter(
      text: const TextSpan(
        text: 'B',
        style: TextStyle(
          color: AppColors.amber,
          fontSize: 13,
          fontWeight: FontWeight.w900,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    tp.paint(canvas, Offset(cx - tp.width / 2, cy - tp.height / 2));
  }

  @override
  bool shouldRepaint(_HexPainter old) => false;
}
