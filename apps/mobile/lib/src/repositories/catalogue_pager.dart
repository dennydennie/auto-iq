import '../models/listing_models.dart';

typedef CataloguePageFetcher = Future<CataloguePage> Function({String? cursor});

class CataloguePager {
  CataloguePager({
    required CataloguePageFetcher fetchPage,
    this.maxPages = 10,
  }) : _fetchPage = fetchPage;

  final CataloguePageFetcher _fetchPage;
  final int maxPages;

  Future<List<ListingCard>> loadAll() async {
    final byId = <String, ListingCard>{};
    String? cursor;

    for (var pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
      final page = await _fetchPage(cursor: cursor);
      for (final listing in page.data) {
        byId.putIfAbsent(listing.id, () => listing);
      }
      if (!page.hasMore || page.nextCursor == null) break;
      cursor = page.nextCursor;
    }

    return List<ListingCard>.unmodifiable(byId.values);
  }
}
