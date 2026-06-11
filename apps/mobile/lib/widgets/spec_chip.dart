import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class SpecChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const SpecChip(
      {super.key,
      required this.icon,
      required this.label,
      required this.value});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.ink50,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.ink100),
      ),
      child: Row(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
                color: AppColors.ink100,
                borderRadius: BorderRadius.circular(7)),
            child: Icon(icon, size: 14, color: AppColors.ink500),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style:
                      const TextStyle(fontSize: 10, color: AppColors.ink400)),
              Text(value,
                  style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppColors.ink800)),
            ],
          ),
        ],
      ),
    );
  }
}
