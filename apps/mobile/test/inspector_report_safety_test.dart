import 'package:autoiq_mobile/src/models/inspector_models.dart';
import 'package:autoiq_mobile/src/screens/inspector/inspection_task_screen.dart';
import 'package:autoiq_mobile/theme/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Watch requires a note and Fail requires a note and photo', () {
    final watch = requiredInspectionFindings.first.copyWith(rating: 'WATCH');
    expect(watch.validationMessage, contains('observation note'));
    expect(watch.copyWith(note: 'Minor wear').validationMessage, isNull);

    final fail = requiredInspectionFindings.first.copyWith(
      rating: 'FAIL',
      note: 'Unsafe tyre damage',
    );
    expect(fail.validationMessage, contains('evidence photo'));
    expect(
      fail.copyWith(photoStorageKey: 'evidence/tyre.jpg').validationMessage,
      isNull,
    );
  });

  testWidgets('report starts incomplete and requires every explicit rating',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.theme,
        home: Scaffold(
          body: SingleChildScrollView(
            child: InspectionReportForm(
              taskId: 'task-1',
              onSubmitted: () async {},
            ),
          ),
        ),
      ),
    );

    expect(find.text('—'), findsOneWidget);
    expect(find.text('Not rated'), findsNWidgets(6));
    expect(_submitButton(tester).onPressed, isNull);

    for (final finding in requiredInspectionFindings) {
      final control = tester.widget<SegmentedButton<String>>(
        find.byKey(Key('finding-rating-${finding.category}')),
      );
      control.onSelectionChanged!({'PASS'});
      await tester.pump();
    }
    await tester.ensureVisible(find.byKey(const Key('inspector-summary')));
    await tester.enterText(
      find.byKey(const Key('inspector-summary')),
      'All required systems were inspected.',
    );
    await tester.pump();

    expect(find.text('100/100'), findsOneWidget);
    expect(_submitButton(tester).onPressed, isNotNull);
    await tester
        .ensureVisible(find.byKey(const Key('submit-inspection-report')));
    await tester.tap(find.byKey(const Key('submit-inspection-report')));
    await tester.pumpAndSettle();
    expect(find.text('Submit this inspection report?'), findsOneWidget);
  });
}

ElevatedButton _submitButton(WidgetTester tester) {
  return tester.widget<ElevatedButton>(
    find.byKey(const Key('submit-inspection-report')),
  );
}
