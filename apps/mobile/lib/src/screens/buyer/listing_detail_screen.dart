import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../theme/app_colors.dart';
import '../../../theme/app_tokens.dart';
import '../../../widgets/price_display.dart';
import '../../../widgets/score_gauge.dart';
import '../../../widgets/spec_chip.dart';
import '../../../widgets/verified_badge.dart';
import '../../core/i18n/app_localizations.dart';
import '../../core/network/api_exception.dart';
import '../../core/observability/mobile_analytics.dart';
import '../../models/listing_models.dart';
import '../../models/reference_data.dart';
import '../../repositories/buyer_repository.dart';
import '../../widgets/async_state_view.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/section_card.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/vehicle_image.dart';
import 'buyer_action_sheets.dart';

class ListingDetailScreen extends StatefulWidget {
  const ListingDetailScreen({
    super.key,
    required this.listingId,
    required this.initialSaved,
    required this.onSavedChanged,
    required this.viewingLocations,
  });

  final String listingId;
  final bool initialSaved;
  final ValueChanged<bool> onSavedChanged;
  final List<ViewingLocation> viewingLocations;

  @override
  State<ListingDetailScreen> createState() => _ListingDetailScreenState();
}

class _ListingDetailScreenState extends State<ListingDetailScreen> {
  ListingDetail? _detail;
  ApiException? _error;
  late bool _isSaved;
  bool _loading = true;
  bool _savingBookmark = false;

  @override
  void initState() {
    super.initState();
    _isSaved = widget.initialSaved;
    _reload();
  }

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(copy.text('vehicleDetail')),
        actions: [_bookmarkButton()],
      ),
      body: _body(),
      bottomNavigationBar: _detail == null ? null : _actionBar(_detail!),
    );
  }

  Widget _bookmarkButton() {
    final copy = AutoIqLocalizations.of(context);
    final label =
        _isSaved ? copy.text('removeSavedVehicle') : copy.text('saveVehicle');
    return Semantics(
      button: true,
      label: label,
      child: IconButton(
        key: const Key('listing-bookmark'),
        tooltip: label,
        onPressed: _detail == null || _savingBookmark ? null : _toggleSaved,
        icon: _savingBookmark
            ? const SizedBox.square(
                dimension: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : Icon(
                _isSaved ? Icons.bookmark : Icons.bookmark_border,
                color: _isSaved ? AppColors.pendingText : null,
              ),
      ),
    );
  }

  Widget _body() {
    final copy = AutoIqLocalizations.of(context);
    if (_detail == null && _loading) {
      return AppLoadingView(label: copy.text('loadingVehicleDetails'));
    }
    if (_detail == null) {
      return EmptyState(
        icon: Icons.cloud_off_outlined,
        title: copy.text('vehicleUnavailable'),
        message: _error?.supportMessage ?? copy.text('pleaseTryAgain'),
        action: ElevatedButton(onPressed: _reload, child: Text(copy.retry)),
      );
    }
    return Stack(
      children: [
        _detailContent(_detail!),
        if (_loading) const LinearProgressIndicator(minHeight: 3),
      ],
    );
  }

  Widget _detailContent(ListingDetail listing) {
    return LayoutBuilder(
      builder: (context, constraints) => RefreshIndicator(
        onRefresh: _reload,
        child: Align(
          alignment: Alignment.topCenter,
          child: SizedBox(
            width: constraints.maxWidth.clamp(0, 840),
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: adaptivePageInsets(constraints.maxWidth),
              children: _sections(listing),
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _sections(ListingDetail listing) {
    return [
      VehicleGallery(listing: listing),
      const SizedBox(height: AppSpacing.md),
      _ListingHeading(listing: listing),
      if (listing.inspectionSummary != null) ...[
        const SizedBox(height: AppSpacing.md),
        _InspectionCard(summary: listing.inspectionSummary!),
      ],
      const SizedBox(height: AppSpacing.md),
      _SpecificationCard(listing: listing),
      if (listing.sellerDisclosure != null) ...[
        const SizedBox(height: AppSpacing.md),
        _DisclosureCard(disclosure: listing.sellerDisclosure!),
      ],
      const SizedBox(height: AppSpacing.md),
    ];
  }

  Widget _actionBar(ListingDetail listing) {
    return _BuyerActionBar(
      onQuote: () => _openQuoteSheet(listing),
      onViewing: () => _openViewingSheet(listing),
    );
  }

  Future<void> _reload() async {
    if (mounted) setState(() => _loading = true);
    try {
      final detail =
          await context.read<BuyerRepository>().fetchDetail(widget.listingId);
      if (mounted) setState(() => _detail = detail);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _toggleSaved() async {
    setState(() => _savingBookmark = true);
    try {
      await _updateSavedOnServer();
      if (!mounted) return;
      setState(() => _isSaved = !_isSaved);
      widget.onSavedChanged(_isSaved);
      final copy = AutoIqLocalizations.of(context);
      _showSnack(
        _isSaved ? copy.text('vehicleSaved') : copy.text('vehicleRemovedSaved'),
      );
    } on ApiException catch (error) {
      _showSnack(error.supportMessage);
    } finally {
      if (mounted) setState(() => _savingBookmark = false);
    }
  }

  Future<void> _updateSavedOnServer() {
    final repository = context.read<BuyerRepository>();
    return _isSaved
        ? repository.removeSavedVehicle(widget.listingId)
        : repository.saveVehicle(widget.listingId);
  }

  Future<void> _openQuoteSheet(ListingDetail listing) async {
    final successMessage = AutoIqLocalizations.of(context).text('quoteSent');
    final sent = await _showSheet(
      QuoteRequestSheet(
        listing: listing,
        repository: context.read<BuyerRepository>(),
        analytics: context.read<MobileAnalytics>(),
      ),
    );
    if (sent == true) {
      _showSnack(successMessage);
    }
  }

  Future<void> _openViewingSheet(ListingDetail listing) async {
    final successMessage =
        AutoIqLocalizations.of(context).text('viewingRequested');
    final sent = await _showSheet(
      ViewingRequestSheet(
        listing: listing,
        locations: widget.viewingLocations,
        repository: context.read<BuyerRepository>(),
        analytics: context.read<MobileAnalytics>(),
      ),
    );
    if (sent == true) {
      _showSnack(successMessage);
    }
  }

  Future<bool?> _showSheet(Widget child) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => FractionallySizedBox(heightFactor: 0.96, child: child),
    );
  }

  void _showSnack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }
}

class VehicleGallery extends StatefulWidget {
  const VehicleGallery({super.key, required this.listing});

  final ListingDetail listing;

  @override
  State<VehicleGallery> createState() => _VehicleGalleryState();
}

class _VehicleGalleryState extends State<VehicleGallery> {
  int _index = 0;

  List<String?> get _urls {
    if (widget.listing.images.isNotEmpty) {
      return widget.listing.images.map((image) => image.url).toList();
    }
    return [widget.listing.coverImageUrl];
  }

  @override
  Widget build(BuildContext context) {
    final urls = _urls;
    final copy = AutoIqLocalizations.of(context);
    return Semantics(
      container: true,
      label: copy.formatText('vehiclePhotos', {'count': urls.length}),
      child: Column(
        children: [
          AspectRatio(
            aspectRatio: 16 / 9,
            child: PageView.builder(
              key: const Key('listing-gallery'),
              itemCount: urls.length,
              onPageChanged: (value) => setState(() => _index = value),
              itemBuilder: (_, index) => _image(urls, index),
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          _position(urls.length),
        ],
      ),
    );
  }

  Widget _image(List<String?> urls, int index) {
    final copy = AutoIqLocalizations.of(context);
    final label = copy.formatText('photoOf', {
      'title': widget.listing.title,
      'current': index + 1,
      'total': urls.length,
    });
    return Semantics(
      button: true,
      label: '$label. ${copy.text('openFullScreenGallery')}',
      child: InkWell(
        key: Key('gallery-image-$index'),
        onTap: () => _openGallery(urls, index),
        borderRadius: BorderRadius.circular(AppRadii.lg),
        child: VehicleImageView(imageUrl: urls[index], height: 320),
      ),
    );
  }

  Widget _position(int count) {
    final copy = AutoIqLocalizations.of(context);
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (count <= 8)
          ...List.generate(
            count,
            (index) => AnimatedContainer(
              duration: AppMotion.fast,
              width: index == _index ? 18 : 7,
              height: 7,
              margin: const EdgeInsets.symmetric(horizontal: 3),
              decoration: BoxDecoration(
                color: index == _index ? AppColors.ink900 : AppColors.ink300,
                borderRadius: BorderRadius.circular(AppRadii.pill),
              ),
            ),
          ),
        const SizedBox(width: AppSpacing.xs),
        Text(copy.formatText('imagePosition', {
          'current': _index + 1,
          'total': count,
        })),
      ],
    );
  }

  void _openGallery(List<String?> urls, int index) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => FullScreenVehicleGallery(
          title: widget.listing.title,
          urls: urls,
          initialIndex: index,
        ),
      ),
    );
  }
}

class FullScreenVehicleGallery extends StatefulWidget {
  const FullScreenVehicleGallery({
    super.key,
    required this.title,
    required this.urls,
    required this.initialIndex,
  });

  final String title;
  final List<String?> urls;
  final int initialIndex;

  @override
  State<FullScreenVehicleGallery> createState() =>
      _FullScreenVehicleGalleryState();
}

class _FullScreenVehicleGalleryState extends State<FullScreenVehicleGallery> {
  late final PageController _controller;
  late int _index;

  @override
  void initState() {
    super.initState();
    _index = widget.initialIndex;
    _controller = PageController(initialPage: _index);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: Text(copy.formatText('imagePositionOf', {
          'current': _index + 1,
          'total': widget.urls.length,
        })),
      ),
      body: PageView.builder(
        controller: _controller,
        itemCount: widget.urls.length,
        onPageChanged: (value) => setState(() => _index = value),
        itemBuilder: (_, index) => InteractiveViewer(
          minScale: 1,
          maxScale: 4,
          child: Center(
            child: VehicleImageView(
              imageUrl: widget.urls[index],
              height: MediaQuery.sizeOf(context).height * 0.7,
              semanticLabel: copy.formatText('photoOf', {
                'title': widget.title,
                'current': index + 1,
                'total': widget.urls.length,
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _ListingHeading extends StatelessWidget {
  const _ListingHeading({required this.listing});

  final ListingDetail listing;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          listing.title,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w800,
                color: AppColors.ink900,
              ),
        ),
        const SizedBox(height: AppSpacing.xs),
        _chips(context),
        const SizedBox(height: AppSpacing.sm),
        PriceDisplay(amount: listing.askPriceUsd.toStringAsFixed(0)),
        const SizedBox(height: AppSpacing.xxs),
        Text(
          listing.negotiable
              ? copy.text('negotiable')
              : copy.text('fixedAskingPrice'),
          style: const TextStyle(color: AppColors.ink500),
        ),
      ],
    );
  }

  Widget _chips(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Wrap(
      spacing: AppSpacing.xs,
      runSpacing: AppSpacing.xs,
      children: [
        if (listing.bisellVerified) const VerifiedBadge(),
        StatusChip(label: listing.city),
        StatusChip(
          label: copy.formatText(
            'daysListed',
            {'count': listing.daysListed},
          ),
        ),
      ],
    );
  }
}

class _InspectionCard extends StatelessWidget {
  const _InspectionCard({required this.summary});

  final InspectionSummary summary;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            copy.text('inspectionSummary'),
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink900,
                ),
          ),
          const SizedBox(height: AppSpacing.sm),
          _scoreOverview(context),
          if (summary.categories.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.sm),
            _categoryScores(),
          ],
          const Divider(height: AppSpacing.lg),
          Text(
            copy.formatText('allFindings', {'count': summary.findings.length}),
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: AppSpacing.sm),
          ...summary.findings.map(_finding),
        ],
      ),
    );
  }

  Widget _scoreOverview(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Row(
      children: [
        ScoreGauge(score: summary.overallScore, size: 88),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                summary.roadworthy
                    ? copy.roadworthy
                    : copy.text('needsAttention'),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink900,
                ),
              ),
              const SizedBox(height: AppSpacing.xxs),
              Text(
                summary.inspectorNote ?? copy.text('inspectionCompleted'),
                style: const TextStyle(color: AppColors.ink500, height: 1.4),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _categoryScores() {
    return Wrap(
      spacing: AppSpacing.xs,
      runSpacing: AppSpacing.xs,
      children: summary.categories
          .map(
            (category) => StatusChip(
              label: '${category.category}: ${category.score.round()}',
            ),
          )
          .toList(growable: false),
    );
  }

  Widget _finding(InspectionFinding finding) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          StatusChip(label: finding.rating),
          const SizedBox(width: AppSpacing.xs),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  finding.label,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                if (finding.note != null) Text(finding.note!),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SpecificationCard extends StatelessWidget {
  const _SpecificationCard({required this.listing});

  final ListingDetail listing;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return SectionCard(
      child: Wrap(
        runSpacing: AppSpacing.sm,
        spacing: AppSpacing.sm,
        children: [
          SpecChip(
            icon: Icons.speed_outlined,
            label: copy.mileage,
            value: '${listing.mileageKm} km',
          ),
          SpecChip(
            icon: Icons.local_gas_station_outlined,
            label: copy.text('fuel'),
            value: listing.fuelType,
          ),
          SpecChip(
            icon: Icons.settings_outlined,
            label: copy.transmission,
            value: listing.transmission,
          ),
          SpecChip(
            icon: Icons.route_outlined,
            label: copy.text('drive'),
            value: listing.driveType,
          ),
          SpecChip(
            icon: Icons.palette_outlined,
            label: copy.text('colour'),
            value: listing.colour,
          ),
        ],
      ),
    );
  }
}

class _DisclosureCard extends StatelessWidget {
  const _DisclosureCard({required this.disclosure});

  final String disclosure;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            copy.text('sellerDisclosure'),
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink900,
                ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(disclosure, style: const TextStyle(height: 1.5)),
        ],
      ),
    );
  }
}

class _BuyerActionBar extends StatelessWidget {
  const _BuyerActionBar({required this.onQuote, required this.onViewing});

  final VoidCallback onQuote;
  final VoidCallback onViewing;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return SafeArea(
      top: false,
      child: DecoratedBox(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppColors.ink100)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  key: const Key('open-quote-sheet'),
                  onPressed: onQuote,
                  icon: const Icon(Icons.price_change_outlined),
                  label: Text(copy.text('quote')),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: ElevatedButton.icon(
                  key: const Key('open-viewing-sheet'),
                  onPressed: onViewing,
                  icon: const Icon(Icons.event_available_outlined),
                  label: Text(copy.text('viewing')),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
