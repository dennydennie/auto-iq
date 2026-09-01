import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../theme/app_colors.dart';
import '../../theme/app_tokens.dart';
import '../../widgets/car_silhouette.dart';

class VehicleImageView extends StatelessWidget {
  const VehicleImageView({
    super.key,
    required this.imageUrl,
    this.height = 180,
    this.semanticLabel,
  });

  final String? imageUrl;
  final double height;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    if (imageUrl == null || imageUrl!.isEmpty) {
      return _semantic(_fallback());
    }
    return _semantic(ClipRRect(
      borderRadius: BorderRadius.circular(AppRadii.lg),
      child: CachedNetworkImage(
        imageUrl: imageUrl!,
        height: height,
        width: double.infinity,
        fit: BoxFit.cover,
        errorWidget: (_, __, ___) => _fallback(),
        placeholder: (_, __) => Container(
          height: height,
          color: AppColors.ink100,
          child: const Center(
            child: CircularProgressIndicator(strokeWidth: 3),
          ),
        ),
      ),
    ));
  }

  Widget _fallback() {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: AppColors.ink900,
        borderRadius: BorderRadius.circular(AppRadii.lg),
      ),
      child: const Center(
        child: CarSilhouette(type: CarType.suv, width: 160, showShadow: false),
      ),
    );
  }

  Widget _semantic(Widget child) {
    final label = semanticLabel;
    if (label == null || label.trim().isEmpty) {
      return ExcludeSemantics(child: child);
    }
    return Semantics(image: true, label: label, child: child);
  }
}
