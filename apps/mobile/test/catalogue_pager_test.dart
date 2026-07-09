import 'package:autoiq_mobile/src/models/listing_models.dart';
import 'package:autoiq_mobile/src/repositories/catalogue_pager.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('loads every catalogue page and de-duplicates repeated listings',
      () async {
    final calls = <String?>[];
    final pager = CataloguePager(
      fetchPage: ({String? cursor}) async {
        calls.add(cursor);
        if (cursor == null) {
          return CataloguePage(
            data: [_listing(id: 'one'), _listing(id: 'two')],
            nextCursor: 'next-page',
            hasMore: true,
          );
        }
        return CataloguePage(
          data: [_listing(id: 'two'), _listing(id: 'three')],
          nextCursor: null,
          hasMore: false,
        );
      },
    );

    final listings = await pager.loadAll();

    expect(calls, [null, 'next-page']);
    expect(listings.map((listing) => listing.id), ['one', 'two', 'three']);
  });
}

ListingCard _listing({required String id}) {
  return ListingCard(
    id: id,
    slug: '$id-slug',
    year: 2021,
    make: 'Toyota',
    model: 'Hilux',
    bodyType: 'bakkie',
    askPriceUsd: 18000,
    negotiable: true,
    city: 'Harare',
    coverImageUrl: null,
    bisellVerified: true,
    inspectionScore: 90,
    daysListed: 2,
  );
}
