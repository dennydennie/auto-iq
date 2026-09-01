import 'package:autoiq_mobile/src/widgets/adaptive_content.dart';
import 'package:autoiq_mobile/theme/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('adaptive content stays readable on compact and expanded widths',
      (tester) async {
    await _setViewport(tester, const Size(320, 568));
    await tester.pumpWidget(_contentHarness());
    final compactWidth = tester.getSize(find.byKey(const Key('content'))).width;
    expect(compactWidth, lessThanOrEqualTo(288));
    expect(tester.takeException(), isNull);

    await _setViewport(tester, const Size(1400, 900));
    await tester.pumpWidget(_contentHarness());
    final expandedWidth =
        tester.getSize(find.byKey(const Key('content'))).width;
    expect(expandedWidth, lessThanOrEqualTo(1120));
    expect(expandedWidth, greaterThan(compactWidth));
    expect(tester.takeException(), isNull);
  });

  testWidgets('adaptive columns stack then expand side by side',
      (tester) async {
    await _setViewport(tester, const Size(390, 844));
    await tester.pumpWidget(_columnHarness());
    final compactPrimary = tester.getTopLeft(find.byKey(const Key('primary')));
    final compactSecondary =
        tester.getTopLeft(find.byKey(const Key('secondary')));
    expect(compactSecondary.dy, greaterThan(compactPrimary.dy));

    await _setViewport(tester, const Size(1100, 800));
    await tester.pumpWidget(_columnHarness());
    final widePrimary = tester.getTopLeft(find.byKey(const Key('primary')));
    final wideSecondary = tester.getTopLeft(find.byKey(const Key('secondary')));
    expect(wideSecondary.dx, greaterThan(widePrimary.dx));
    expect(wideSecondary.dy, widePrimary.dy);
  });

  testWidgets('shared controls do not overflow at two-times text scaling',
      (tester) async {
    await _setViewport(tester, const Size(320, 568));
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.theme,
        builder: (context, child) => MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaler: const TextScaler.linear(2),
          ),
          child: child!,
        ),
        home: Scaffold(
          body: AdaptiveContent(
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                ElevatedButton(
                  onPressed: () {},
                  child: const Text('Continue securely'),
                ),
                OutlinedButton(
                  onPressed: () {},
                  child: const Text('Save and exit'),
                ),
              ],
            ),
          ),
        ),
      ),
    );

    expect(tester.takeException(), isNull);
  });
}

Widget _contentHarness() {
  return MaterialApp(
    home: Scaffold(
      body: AdaptiveContent(
        child: Container(key: const Key('content'), height: 100),
      ),
    ),
  );
}

Widget _columnHarness() {
  return const MaterialApp(
    home: Scaffold(
      body: AdaptiveColumns(
        primary: SizedBox(key: Key('primary'), height: 100),
        secondary: SizedBox(key: Key('secondary'), height: 100),
      ),
    ),
  );
}

Future<void> _setViewport(WidgetTester tester, Size size) async {
  await tester.binding.setSurfaceSize(size);
  addTearDown(() => tester.binding.setSurfaceSize(null));
}
