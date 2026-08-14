import 'package:autoiq_mobile/src/models/inspector_models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('parses assigned inspection tasks and their vehicle snapshot', () {
    final task = InspectionTask.fromJson(_taskJson);

    expect(task.id, 'task-1');
    expect(task.listing.title, '2021 Honda Vezel');
    expect(task.listing.city, 'Harare');
    expect(task.canSubmitReport, isTrue);
  });

  test('creates the six required findings and computes the API score', () {
    final findings =
        List<InspectionFindingDraft>.of(requiredInspectionFindings);
    findings[1] = findings[1].copyWith(rating: 'WATCH');
    findings[2] = findings[2].copyWith(rating: 'FAIL');

    expect(findings.map((item) => item.category), [
      'ENGINE',
      'ELECTRICAL',
      'BODY',
      'TYRES',
      'BRAKES',
      'INTERIOR',
    ]);
    expect(inspectionScore(findings), 81);
  });
}

const _taskJson = {
  'id': 'task-1',
  'listingId': 'listing-1',
  'listingSnapshot': {
    'year': 2021,
    'make': 'Honda',
    'model': 'Vezel',
    'coverImageUrl': null,
    'city': 'Harare',
  },
  'status': 'SCHEDULED',
  'scheduledAt': '2026-08-15T09:00:00.000Z',
  'completedAt': null,
};
