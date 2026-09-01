import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../theme/app_colors.dart';
import '../../../theme/app_tokens.dart';
import '../../../widgets/price_display.dart';
import '../../core/i18n/app_formatters.dart';
import '../../core/i18n/app_localizations.dart';
import '../../core/network/api_exception.dart';
import '../../models/activity_models.dart';
import '../../models/seller_models.dart';
import '../../repositories/seller_repository.dart';
import '../../state/session_controller.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/async_state_view.dart';
import '../../widgets/role_account_tab.dart';
import '../../widgets/section_card.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/vehicle_image.dart';
import 'listing_editor_screen.dart';

class SellerHomeScreen extends StatefulWidget {
  const SellerHomeScreen({super.key, this.onSwitchWorkspace});

  final VoidCallback? onSwitchWorkspace;

  @override
  State<SellerHomeScreen> createState() => _SellerHomeScreenState();
}

class _SellerHomeScreenState extends State<SellerHomeScreen> {
  int _tabIndex = 0;
  Future<List<SellerListingSummary>>? _listingsFuture;
  Future<List<ViewingItem>>? _viewingsFuture;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final session = context.read<SessionController>();
    _viewingsFuture ??= _loadViewings();
    if (session.user != null) _listingsFuture ??= _loadListings();
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionController>();
    final user = session.user!;
    final copy = AutoIqLocalizations.of(context);
    final body = IndexedStack(
      index: _tabIndex,
      children: [
        _SellerDashboardTab(
          future: _listingsFuture,
          onRefresh: _refreshListings,
          onOpenListing: _openEditor,
        ),
        _SellerViewingsTab(
          future: _viewingsFuture,
          onRefresh: _refreshViewings,
          onAcknowledge: _acknowledgeViewing,
        ),
        RoleAccountTab(user: user, includeBusinessName: true),
      ],
    );

    return Scaffold(
      appBar: AppBar(
        title:
            Text('${copy.sellerWorkspace} · ${user.fullName.split(' ').first}'),
        actions: [
          if (widget.onSwitchWorkspace != null)
            IconButton(
              tooltip: copy.switchWorkspace,
              onPressed: widget.onSwitchWorkspace,
              icon: const Icon(Icons.swap_horiz),
            ),
        ],
      ),
      body: body,
      floatingActionButton: _tabIndex == 0
          ? FloatingActionButton.extended(
              onPressed: () => _openEditor(),
              icon: const Icon(Icons.add),
              label: Text(copy.text('newListing')),
            )
          : null,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tabIndex,
        onDestinationSelected: (index) => setState(() => _tabIndex = index),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.dashboard_outlined),
            selectedIcon: const Icon(Icons.dashboard),
            label: copy.dashboard,
          ),
          NavigationDestination(
            icon: const Icon(Icons.event_note_outlined),
            selectedIcon: const Icon(Icons.event_note),
            label: copy.viewings,
          ),
          NavigationDestination(
            icon: const Icon(Icons.person_outline),
            selectedIcon: const Icon(Icons.person),
            label: copy.account,
          ),
        ],
      ),
    );
  }

  Future<List<SellerListingSummary>> _loadListings() {
    return context.read<SellerRepository>().listings();
  }

  Future<List<ViewingItem>> _loadViewings() {
    return context.read<SellerRepository>().viewings();
  }

  Future<void> _refreshListings() async {
    setState(() {
      _listingsFuture = _loadListings();
    });
    await _listingsFuture;
  }

  Future<void> _refreshViewings() async {
    setState(() {
      _viewingsFuture = _loadViewings();
    });
    await _viewingsFuture;
  }

  Future<void> _acknowledgeViewing(String viewingId) async {
    await context.read<SellerRepository>().acknowledgeViewing(viewingId);
    await _refreshViewings();
  }

  Future<void> _openEditor([String? listingId]) async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ListingEditorScreen(listingId: listingId),
      ),
    );
    await _refreshListings();
    if (mounted) {
      await context.read<SessionController>().refreshProfile();
    }
  }
}

class _SellerDashboardTab extends StatelessWidget {
  const _SellerDashboardTab({
    required this.future,
    required this.onRefresh,
    required this.onOpenListing,
  });

  final Future<List<SellerListingSummary>>? future;
  final Future<void> Function() onRefresh;
  final Future<void> Function(String? listingId) onOpenListing;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<SellerListingSummary>>(
      future: future,
      builder: (context, snapshot) {
        final copy = AutoIqLocalizations.of(context);
        if (snapshot.connectionState != ConnectionState.done) {
          return AppLoadingView(label: copy.text('loadingSellerDashboard'));
        }
        if (snapshot.hasError) {
          return EmptyState(
            title: copy.text('listingsUnavailable'),
            message: copy.text('listingsUnavailableMessage'),
            action: ElevatedButton(
              onPressed: onRefresh,
              child: Text(copy.retry),
            ),
          );
        }
        final listings = snapshot.data ?? const <SellerListingSummary>[];
        final viewCount =
            listings.fold<int>(0, (sum, item) => sum + item.viewCount);
        final quoteCount =
            listings.fold<int>(0, (sum, item) => sum + item.quoteCount);
        final viewingCount =
            listings.fold<int>(0, (sum, item) => sum + item.viewingCount);
        return LayoutBuilder(
          builder: (context, constraints) => RefreshIndicator(
            onRefresh: onRefresh,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: adaptivePageInsets(constraints.maxWidth),
              children: [
                _StatsGrid(
                  values: {
                    copy.text('statsListings'): listings.length,
                    copy.text('statsViews'): viewCount,
                    copy.text('statsQuotes'): quoteCount,
                    copy.text('statsViewings'): viewingCount,
                  },
                ),
                const SizedBox(height: 16),
                if (listings.isEmpty)
                  EmptyState(
                    title: copy.text('noListings'),
                    message: copy.text('noListingsMessage'),
                  )
                else
                  ...listings.map(
                    (listing) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: Semantics(
                        button: true,
                        label: copy.formatText(
                          'editVehicle',
                          {'title': listing.title},
                        ),
                        child: SectionCard(
                          padding: EdgeInsets.zero,
                          child: InkWell(
                            onTap: () => onOpenListing(listing.id),
                            borderRadius: BorderRadius.circular(AppRadii.lg),
                            child: Padding(
                              padding: const EdgeInsets.all(AppSpacing.sm),
                              child: _listingRow(context, listing),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _listingRow(
    BuildContext context,
    SellerListingSummary listing,
  ) {
    return Row(
      children: [
        SizedBox(
          width: 100,
          child: VehicleImageView(
            imageUrl: listing.coverImageUrl,
            height: 84,
            semanticLabel: AutoIqLocalizations.of(context).formatText(
              'vehicleCoverPhoto',
              {'title': listing.title},
            ),
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              StatusChip(label: listing.status),
              const SizedBox(height: AppSpacing.xs),
              Text(
                listing.title,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: AppColors.ink900,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                AutoIqLocalizations.of(context).formatText(
                  'updatedOn',
                  {
                    'date': AppFormatters.shortDate(
                      context,
                      DateTime.parse(listing.updatedAt).toLocal(),
                    ),
                  },
                ),
                style: const TextStyle(fontSize: 12, color: AppColors.ink500),
              ),
              const SizedBox(height: AppSpacing.xs),
              PriceDisplay(
                amount: listing.askPriceUsd.toStringAsFixed(0),
                fontSize: 18,
              ),
            ],
          ),
        ),
        const Icon(Icons.chevron_right, color: AppColors.ink400),
      ],
    );
  }
}

class _StatsGrid extends StatelessWidget {
  const _StatsGrid({required this.values});

  final Map<String, int> values;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
      child: LayoutBuilder(
        builder: (context, constraints) {
          final width = constraints.maxWidth < 360
              ? constraints.maxWidth / 2
              : constraints.maxWidth / 4;
          return Wrap(
            runSpacing: AppSpacing.sm,
            children: values.entries
                .map(
                  (entry) => SizedBox(
                    width: width,
                    child: _StatBlock(
                      label: entry.key,
                      value: '${entry.value}',
                    ),
                  ),
                )
                .toList(growable: false),
          );
        },
      ),
    );
  }
}

class _StatBlock extends StatelessWidget {
  const _StatBlock({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: AppColors.ink900,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: AppColors.ink500),
        ),
      ],
    );
  }
}

class _SellerViewingsTab extends StatelessWidget {
  const _SellerViewingsTab({
    required this.future,
    required this.onRefresh,
    required this.onAcknowledge,
  });

  final Future<List<ViewingItem>>? future;
  final Future<void> Function() onRefresh;
  final Future<void> Function(String viewingId) onAcknowledge;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<ViewingItem>>(
      future: future,
      builder: (context, snapshot) {
        final copy = AutoIqLocalizations.of(context);
        if (snapshot.connectionState != ConnectionState.done) {
          return AppLoadingView(label: copy.text('loadingViewingRequests'));
        }
        if (snapshot.hasError) return _error(context);
        return _content(context, snapshot.data ?? const []);
      },
    );
  }

  Widget _error(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return EmptyState(
      title: copy.viewingRequestsUnavailable,
      message: copy.catalogueUnavailableMessage,
      action: ElevatedButton(onPressed: onRefresh, child: Text(copy.retry)),
    );
  }

  Widget _content(BuildContext context, List<ViewingItem> items) {
    final copy = AutoIqLocalizations.of(context);
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          Text(copy.viewingRequests,
              style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 16),
          if (items.isEmpty)
            EmptyState(
              title: copy.noViewingRequests,
              message: copy.noViewingRequests,
            )
          else
            ...items.map((item) =>
                _ViewingCard(item: item, onAcknowledge: onAcknowledge)),
        ],
      ),
    );
  }
}

class _ViewingCard extends StatefulWidget {
  const _ViewingCard({required this.item, required this.onAcknowledge});

  final ViewingItem item;
  final Future<void> Function(String viewingId) onAcknowledge;

  @override
  State<_ViewingCard> createState() => _ViewingCardState();
}

class _ViewingCardState extends State<_ViewingCard> {
  bool _busy = false;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    final item = widget.item;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: SectionCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Wrap(
              spacing: AppSpacing.xs,
              runSpacing: AppSpacing.xs,
              alignment: WrapAlignment.spaceBetween,
              children: [
                StatusChip(label: item.status),
                Text(_viewingDate(context, item)),
              ],
            ),
            const SizedBox(height: 10),
            Text(item.snapshotTitle,
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text('${copy.buyer}: ${item.buyerName}'),
            if (item.location != null) ...[
              const SizedBox(height: 4),
              Text('${item.location!.name}, ${item.location!.city}'),
            ],
            if (item.status == 'REQUESTED') ...[
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: _busy ? null : _acknowledge,
                child: Text(copy.acknowledgeRequest),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _acknowledge() async {
    setState(() => _busy = true);
    try {
      await widget.onAcknowledge(widget.item.id);
      if (mounted) _show(AutoIqLocalizations.of(context).viewingAcknowledged);
    } on ApiException catch (error) {
      if (mounted) _show(error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _show(String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  String _viewingDate(BuildContext context, ViewingItem item) {
    final value = DateTime.tryParse(item.confirmedSlot ?? item.preferredSlot);
    return value == null
        ? ''
        : AppFormatters.dateTime(context, value.toLocal());
  }
}
