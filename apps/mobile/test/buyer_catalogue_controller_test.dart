import 'dart:async';

import 'package:autoiq_mobile/src/core/network/api_client.dart';
import 'package:autoiq_mobile/src/core/network/api_exception.dart';
import 'package:autoiq_mobile/src/core/observability/mobile_analytics.dart';
import 'package:autoiq_mobile/src/models/activity_models.dart';
import 'package:autoiq_mobile/src/models/listing_filters.dart';
import 'package:autoiq_mobile/src/models/listing_models.dart';
import 'package:autoiq_mobile/src/repositories/buyer_repository.dart';
import 'package:autoiq_mobile/src/state/buyer_catalogue_controller.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('search paginates without duplicates when saved loading fails',
      () async {
    final repository = _CatalogueRepository(
      pages: [
        CataloguePage(
          data: [_listing('one'), _listing('two')],
          nextCursor: 'page-2',
          hasMore: true,
        ),
        CataloguePage(
          data: [_listing('two'), _listing('three')],
          nextCursor: null,
          hasMore: false,
        ),
      ],
      savedError: true,
    );
    final analytics = _RecordingAnalytics();
    final controller = BuyerCatalogueController(repository, analytics);

    await controller.load(
      query: 'Toyota',
      filters: const ListingFilterState(city: 'Harare'),
    );
    await controller.loadMore();

    expect(controller.items.map((item) => item.id), ['one', 'two', 'three']);
    expect(controller.savedIds, isEmpty);
    expect(controller.hasMore, isFalse);
    expect(repository.queries, ['Toyota', 'Toyota']);
    expect(repository.cursors, [null, 'page-2']);
    expect(analytics.events, [
      MobileFunnelEvent.catalogueSearch,
      MobileFunnelEvent.contentLoaded,
    ]);
  });

  test('a stale response cannot replace a newer query', () async {
    final repository = _DeferredCatalogueRepository();
    final controller = BuyerCatalogueController(
      repository,
      _RecordingAnalytics(),
    );

    final oldLoad = controller.load(query: 'Toyota');
    final newLoad = controller.load(query: 'Honda');
    repository.complete('Honda', [_listing('new')]);
    await newLoad;
    repository.complete('Toyota', [_listing('old')]);
    await oldLoad;

    expect(controller.items.single.id, 'new');
  });

  test('a stale pagination response cannot append to a newer query', () async {
    final repository = _DeferredPaginationRepository();
    final controller = BuyerCatalogueController(
      repository,
      _RecordingAnalytics(),
    );

    await controller.load(query: 'Toyota');
    final stalePage = controller.loadMore();
    await controller.load(query: 'Honda');
    repository.completeOldPage();
    await stalePage;

    expect(controller.items.map((item) => item.id), ['honda']);
    expect(controller.hasMore, isFalse);
  });

  test('short and overlong search values fail locally', () async {
    final repository = _CatalogueRepository(pages: []);
    final analytics = _RecordingAnalytics();
    final controller = BuyerCatalogueController(repository, analytics);

    await controller.load(query: 'x');
    expect(controller.queryError, contains('at least 2'));
    expect(repository.queries, isEmpty);
    expect(analytics.events, [MobileFunnelEvent.validationFailed]);

    await controller.load(query: 'x' * 121);
    expect(controller.queryError, contains('120'));
    expect(repository.queries, isEmpty);
    expect(
      analytics.events,
      List.filled(2, MobileFunnelEvent.validationFailed),
    );
  });
}

class _CatalogueRepository extends BuyerRepository {
  _CatalogueRepository({required this.pages, this.savedError = false})
      : super(_NoopApiClient());

  final List<CataloguePage> pages;
  final bool savedError;
  final List<String> queries = [];
  final List<String?> cursors = [];
  int _index = 0;

  @override
  Future<CataloguePage> browse({
    ListingFilterState filters = const ListingFilterState(),
    String query = '',
    String? cursor,
    int limit = 20,
  }) async {
    queries.add(query);
    cursors.add(cursor);
    return pages[_index++];
  }

  @override
  Future<List<SavedVehicleItem>> savedVehicles() async {
    if (savedError) {
      throw ApiException(message: 'saved service down', statusCode: 503);
    }
    return const [];
  }
}

class _DeferredCatalogueRepository extends BuyerRepository {
  _DeferredCatalogueRepository() : super(_NoopApiClient());

  final Map<String, Completer<CataloguePage>> _requests = {};

  @override
  Future<CataloguePage> browse({
    ListingFilterState filters = const ListingFilterState(),
    String query = '',
    String? cursor,
    int limit = 20,
  }) {
    return (_requests[query] = Completer<CataloguePage>()).future;
  }

  @override
  Future<List<SavedVehicleItem>> savedVehicles() async => const [];

  void complete(String query, List<ListingCard> items) {
    _requests[query]!.complete(
      CataloguePage(data: items, nextCursor: null, hasMore: false),
    );
  }
}

class _DeferredPaginationRepository extends BuyerRepository {
  _DeferredPaginationRepository() : super(_NoopApiClient());

  final _oldPage = Completer<CataloguePage>();

  @override
  Future<CataloguePage> browse({
    ListingFilterState filters = const ListingFilterState(),
    String query = '',
    String? cursor,
    int limit = 20,
  }) async {
    if (query == 'Toyota' && cursor == null) {
      return CataloguePage(
        data: [_listing('toyota')],
        nextCursor: 'old-cursor',
        hasMore: true,
      );
    }
    if (query == 'Toyota') return _oldPage.future;
    return CataloguePage(
      data: [_listing('honda')],
      nextCursor: null,
      hasMore: false,
    );
  }

  @override
  Future<List<SavedVehicleItem>> savedVehicles() async => const [];

  void completeOldPage() {
    _oldPage.complete(
      CataloguePage(
        data: [_listing('stale')],
        nextCursor: null,
        hasMore: false,
      ),
    );
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

ListingCard _listing(String id) {
  return ListingCard(
    id: id,
    slug: id,
    year: 2022,
    make: 'Toyota',
    model: 'Hilux',
    bodyType: 'Bakkie',
    askPriceUsd: 25000,
    negotiable: true,
    city: 'Harare',
    coverImageUrl: null,
    bisellVerified: true,
    inspectionScore: 90,
    daysListed: 4,
  );
}
