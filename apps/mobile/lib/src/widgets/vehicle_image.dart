import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../theme/app_colors.dart';
import '../../widgets/car_silhouette.dart';

class VehicleImageView extends StatelessWidget {
  const VehicleImageView({
    super.key,
    required this.imageUrl,
    this.height = 180,
  });

  final String? imageUrl;
  final double height;

  @override
  Widget build(BuildContext context) {
    if (imageUrl == null || imageUrl!.isEmpty) {
      return _fallback();
    }
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: CachedNetworkImage(
        imageUrl: imageUrl!,
        height: height,
        width: double.infinity,
        fit: BoxFit.cover,
        errorWidget: (_, __, ___) => _fallback(),
        placeholder: (_, __) => Container(
          height: height,
          color: AppColors.ink100,
          child: const Center(child: CircularProgressIndicator()),
        ),
      ),
    );
  }

  Widget _fallback() {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: AppColors.ink900,
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Center(
        child: CarSilhouette(type: CarType.suv, width: 160, showShadow: false),
      ),
    );
  }
}
