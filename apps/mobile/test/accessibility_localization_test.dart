import 'package:autoiq_mobile/src/core/i18n/app_localizations.dart';
import 'package:autoiq_mobile/src/core/observability/mobile_analytics.dart';
import 'package:autoiq_mobile/src/models/listing_models.dart';
import 'package:autoiq_mobile/src/screens/buyer/listing_detail_screen.dart';
import 'package:autoiq_mobile/src/screens/seller/listing_editor_screen.dart';
import 'package:autoiq_mobile/src/widgets/status_chip.dart';
import 'package:autoiq_mobile/theme/app_colors.dart';
import 'package:autoiq_mobile/theme/app_theme.dart';
import 'package:autoiq_mobile/widgets/score_gauge.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('release locales are English-only unless previews are explicit', () {
    expect(
      AutoIqLocalizations.localesFor(
        isReleaseMode: true,
        previewEnabled: false,
      ),
      AutoIqLocalizations.productionLocales,
    );
    expect(
      AutoIqLocalizations.localesFor(
        isReleaseMode: true,
        previewEnabled: true,
      ),
      containsAll(const [Locale('sn', 'ZW'), Locale('ar')]),
    );
  });

  test('analytics drops PII while retaining approved UX metrics', () {
    expect(
      safeMobileAttributes({
        'flow': 'quote',
        'duration_ms': 320,
        'result_count': 4,
        'email': 'private@example.com',
        'message': 'private buyer note',
      }),
      {
        'flow': 'quote',
        'duration_ms': 320,
        'result_count': 4,
      },
    );
  });

  test('status foregrounds meet WCAG AA contrast', () {
    expect(_contrast(AppColors.ink900, AppColors.amberSoft),
        greaterThanOrEqualTo(4.5));
    expect(_contrast(AppColors.pendingText, AppColors.pendingSoft),
        greaterThanOrEqualTo(4.5));
    expect(_contrast(AppColors.reject, AppColors.rejectSoft),
        greaterThanOrEqualTo(4.5));
    expect(_contrast(AppColors.verifiedText, AppColors.verifiedSoft),
        greaterThanOrEqualTo(4.5));
  });

  testWidgets('score, status, and gallery expose useful semantics',
      (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.theme,
        home: Scaffold(
          body: ListView(
            children: [
              const ScoreGauge(score: 140),
              const StatusChip(label: 'UNDER_REVIEW'),
              VehicleGallery(listing: _listing),
            ],
          ),
        ),
      ),
    );

    expect(
      tester.getSemantics(find.byType(ScoreGauge)),
      matchesSemantics(
        label: 'Inspection score 100 out of 100',
        isImage: true,
      ),
    );
    expect(
      tester.getSemantics(find.byType(StatusChip)),
      matchesSemantics(label: 'Status: Under review'),
    );
    expect(
      tester.getSemantics(find.byType(VehicleGallery)).label,
      contains('2 vehicle photos'),
    );

    await tester.tap(find.byKey(const Key('gallery-image-0')));
    await tester.pumpAndSettle();
    expect(find.byType(FullScreenVehicleGallery), findsOneWidget);
    expect(find.byType(InteractiveViewer), findsOneWidget);
    semantics.dispose();
  });

  testWidgets('core controls survive the full viewport and text-scale matrix',
      (tester) async {
    addTearDown(() => tester.binding.setSurfaceSize(null));
    const widths = [320.0, 360.0, 390.0, 432.0, 600.0, 800.0];
    const scales = [1.0, 1.3, 2.0];

    for (final width in widths) {
      for (final scale in scales) {
        await tester.binding.setSurfaceSize(Size(width, 900));
        await tester.pumpWidget(
          MaterialApp(
            theme: AppTheme.theme,
            builder: (context, child) => MediaQuery(
              data: MediaQuery.of(context).copyWith(
                textScaler: TextScaler.linear(scale),
              ),
              child: child!,
            ),
            home: Scaffold(
              body: ListView(
                children: [
                  SellerWizardProgress(
                    currentStep: 1,
                    completion: const [true, false, false, false, false],
                    onSelected: (_) {},
                  ),
                  const Wrap(
                    children: [
                      StatusChip(label: 'UNDER_REVIEW'),
                      StatusChip(label: 'CHANGES_REQUESTED'),
                    ],
                  ),
                  Wrap(
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
                ],
              ),
            ),
          ),
        );

        expect(
          tester.takeException(),
          isNull,
          reason: 'overflow at width $width and text scale $scale',
        );
        expect(
          tester.getSize(find.byType(ElevatedButton)).height,
          greaterThanOrEqualTo(48),
        );
      }
    }
  });
}

double _contrast(Color foreground, Color background) {
  final lighter = foreground.computeLuminance() > background.computeLuminance()
      ? foreground
      : background;
  final darker = identical(lighter, foreground) ? background : foreground;
  return (lighter.computeLuminance() + 0.05) /
      (darker.computeLuminance() + 0.05);
}

final _listing = ListingDetail(
  id: 'listing-1',
  slug: '2021-honda-vezel',
  year: 2021,
  make: 'Honda',
  model: 'Vezel',
  bodyType: 'SUV',
  colour: 'Blue',
  fuelType: 'HYBRID',
  transmission: 'AUTOMATIC',
  driveType: 'FWD',
  engineCapacity: '1.5L',
  mileageKm: 64000,
  askPriceUsd: 19500,
  negotiable: true,
  sellerDisclosure: 'Full service history.',
  city: 'Harare',
  coverImageUrl: null,
  images: [
    VehicleImage(
      id: 'image-1',
      url: '',
      slot: 'FRONT',
      isCover: true,
      position: 0,
    ),
    VehicleImage(
      id: 'image-2',
      url: '',
      slot: 'REAR',
      isCover: false,
      position: 1,
    ),
  ],
  inspectionSummary: null,
  bisellVerified: true,
  publishedAt: '2026-08-01T00:00:00.000Z',
  daysListed: 4,
  viewCount: 12,
);
