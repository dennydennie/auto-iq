import '../repositories/seller_repository.dart';
import 'seller_models.dart';

enum SellerWizardStep { specifications, pricing, photos, documents, review }

class SellerReadinessIssue {
  const SellerReadinessIssue({
    required this.step,
    required this.messageKey,
    this.values = const {},
  });

  final SellerWizardStep step;
  final String messageKey;
  final Map<String, Object> values;
}

List<SellerReadinessIssue> sellerReadinessIssues(
  SellerListingDetail? detail,
  String disclosure,
) {
  if (detail == null) {
    return const [
      SellerReadinessIssue(
        step: SellerWizardStep.specifications,
        messageKey: 'readinessSaveSpecs',
      ),
    ];
  }
  return [
    ..._photoIssues(detail),
    ..._documentIssues(detail),
    if (disclosure.trim().length < 20)
      const SellerReadinessIssue(
        step: SellerWizardStep.review,
        messageKey: 'readinessDisclosure',
      ),
  ];
}

List<SellerReadinessIssue> _photoIssues(SellerListingDetail detail) {
  return [
    if (detail.images.length < 3)
      const SellerReadinessIssue(
        step: SellerWizardStep.photos,
        messageKey: 'readinessPhotos',
      ),
    if (detail.images.isNotEmpty &&
        !detail.images.any((image) => image.isCover))
      const SellerReadinessIssue(
        step: SellerWizardStep.photos,
        messageKey: 'readinessCover',
      ),
  ];
}

List<SellerReadinessIssue> _documentIssues(SellerListingDetail detail) {
  final uploaded = detail.documents.map((item) => item.documentType).toSet();
  final missing = SellerRepository.requiredDocumentTypes
      .where((type) => !uploaded.contains(type))
      .map(_humanize)
      .toList(growable: false);
  if (missing.isEmpty) return const [];
  return [
    SellerReadinessIssue(
      step: SellerWizardStep.documents,
      messageKey: 'readinessDocuments',
      values: {'documents': missing.join(', ')},
    ),
  ];
}

String _humanize(String value) {
  final text = value.toLowerCase().replaceAll('_', ' ');
  return '${text[0].toUpperCase()}${text.substring(1)}';
}
