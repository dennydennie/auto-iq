import 'package:flutter/foundation.dart';

import '../core/network/api_exception.dart';
import '../core/observability/mobile_analytics.dart';
import '../models/listing_filters.dart';
import '../models/listing_models.dart';
import '../repositories/buyer_repository.dart';

class BuyerCatalogueController extends ChangeNotifier {
  BuyerCatalogueController(this._repository, this._analytics);

  final BuyerRepository _repository;
  final MobileAnalytics _analytics;

  ListingFilterState _filters = const ListingFilterState();
  String _query = '';
  List<ListingCard> _items = const [];
  Set<String> _savedIds = const {};
  String? _nextCursor;
  ApiException? _error;
  String? _queryError;
  bool _hasMore = false;
  bool _loading = false;
  bool _loadingMore = false;
  int _generation = 0;

  List<ListingCard> get items => _items;
  Set<String> get savedIds => _savedIds;
  ApiException? get error => _error;
  String? get queryError => _queryError;
  bool get hasMore => _hasMore;
  bool get isLoading => _loading;
  bool get isLoadingMore => _loadingMore;
  bool get isEmpty => !_loading && _items.isEmpty;

  Future<void> load({
    ListingFilterState? filters,
    String? query,
  }) async {
    final latency = Stopwatch()..start();
    final nextQuery = query?.trim() ?? _query;
    if (!_setQuery(nextQuery)) return;
    _filters = filters ?? _filters;
    final generation = ++_generation;
    _beginInitialLoad();
    final savedFuture = _safeSavedIds();
    try {
      final page = await _repository.browse(
        filters: _filters,
        query: _query,
      );
      if (generation != _generation) return;
      _applyPage(page, replace: true);
      _recordSearch(page.data.length);
      _recordLoadLatency(latency.elapsedMilliseconds, page.data.length);
      final savedIds = await savedFuture;
      if (generation != _generation) return;
      _savedIds = savedIds;
    } on ApiException catch (error) {
      if (generation == _generation) _error = error;
    } finally {
      if (generation == _generation) {
        _loading = false;
        notifyListeners();
      }
    }
  }

  Future<void> loadMore() async {
    if (_loading || _loadingMore || !_hasMore || _nextCursor == null) return;
    final generation = _generation;
    _loadingMore = true;
    _error = null;
    notifyListeners();
    try {
      final page = await _repository.browse(
        filters: _filters,
        query: _query,
        cursor: _nextCursor,
      );
      if (generation != _generation) return;
      _applyPage(page, replace: false);
    } on ApiException catch (error) {
      if (generation == _generation) _error = error;
    } finally {
      if (generation == _generation) {
        _loadingMore = false;
        notifyListeners();
      }
    }
  }

  Future<void> refreshSaved() async {
    _savedIds = await _safeSavedIds();
    notifyListeners();
  }

  bool _setQuery(String value) {
    _queryError = validateCatalogueQuery(value);
    if (_queryError != null) {
      _analytics.record(
        MobileFunnelEvent.validationFailed,
        attributes: {
          'flow': 'catalogue_search',
          'validation_count': 1,
        },
      );
      notifyListeners();
      return false;
    }
    _query = value;
    return true;
  }

  void _beginInitialLoad() {
    _loading = true;
    _loadingMore = false;
    _error = null;
    _items = const [];
    _nextCursor = null;
    _hasMore = false;
    notifyListeners();
  }

  void _applyPage(CataloguePage page, {required bool replace}) {
    _items = replace ? page.data : _appendUnique(_items, page.data);
    _nextCursor = page.nextCursor;
    _hasMore = page.hasMore;
  }

  Future<Set<String>> _safeSavedIds() async {
    try {
      final saved = await _repository.savedVehicles();
      return saved.map((item) => item.listing.id).toSet();
    } on ApiException {
      return _savedIds;
    }
  }

  void _recordSearch(int resultCount) {
    _analytics.record(
      MobileFunnelEvent.catalogueSearch,
      attributes: {
        'filter_count': _filters.catalogueQuery.length,
        'has_query': _query.isNotEmpty,
        'result_count': resultCount,
      },
    );
  }

  void _recordLoadLatency(int durationMs, int resultCount) {
    _analytics.record(
      MobileFunnelEvent.contentLoaded,
      attributes: {
        'surface': 'catalogue',
        'duration_ms': durationMs,
        'result_count': resultCount,
      },
    );
  }
}

String? validateCatalogueQuery(String value) {
  final query = value.trim();
  if (query.isNotEmpty && query.length < 2) {
    return 'Enter at least 2 characters to search.';
  }
  if (query.length > 120) return 'Search cannot exceed 120 characters.';
  return null;
}

List<ListingCard> _appendUnique(
  List<ListingCard> current,
  List<ListingCard> next,
) {
  final ids = current.map((item) => item.id).toSet();
  return [...current, ...next.where((item) => ids.add(item.id))];
}
