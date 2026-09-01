import 'package:autoiq_mobile/src/core/network/api_client.dart';
import 'package:autoiq_mobile/src/core/observability/mobile_analytics.dart';
import 'package:autoiq_mobile/src/models/listing_models.dart';
import 'package:autoiq_mobile/src/models/reference_data.dart';
import 'package:autoiq_mobile/src/repositories/buyer_repository.dart';
import 'package:autoiq_mobile/src/screens/buyer/buyer_action_sheets.dart';
import 'package:autoiq_mobile/src/screens/buyer/vehicle_request_sheet.dart';
import 'package:autoiq_mobile/theme/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('quote validation is inline and a valid quote submits once',
      (tester) async {
    await _setPhoneViewport(tester);
    final repository = _BuyerRepository();
    final analytics = _RecordingAnalytics();
    await tester.pumpWidget(
      _launcher(
        (context) => QuoteRequestSheet(
          listing: _listing,
          repository: repository,
          analytics: analytics,
        ),
      ),
    );

    await _openSheet(tester);
    await tester.enterText(find.byKey(const Key('quote-offer')), 'not-a-price');
    await tester.tap(find.byKey(const Key('submit-quote')));
    await tester.pump();

    expect(find.text('Offer price must be a number.'), findsOneWidget);
    expect(repository.quoteCalls, 0);
    expect(analytics.events, [MobileFunnelEvent.validationFailed]);

    await tester.enterText(find.byKey(const Key('quote-offer')), '18500');
    await tester.tap(find.byKey(const Key('submit-quote')));
    await tester.pumpAndSettle();

    expect(repository.quoteCalls, 1);
    expect(repository.offerPrice, 18500);
    expect(analytics.events.last, MobileFunnelEvent.quoteSubmitted);
    expect(find.byType(QuoteRequestSheet), findsNothing);
  });

  testWidgets('viewing requires an explicit location before submission',
      (tester) async {
    await _setPhoneViewport(tester);
    final repository = _BuyerRepository();
    final analytics = _RecordingAnalytics();
    await tester.pumpWidget(
      _launcher(
        (context) => ViewingRequestSheet(
          listing: _listing,
          locations: [_location],
          repository: repository,
          analytics: analytics,
        ),
      ),
    );

    await _openSheet(tester);
    await tester.tap(find.byKey(const Key('submit-viewing')));
    await tester.pump();
    expect(find.text('Choose a viewing location.'), findsOneWidget);
    expect(repository.viewingCalls, 0);

    await tester.tap(find.byKey(const Key('viewing-location')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Harare Centre').last);
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('submit-viewing')));
    await tester.pumpAndSettle();

    expect(repository.viewingCalls, 1);
    expect(repository.locationId, 'location-1');
    expect(analytics.events.last, MobileFunnelEvent.viewingSubmitted);
  });

  testWidgets('sourcing validates numeric ranges and preserves no preference',
      (tester) async {
    await _setPhoneViewport(tester);
    final repository = _BuyerRepository();
    final analytics = _RecordingAnalytics();
    await tester.pumpWidget(
      _launcher(
        (context) => VehicleRequestSheet(
          repository: repository,
          analytics: analytics,
          makes: [VehicleMake(id: 'honda', name: 'Honda', popularModels: [])],
          bodyTypes: const [ReferenceOption(value: 'SUV', label: 'SUV')],
          fuelTypes: const [ReferenceOption(value: 'PETROL', label: 'Petrol')],
          transmissions: const [
            ReferenceOption(value: 'AUTOMATIC', label: 'Automatic'),
          ],
        ),
      ),
    );

    await _openSheet(tester);
    await tester.enterText(find.byKey(const Key('request-budget')), '20000');
    await tester.enterText(find.byKey(const Key('request-year-min')), '2025');
    await tester.enterText(find.byKey(const Key('request-year-max')), '2020');
    await tester.tap(find.byKey(const Key('submit-vehicle-request')));
    await tester.pump();

    expect(find.text('Minimum year cannot exceed maximum.'), findsOneWidget);
    expect(repository.requestCalls, 0);

    await tester.enterText(find.byKey(const Key('request-year-max')), '2030');
    await tester.tap(find.byKey(const Key('submit-vehicle-request')));
    await tester.pumpAndSettle();

    expect(repository.requestCalls, 1);
    expect(repository.requestPayload['makeId'], isNull);
    expect(repository.requestPayload['bodyTypeId'], isNull);
    expect(repository.requestPayload['fuelTypeId'], isNull);
    expect(repository.requestPayload['transmissionTypeId'], isNull);
    expect(analytics.events.last, MobileFunnelEvent.vehicleRequestSubmitted);
  });
}

Widget _launcher(WidgetBuilder sheetBuilder) {
  return MaterialApp(
    theme: AppTheme.theme,
    home: Builder(
      builder: (context) => Scaffold(
        body: ElevatedButton(
          key: const Key('open-sheet'),
          onPressed: () => showModalBottomSheet<void>(
            context: context,
            isScrollControlled: true,
            useSafeArea: true,
            builder: (context) => FractionallySizedBox(
              heightFactor: 0.96,
              child: sheetBuilder(context),
            ),
          ),
          child: const Text('Open'),
        ),
      ),
    ),
  );
}

Future<void> _openSheet(WidgetTester tester) async {
  await tester.tap(find.byKey(const Key('open-sheet')));
  await tester.pumpAndSettle();
}

Future<void> _setPhoneViewport(WidgetTester tester) async {
  await tester.binding.setSurfaceSize(const Size(390, 844));
  addTearDown(() => tester.binding.setSurfaceSize(null));
}

class _BuyerRepository extends BuyerRepository {
  _BuyerRepository() : super(_NoopApiClient());

  int quoteCalls = 0;
  int viewingCalls = 0;
  int requestCalls = 0;
  double? offerPrice;
  String? locationId;
  Map<String, Object?> requestPayload = {};

  @override
  Future<void> createQuote({
    required String listingId,
    required double offerPriceUsd,
    required String paymentPlan,
    String? message,
  }) async {
    quoteCalls += 1;
    offerPrice = offerPriceUsd;
  }

  @override
  Future<void> requestViewing({
    required String listingId,
    required String preferredDate,
    required String preferredTime,
    required String locationId,
    String? note,
  }) async {
    viewingCalls += 1;
    this.locationId = locationId;
  }

  @override
  Future<void> createVehicleRequest({
    required int maxBudgetCents,
    String? makeId,
    String? model,
    int? yearMin,
    int? yearMax,
    String? bodyTypeId,
    String? fuelTypeId,
    String? transmissionTypeId,
    int? maxOdometerKm,
    required String urgency,
    String? notes,
  }) async {
    requestCalls += 1;
    requestPayload = {
      'maxBudgetCents': maxBudgetCents,
      'makeId': makeId,
      'bodyTypeId': bodyTypeId,
      'fuelTypeId': fuelTypeId,
      'transmissionTypeId': transmissionTypeId,
    };
  }
}

class _RecordingAnalytics implements MobileAnalytics {
  final List<MobileFunnelEvent> events = [];

  @override
  void record(
    MobileFunnelEvent event, {
    Map<String, Object?> attributes = const {},
  }) {
    events.add(event);
  }
}

class _NoopApiClient extends Fake implements ApiClient {}

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
  mileageKm: 60000,
  askPriceUsd: 19500,
  negotiable: true,
  sellerDisclosure: 'Full service history.',
  city: 'Harare',
  coverImageUrl: null,
  images: const [],
  inspectionSummary: null,
  bisellVerified: true,
  publishedAt: '2026-08-01T00:00:00.000Z',
  daysListed: 4,
  viewCount: 12,
);

final _location = ViewingLocation(
  id: 'location-1',
  name: 'Harare Centre',
  addressLine1: '1 Main Street',
  addressLine2: null,
  city: 'Harare',
);
