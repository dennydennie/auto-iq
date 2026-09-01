import 'package:autoiq_mobile/src/core/i18n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('production locale policy does not expose incomplete previews', () {
    expect(AutoIqLocalizations.productionLocales, const [Locale('en', 'ZW')]);
    expect(AutoIqLocalizations.previewLocales, contains(const Locale('ar')));
    expect(
      AutoIqLocalizations.lookup(const Locale('sn', 'ZW'))
          .text('quoteRequestTitle'),
      'Request a quote',
    );
  });

  test('loads Shona copy and ICU plural messages', () {
    final copy = AutoIqLocalizations.lookup(const Locale('sn', 'ZW'));
    expect(copy.browse, 'Tsvaga');
    expect(copy.vehicleCount(1), 'Mota 1');
    expect(copy.vehicleCount(3), 'Mota 3');
  });

  testWidgets('Arabic locale creates right-to-left app direction',
      (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        locale: const Locale('ar'),
        supportedLocales: AutoIqLocalizations.supportedLocales,
        localizationsDelegates: const [
          AutoIqLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        home: Builder(
          builder: (context) => Text(
            AutoIqLocalizations.of(context).browse,
            textDirection: Directionality.of(context),
          ),
        ),
      ),
    );

    expect(Directionality.of(tester.element(find.text('تصفح'))),
        TextDirection.rtl);
  });
}
