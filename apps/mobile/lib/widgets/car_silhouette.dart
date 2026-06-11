import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

enum CarType { sedan, suv, hatch, bakkie }

class CarSilhouette extends StatelessWidget {
  final CarType type;
  final Color color;
  final Color accent;
  final double width;
  final bool showShadow;

  const CarSilhouette({
    super.key,
    this.type = CarType.sedan,
    this.color = AppColors.ink700,
    this.accent = AppColors.amber,
    this.width = 200,
    this.showShadow = true,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      height: width * 0.39,
      child: CustomPaint(
        painter: _CarPainter(
            type: type, color: color, accent: accent, showShadow: showShadow),
      ),
    );
  }
}

class _CarPainter extends CustomPainter {
  final CarType type;
  final Color color;
  final Color accent;
  final bool showShadow;

  _CarPainter(
      {required this.type,
      required this.color,
      required this.accent,
      required this.showShadow});

  @override
  void paint(Canvas canvas, Size size) {
    final double sx = size.width / 410;
    final double sy = size.height / 160;

    canvas.save();
    canvas.scale(sx, sy);

    // Shadow
    if (showShadow) {
      final shadowPaint = Paint()
        ..color = Colors.black.withValues(alpha: 0.18)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6);
      canvas.drawOval(
        Rect.fromCenter(center: const Offset(205, 150), width: 340, height: 14),
        shadowPaint,
      );
    }

    // Body
    final bodyPaint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    final bodyPath = _getBodyPath(type);
    canvas.drawPath(bodyPath, bodyPaint);

    // Accent overlay
    final accentPaint = Paint()
      ..color = accent.withValues(alpha: 0.13)
      ..style = PaintingStyle.fill;
    canvas.drawPath(bodyPath, accentPaint);

    // Window
    final windowPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.18)
      ..style = PaintingStyle.fill;
    canvas.drawPath(_getWindowPath(type), windowPaint);

    // Headlight
    final hlPaint = Paint()..color = accent;
    canvas.drawOval(
        Rect.fromCenter(center: _headlightCenter(type), width: 16, height: 10),
        hlPaint);

    // Wheels
    final wheelPaint = Paint()..color = const Color(0xFF111827);
    final hubPaint = Paint()..color = const Color(0xFF4B5563);
    for (final cx in _wheelCenters(type)) {
      canvas.drawCircle(Offset(cx, 132), 16, wheelPaint);
      canvas.drawCircle(Offset(cx, 132), 7, hubPaint);
    }

    canvas.restore();
  }

  Path _getBodyPath(CarType t) {
    final p = Path();
    switch (t) {
      case CarType.sedan:
        p.moveTo(30, 130);
        p.lineTo(60, 130);
        p.quadraticBezierTo(70, 95, 95, 90);
        p.lineTo(150, 88);
        p.lineTo(170, 70);
        p.quadraticBezierTo(185, 60, 215, 60);
        p.lineTo(290, 64);
        p.quadraticBezierTo(310, 66, 330, 90);
        p.lineTo(370, 95);
        p.quadraticBezierTo(380, 98, 380, 110);
        p.lineTo(380, 130);
        p.lineTo(350, 130);
        p.quadraticBezierTo(345, 145, 330, 145);
        p.quadraticBezierTo(315, 145, 310, 130);
        p.lineTo(100, 130);
        p.quadraticBezierTo(95, 145, 80, 145);
        p.quadraticBezierTo(65, 145, 60, 130);
        p.close();
      case CarType.suv:
        p.moveTo(28, 132);
        p.lineTo(60, 132);
        p.quadraticBezierTo(68, 96, 92, 90);
        p.lineTo(132, 90);
        p.lineTo(155, 60);
        p.quadraticBezierTo(170, 50, 200, 50);
        p.lineTo(300, 52);
        p.quadraticBezierTo(322, 54, 345, 88);
        p.lineTo(378, 96);
        p.quadraticBezierTo(388, 100, 388, 116);
        p.lineTo(388, 132);
        p.lineTo(355, 132);
        p.quadraticBezierTo(350, 148, 332, 148);
        p.quadraticBezierTo(314, 148, 309, 132);
        p.lineTo(100, 132);
        p.quadraticBezierTo(95, 148, 78, 148);
        p.quadraticBezierTo(60, 148, 55, 132);
        p.close();
      case CarType.hatch:
        p.moveTo(40, 130);
        p.lineTo(65, 130);
        p.quadraticBezierTo(72, 96, 100, 90);
        p.lineTo(150, 90);
        p.lineTo(175, 64);
        p.quadraticBezierTo(190, 56, 220, 56);
        p.lineTo(295, 60);
        p.quadraticBezierTo(315, 64, 326, 90);
        p.lineTo(350, 100);
        p.quadraticBezierTo(360, 105, 358, 124);
        p.lineTo(358, 130);
        p.lineTo(335, 130);
        p.quadraticBezierTo(330, 144, 315, 144);
        p.quadraticBezierTo(300, 144, 295, 130);
        p.lineTo(100, 130);
        p.quadraticBezierTo(95, 144, 80, 144);
        p.quadraticBezierTo(65, 144, 60, 130);
        p.close();
      case CarType.bakkie:
        p.moveTo(22, 132);
        p.lineTo(60, 132);
        p.quadraticBezierTo(68, 96, 92, 90);
        p.lineTo(145, 90);
        p.lineTo(165, 65);
        p.quadraticBezierTo(180, 56, 210, 56);
        p.lineTo(240, 58);
        p.quadraticBezierTo(258, 60, 264, 80);
        p.lineTo(266, 95);
        p.lineTo(390, 95);
        p.quadraticBezierTo(395, 95, 395, 102);
        p.lineTo(395, 132);
        p.lineTo(360, 132);
        p.quadraticBezierTo(355, 148, 338, 148);
        p.quadraticBezierTo(320, 148, 315, 132);
        p.lineTo(100, 132);
        p.quadraticBezierTo(95, 148, 78, 148);
        p.quadraticBezierTo(60, 148, 55, 132);
        p.close();
    }
    return p;
  }

  Path _getWindowPath(CarType t) {
    final p = Path();
    switch (t) {
      case CarType.sedan:
        p.moveTo(175, 72);
        p.quadraticBezierTo(185, 64, 215, 64);
        p.lineTo(285, 68);
        p.quadraticBezierTo(300, 70, 315, 88);
        p.lineTo(180, 88);
        p.close();
      case CarType.suv:
        p.moveTo(160, 63);
        p.quadraticBezierTo(172, 53, 200, 53);
        p.lineTo(295, 55);
        p.quadraticBezierTo(316, 57, 338, 88);
        p.lineTo(158, 90);
        p.close();
      case CarType.hatch:
        p.moveTo(178, 67);
        p.quadraticBezierTo(192, 59, 220, 59);
        p.lineTo(292, 63);
        p.quadraticBezierTo(308, 67, 318, 90);
        p.lineTo(176, 90);
        p.close();
      case CarType.bakkie:
        p.moveTo(168, 68);
        p.quadraticBezierTo(180, 59, 210, 59);
        p.lineTo(238, 61);
        p.quadraticBezierTo(252, 63, 258, 85);
        p.lineTo(166, 85);
        p.close();
    }
    return p;
  }

  Offset _headlightCenter(CarType t) {
    switch (t) {
      case CarType.bakkie:
        return const Offset(388, 112);
      default:
        return const Offset(372, 112);
    }
  }

  List<double> _wheelCenters(CarType t) {
    switch (t) {
      case CarType.bakkie:
        return [78, 337];
      case CarType.suv:
        return [78, 332];
      default:
        return [78, 330];
    }
  }

  @override
  bool shouldRepaint(_CarPainter old) =>
      old.type != type || old.color != color || old.accent != accent;
}
