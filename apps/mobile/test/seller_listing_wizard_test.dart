import 'package:autoiq_mobile/src/core/network/api_client.dart';
import 'package:autoiq_mobile/src/core/network/api_exception.dart';
import 'package:autoiq_mobile/src/core/observability/mobile_analytics.dart';
import 'package:autoiq_mobile/src/models/app_user.dart';
import 'package:autoiq_mobile/src/models/listing_models.dart';
import 'package:autoiq_mobile/src/models/reference_data.dart';
import 'package:autoiq_mobile/src/models/seller_listing_readiness.dart';
import 'package:autoiq_mobile/src/models/seller_models.dart';
import 'package:autoiq_mobile/src/repositories/seller_repository.dart';
import 'package:autoiq_mobile/src/screens/seller/listing_editor_screen.dart';
import 'package:autoiq_mobile/src/state/session_controller.dart';
import 'package:autoiq_mobile/theme/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

void main() {
  test('readiness links every missing requirement to its wizard step', () {
    final issues = sellerReadinessIssues(_detail(), 'Too short');

    expect(
      issues.map((issue) => issue.messageKey),
      containsAll([
        'readinessPhotos',
        'readinessDocuments',
        'readinessDisclosure',
      ]),
    );
    expect(
      issues.map((issue) => issue.step),
      containsAll([
        SellerWizardStep.photos,
        SellerWizardStep.documents,
        SellerWizardStep.review,
      ]),
    );

    expect(
      sellerReadinessIssues(
        _detail(images: _completeImages, documents: _completeDocuments),
        'The vehicle has a complete service history and no known defects.',
      ),
      isEmpty,
    );
  });

  testWidgets('five-step flow validates pricing and creates a resumable draft',
      (tester) async {
    await _setViewport(tester, const Size(390, 844));
    final api = _SellerApiClient();
    final analytics = _RecordingAnalytics();
    await tester.pumpWidget(_editorHarness(api, analytics: analytics));
    await tester.pumpAndSettle();

    expect(find.text('Specs'), findsOneWidget);
    expect(find.text('Pricing'), findsOneWidget);
    expect(find.text('Photos'), findsOneWidget);
    expect(find.text('Documents'), findsOneWidget);
    expect(find.text('Review'), findsOneWidget);

    final specificationFields = find.byType(TextFormField);
    await tester.enterText(specificationFields.at(0), 'Honda');
    await tester.enterText(specificationFields.at(1), 'Vezel');
    await tester.enterText(specificationFields.at(3), 'Blue');
    await tester.enterText(specificationFields.at(5), '64000');
    await tester.tap(find.byKey(const Key('seller-next')));
    await tester.pumpAndSettle();

    expect(find.text('Set a clear asking price before adding media.'),
        findsOneWidget);
    await tester.enterText(find.byKey(const Key('seller-price')), 'invalid');
    await tester.tap(find.byKey(const Key('seller-next')));
    await tester.pump();
    expect(find.text('Ask price must be a number.'), findsOneWidget);
    expect(api.createCalls, 0);

    await tester.enterText(find.byKey(const Key('seller-price')), '19500');
    await tester.tap(find.byKey(const Key('seller-next')));
    await tester.pumpAndSettle();

    expect(api.createCalls, 1);
    expect(api.createBody['make'], 'Honda');
    expect(api.createBody['askPriceUsd'], 19500);
    expect(
        find.text(
            'Upload at least three photos, choose a cover, and drag to reorder.'),
        findsOneWidget);
    expect(analytics.events, contains(MobileFunnelEvent.validationFailed));
    expect(
      analytics.events.where(
        (event) => event == MobileFunnelEvent.sellerStepCompleted,
      ),
      hasLength(2),
    );
  });

  testWidgets('existing draft loads and debounced edits autosave',
      (tester) async {
    await _setViewport(tester, const Size(390, 844));
    final api = _SellerApiClient();
    await tester.pumpWidget(
      _editorHarness(
        api,
        listingId: 'listing-1',
        analytics: _RecordingAnalytics(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Edit listing'), findsOneWidget);
    final makeField = find.byType(TextFormField).at(0);
    expect(tester.widget<TextFormField>(makeField).controller!.text, 'Honda');

    await tester.enterText(makeField, 'Toyota');
    await tester.pump(const Duration(milliseconds: 850));
    await tester.pumpAndSettle();

    expect(api.putPaths, contains('/api/v1/listings/listing-1/specs'));
    expect(api.putPaths, contains('/api/v1/listings/listing-1/pricing'));
    expect(api.specsBody['make'], 'Toyota');
  });

  testWidgets('wizard progress remains usable at narrow width and 2x text',
      (tester) async {
    await _setViewport(tester, const Size(320, 568));
    final semantics = tester.ensureSemantics();
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
          body: SellerWizardProgress(
            currentStep: 2,
            completion: const [true, true, false, false, false],
            onSelected: (_) {},
          ),
        ),
      ),
    );

    expect(tester.takeException(), isNull);
    expect(
      tester.getSemantics(find.byType(SellerWizardProgress)),
      matchesSemantics(label: 'Listing step 3 of 5'),
    );
    semantics.dispose();
  });
}

Widget _editorHarness(
  _SellerApiClient api, {
  required _RecordingAnalytics analytics,
  String? listingId,
}) {
  return MultiProvider(
    providers: [
      ChangeNotifierProvider<SessionController>.value(value: _WizardSession()),
      Provider<SellerRepository>.value(value: SellerRepository(api)),
      Provider<MobileAnalytics>.value(value: analytics),
    ],
    child: MaterialApp(
      theme: AppTheme.theme,
      home: ListingEditorScreen(listingId: listingId),
    ),
  );
}

Future<void> _setViewport(WidgetTester tester, Size size) async {
  await tester.binding.setSurfaceSize(size);
  addTearDown(() => tester.binding.setSurfaceSize(null));
}

class _SellerApiClient extends Fake implements ApiClient {
  int createCalls = 0;
  Map<String, dynamic> createBody = {};
  Map<String, dynamic> specsBody = {};
  final List<String> putPaths = [];

  @override
  Future<T> getJson<T>(
    String path,
    T Function(dynamic json) parser, {
    Map<String, dynamic>? queryParameters,
  }) async {
    if (path.endsWith('/timeline')) return parser({'history': <dynamic>[]});
    return parser(_detailJson);
  }

  @override
  Future<T> postJson<T>(
    String path,
    dynamic body,
    T Function(dynamic json) parser, {
    bool includeCsrf = false,
  }) async {
    if (path == '/api/v1/listings') {
      createCalls += 1;
      createBody = (body as Map).cast<String, dynamic>();
    }
    return parser(_detailJson);
  }

  @override
  Future<T> putJson<T>(
    String path,
    dynamic body,
    T Function(dynamic json) parser, {
    bool includeCsrf = false,
  }) async {
    putPaths.add(path);
    if (path.endsWith('/specs')) {
      specsBody = (body as Map).cast<String, dynamic>();
    }
    return parser(_detailJson);
  }

  @override
  Future<T> patchJson<T>(
    String path,
    dynamic body,
    T Function(dynamic json) parser, {
    bool includeCsrf = false,
  }) async {
    return parser(_detailJson);
  }
}

class _WizardSession extends ChangeNotifier implements SessionController {
  @override
  ApiException? get bootstrapError => null;

  @override
  String? get errorMessage => null;

  @override
  bool get isAuthenticated => true;

  @override
  bool get isBooting => false;

  @override
  bool get isBusy => false;

  @override
  bool get isSessionUnavailable => false;

  @override
  List<String> get requiredConsents => const [];

  @override
  ReferenceDataSet get referenceData => _references;

  @override
  AppUser? get user => null;

  @override
  Future<void> bootstrap() async {}

  @override
  void clearError() {}

  @override
  Future<void> completeRequiredConsents(Set<String> acceptedConsents) async {}

  @override
  Future<void> login({
    required String identifier,
    required String password,
  }) async {}

  @override
  Future<void> logout() async {}

  @override
  Future<void> refreshProfile() async {}

  @override
  Future<void> requestAccountDeletion() async {}

  @override
  Future<void> updateProfile(Map<String, dynamic> payload) async {}
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

final _references = ReferenceDataSet(
  makes: [
    VehicleMake(id: 'honda', name: 'Honda', popularModels: ['Vezel'])
  ],
  bodyTypes: const [ReferenceOption(value: 'SUV', label: 'SUV')],
  fuelTypes: const [ReferenceOption(value: 'HYBRID', label: 'Hybrid')],
  transmissionTypes: const [
    ReferenceOption(value: 'AUTOMATIC', label: 'Automatic'),
  ],
  driveTypes: const [ReferenceOption(value: 'FWD', label: 'Front-wheel drive')],
  conditionGrades: const [ReferenceOption(value: 'GOOD', label: 'Good')],
  viewingLocations: const [],
);

SellerListingDetail _detail({
  List<VehicleImage> images = const [],
  List<SellerDocument> documents = const [],
}) {
  return SellerListingDetail(
    id: 'listing-1',
    status: 'DRAFT',
    slug: '2021-honda-vezel',
    sellerDisclosure: null,
    viewCount: 0,
    viewingCount: 0,
    quoteCount: 0,
    changesNote: null,
    specs: ListingSpecs(
      make: 'Honda',
      model: 'Vezel',
      year: 2021,
      bodyType: 'SUV',
      colour: 'Blue',
      fuelType: 'HYBRID',
      transmission: 'AUTOMATIC',
      driveType: 'FWD',
      engineCapacity: '1.5L',
      mileageKm: 64000,
      condition: 'GOOD',
      hasAccidentHistory: false,
      accidentNote: null,
    ),
    pricing: SellerPricing(askPriceUsd: 19500, negotiable: true),
    images: images,
    documents: documents,
  );
}

final _completeImages = List.generate(
  3,
  (index) => VehicleImage(
    id: 'image-$index',
    url: '',
    slot: 'SLOT_$index',
    isCover: index == 0,
    position: index,
  ),
);

final _completeDocuments = SellerRepository.requiredDocumentTypes
    .map(
      (type) => SellerDocument(
        id: type,
        documentType: type,
        reviewStatus: 'PENDING',
      ),
    )
    .toList(growable: false);

const _detailJson = {
  'id': 'listing-1',
  'status': 'DRAFT',
  'slug': '2021-honda-vezel',
  'sellerDisclosure': null,
  'viewCount': 0,
  'viewingCount': 0,
  'quoteCount': 0,
  'changesNote': null,
  'specs': {
    'make': 'Honda',
    'model': 'Vezel',
    'year': 2021,
    'bodyType': 'SUV',
    'colour': 'Blue',
    'fuelType': 'HYBRID',
    'transmission': 'AUTOMATIC',
    'driveType': 'FWD',
    'engineCapacity': '1.5L',
    'mileageKm': 64000,
    'condition': 'GOOD',
    'hasAccidentHistory': false,
    'accidentNote': null,
  },
  'pricing': {'askPriceUsd': 19500, 'negotiable': true},
  'images': <dynamic>[],
  'documents': <dynamic>[],
};
