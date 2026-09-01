import 'json_utils.dart';

class InspectionListingSnapshot {
  const InspectionListingSnapshot({
    required this.year,
    required this.make,
    required this.model,
    required this.coverImageUrl,
    required this.city,
  });

  final int year;
  final String make;
  final String model;
  final String? coverImageUrl;
  final String city;

  String get title => '$year $make $model';

  factory InspectionListingSnapshot.fromJson(Map<String, dynamic> json) {
    return InspectionListingSnapshot(
      year: asInt(json, 'year'),
      make: asString(json, 'make'),
      model: asString(json, 'model'),
      coverImageUrl: asNullableString(json, 'coverImageUrl'),
      city: asString(json, 'city'),
    );
  }
}

class InspectionTask {
  const InspectionTask({
    required this.id,
    required this.listingId,
    required this.listing,
    required this.status,
    required this.scheduledAt,
    required this.completedAt,
  });

  final String id;
  final String listingId;
  final InspectionListingSnapshot listing;
  final String status;
  final String? scheduledAt;
  final String? completedAt;

  bool get canSubmitReport => const {
        'SCHEDULED',
        'IN_PROGRESS',
        'REPORT_SUBMITTED',
      }.contains(status);

  factory InspectionTask.fromJson(Map<String, dynamic> json) {
    return InspectionTask(
      id: asString(json, 'id'),
      listingId: asString(json, 'listingId'),
      listing: InspectionListingSnapshot.fromJson(
        asMap(json['listingSnapshot']),
      ),
      status: asString(json, 'status'),
      scheduledAt: asNullableString(json, 'scheduledAt'),
      completedAt: asNullableString(json, 'completedAt'),
    );
  }
}

class InspectionFinding {
  const InspectionFinding({
    required this.id,
    required this.category,
    required this.label,
    required this.rating,
    required this.note,
    required this.photoUrl,
  });

  final String id;
  final String category;
  final String label;
  final String rating;
  final String? note;
  final String? photoUrl;

  factory InspectionFinding.fromJson(Map<String, dynamic> json) {
    return InspectionFinding(
      id: asString(json, 'id'),
      category: asString(json, 'category'),
      label: asString(json, 'label'),
      rating: asString(json, 'rating'),
      note: asNullableString(json, 'note'),
      photoUrl: asNullableString(json, 'photoUrl'),
    );
  }
}

class InspectionReport {
  const InspectionReport({
    required this.id,
    required this.overallScore,
    required this.roadworthy,
    required this.inspectorNote,
    required this.findings,
    required this.buyerSummaryApproved,
  });

  final String id;
  final int overallScore;
  final bool roadworthy;
  final String inspectorNote;
  final List<InspectionFinding> findings;
  final bool buyerSummaryApproved;

  factory InspectionReport.fromJson(Map<String, dynamic> json) {
    return InspectionReport(
      id: asString(json, 'id'),
      overallScore: asInt(json, 'overallScore'),
      roadworthy: asBool(json, 'roadworthy'),
      inspectorNote: asString(json, 'inspectorNote'),
      findings: asMapList(json['findings'])
          .map(InspectionFinding.fromJson)
          .toList(growable: false),
      buyerSummaryApproved: asBool(json, 'buyerSummaryApproved'),
    );
  }
}

class InspectionTaskDetail {
  const InspectionTaskDetail({required this.task, required this.report});

  final InspectionTask task;
  final InspectionReport? report;

  factory InspectionTaskDetail.fromJson(Map<String, dynamic> json) {
    final report = json['report'];
    return InspectionTaskDetail(
      task: InspectionTask.fromJson(asMap(json['task'])),
      report: report is Map
          ? InspectionReport.fromJson(report.cast<String, dynamic>())
          : null,
    );
  }
}

class InspectionFindingDraft {
  const InspectionFindingDraft({
    required this.category,
    required this.label,
    this.rating,
    this.note = '',
    this.photoStorageKey,
    this.photoName,
  });

  final String category;
  final String label;
  final String? rating;
  final String note;
  final String? photoStorageKey;
  final String? photoName;

  InspectionFindingDraft copyWith({
    String? rating,
    String? note,
    String? photoStorageKey,
    String? photoName,
  }) {
    return InspectionFindingDraft(
      category: category,
      label: label,
      rating: rating ?? this.rating,
      note: note ?? this.note,
      photoStorageKey: photoStorageKey ?? this.photoStorageKey,
      photoName: photoName ?? this.photoName,
    );
  }

  bool get isRated => rating != null;
  bool get requiresNote => rating == 'WATCH' || rating == 'FAIL';
  bool get requiresPhoto => rating == 'FAIL';

  String? get validationMessage {
    if (!isRated) return 'Choose Pass, Watch, or Fail.';
    if (requiresNote && note.trim().isEmpty) {
      return 'Add an observation note for this rating.';
    }
    if (requiresPhoto && photoStorageKey == null) {
      return 'Add an evidence photo for a failed finding.';
    }
    return null;
  }

  Map<String, dynamic> toJson() => {
        'category': category,
        'label': label,
        'rating': rating ?? (throw StateError('Finding must be rated.')),
        if (note.trim().isNotEmpty) 'note': note.trim(),
        if (photoStorageKey != null) 'photoStorageKey': photoStorageKey,
      };
}

const requiredInspectionFindings = [
  InspectionFindingDraft(category: 'ENGINE', label: 'Engine and drivetrain'),
  InspectionFindingDraft(category: 'ELECTRICAL', label: 'Electrical systems'),
  InspectionFindingDraft(category: 'BODY', label: 'Body and paint'),
  InspectionFindingDraft(category: 'TYRES', label: 'Tyres and wheels'),
  InspectionFindingDraft(category: 'BRAKES', label: 'Brakes and suspension'),
  InspectionFindingDraft(category: 'INTERIOR', label: 'Interior and controls'),
];

int? inspectionScore(Iterable<InspectionFindingDraft> findings) {
  final values = findings.toList(growable: false);
  if (values.isEmpty || values.any((finding) => !finding.isRated)) return null;
  final ratings = values.map((finding) => _ratingScore(finding.rating!));
  return (ratings.reduce((left, right) => left + right) / values.length)
      .round();
}

bool inspectionDraftIsComplete(Iterable<InspectionFindingDraft> findings) {
  final values = findings.toList(growable: false);
  return values.length == requiredInspectionFindings.length &&
      values.every((finding) => finding.validationMessage == null);
}

int _ratingScore(String rating) {
  if (rating == 'PASS') return 100;
  if (rating == 'WATCH') return 65;
  return 20;
}
