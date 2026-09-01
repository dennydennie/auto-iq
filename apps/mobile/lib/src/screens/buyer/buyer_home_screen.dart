import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../theme/app_colors.dart';
import '../../../theme/app_tokens.dart';
import '../../../widgets/price_display.dart';
import '../../../widgets/verified_badge.dart';
import '../../core/network/api_exception.dart';
import '../../core/observability/mobile_analytics.dart';
import '../../core/i18n/app_formatters.dart';
import '../../core/i18n/app_localizations.dart';
import '../../models/activity_models.dart';
import '../../models/listing_models.dart';
import '../../models/listing_filters.dart';
import '../../models/reference_data.dart';
import '../../repositories/buyer_repository.dart';
import '../../state/session_controller.dart';
import '../../state/buyer_catalogue_controller.dart';
import '../../widgets/async_state_view.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/account_deletion_card.dart';
import '../../widgets/section_card.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/vehicle_image.dart';
import 'listing_detail_screen.dart';
import 'vehicle_request_sheet.dart';

class BuyerHomeScreen extends StatefulWidget {
  const BuyerHomeScreen({super.key, this.onSwitchWorkspace});

  final VoidCallback? onSwitchWorkspace;

  @override
  State<BuyerHomeScreen> createState() => _BuyerHomeScreenState();
}

class _BuyerHomeScreenState extends State<BuyerHomeScreen> {
  int _tabIndex = 0;
  BuyerCatalogueController? _catalogueController;
  late Future<List<SavedVehicleItem>> _savedFuture;
  late Future<List<QuoteItem>> _quotesFuture;
  late Future<List<VehicleRequestItem>> _requestFuture;
  late Future<List<ViewingItem>> _viewingsFuture;
  ListingFilterState _appliedFilters = const ListingFilterState();
  List<VehicleMake> _catalogueMakes = const [];
  final _searchController = TextEditingController();
  Timer? _searchDebounce;

  @override
  void dispose() {
    _searchController.dispose();
    _searchDebounce?.cancel();
    _catalogueController?.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _savedFuture = _loadSaved();
    _quotesFuture = _loadQuotes();
    _requestFuture = _loadRequests();
    _viewingsFuture = _loadViewings();
    _loadCatalogueMakes();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _catalogueController ??= BuyerCatalogueController(
      context.read<BuyerRepository>(),
      context.read<MobileAnalytics>(),
    )..load();
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionController>();
    final user = session.user!;
    final copy = AutoIqLocalizations.of(context);
    final referenceMakes =
        session.referenceData?.makes ?? const <VehicleMake>[];
    final browseMakes =
        referenceMakes.isEmpty ? _catalogueMakes : referenceMakes;
    final body = IndexedStack(
      index: _tabIndex,
      children: [
        _BrowseTab(
          controller: _catalogueController!,
          searchController: _searchController,
          filters: _appliedFilters,
          makes: browseMakes,
          cities: uniqueCities(
            session.referenceData?.viewingLocations ?? const [],
          ),
          onApplyFilters: _applyFilters,
          onSearch: _applySearch,
          onSearchChanged: _scheduleSearch,
          onClearFilters: _clearFilters,
          bodyTypes: session.referenceData?.bodyTypes ?? const [],
          transmissionTypes:
              session.referenceData?.transmissionTypes ?? const [],
          fuelTypes: session.referenceData?.fuelTypes ?? const [],
          onOpenListing: _openListing,
          onRefresh: _refreshBrowse,
        ),
        _SavedTab(
          future: _savedFuture,
          onOpenListing: _openListing,
          onRefresh: _refreshSaved,
        ),
        _RequestsTab(
          quotesFuture: _quotesFuture,
          requestFuture: _requestFuture,
          onCreateRequest: _openRequestDialog,
          onRefresh: _refreshRequestActivity,
        ),
        _ViewingsTab(future: _viewingsFuture, onRefresh: _refreshViewings),
        _BuyerAccountTab(
          userName: user.fullName,
          email: user.email,
          city: user.city,
          vehiclePurpose: user.buyerProfile?.vehiclePurpose,
          searchRadiusKm: user.buyerProfile?.searchRadiusKm,
          deliveryPreference: user.buyerProfile?.deliveryPreference,
          paymentPreference: user.buyerProfile?.paymentPreference,
          preferredFuelTypes: user.buyerProfile?.preferredFuelTypes ?? const [],
          preferredTransmissions:
              user.buyerProfile?.preferredTransmissions ?? const [],
          minSeats: user.buyerProfile?.minSeats,
          maxMileageKm: user.buyerProfile?.maxMileageKm,
          yearMin: user.buyerProfile?.yearMin,
          yearMax: user.buyerProfile?.yearMax,
          budgetMin: user.buyerProfile?.budgetMin,
          budgetMax: user.buyerProfile?.budgetMax,
          fuelTypes: session.referenceData?.fuelTypes ?? const [],
          transmissionTypes:
              session.referenceData?.transmissionTypes ?? const [],
        ),
      ],
    );

    return Scaffold(
      appBar: AppBar(
        title: Text(copy.greeting(user.fullName.split(' ').first)),
        actions: [
          if (widget.onSwitchWorkspace != null)
            IconButton(
              tooltip: copy.switchWorkspace,
              onPressed: widget.onSwitchWorkspace,
              icon: const Icon(Icons.swap_horiz),
            ),
          IconButton(
            tooltip: copy.refreshProfile,
            onPressed: session.isBusy ? null : session.refreshProfile,
            icon: const Icon(Icons.sync_outlined),
          ),
        ],
      ),
      body: body,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tabIndex,
        onDestinationSelected: (index) => setState(() => _tabIndex = index),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.search_outlined),
            selectedIcon: const Icon(Icons.search),
            label: copy.browse,
          ),
          NavigationDestination(
            icon: const Icon(Icons.bookmark_border_outlined),
            selectedIcon: const Icon(Icons.bookmark),
            label: copy.saved,
          ),
          NavigationDestination(
            icon: const Icon(Icons.request_page_outlined),
            selectedIcon: const Icon(Icons.request_page),
            label: copy.requests,
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

  void _applyFilters(ListingFilterState filters) {
    setState(() {
      _appliedFilters = filters;
    });
    _catalogueController!.load(filters: filters);
  }

  void _applySearch() {
    _searchDebounce?.cancel();
    _catalogueController!.load(query: _searchController.text);
  }

  void _scheduleSearch(String _) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 350), _applySearch);
  }

  void _clearFilters() {
    _applyFilters(const ListingFilterState());
  }

  Future<void> _openListing(String listingId, {bool saved = false}) async {
    final viewingLocations =
        context.read<SessionController>().referenceData?.viewingLocations ??
            const <ViewingLocation>[];
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ListingDetailScreen(
          listingId: listingId,
          initialSaved: saved,
          viewingLocations: viewingLocations,
          onSavedChanged: (_) {
            _savedFuture = _loadSaved();
            setState(() {});
            _catalogueController?.refreshSaved();
          },
        ),
      ),
    );
    await _refreshSaved();
    await _refreshQuotes();
    await _refreshViewings();
  }

  Future<void> _openRequestDialog() async {
    final referenceData = context.read<SessionController>().referenceData;
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => FractionallySizedBox(
        heightFactor: 0.96,
        child: VehicleRequestSheet(
          repository: context.read<BuyerRepository>(),
          analytics: context.read<MobileAnalytics>(),
          makes: referenceData?.makes ?? const [],
          bodyTypes: referenceData?.bodyTypes ?? const [],
          fuelTypes: referenceData?.fuelTypes ?? const [],
          transmissions: referenceData?.transmissionTypes ?? const [],
        ),
      ),
    );
    if (created == true) await _refreshRequests();
  }

  Future<void> _loadCatalogueMakes() async {
    try {
      final makes = await context.read<BuyerRepository>().catalogueMakes();
      if (!mounted) return;
      setState(() => _catalogueMakes = makes);
    } on ApiException {
      // The authenticated reference data remains the primary source.
    }
  }

  Future<List<SavedVehicleItem>> _loadSaved() {
    return context.read<BuyerRepository>().savedVehicles();
  }

  Future<List<QuoteItem>> _loadQuotes() {
    return context.read<BuyerRepository>().quotes();
  }

  Future<List<VehicleRequestItem>> _loadRequests() {
    return context.read<BuyerRepository>().vehicleRequests();
  }

  Future<List<ViewingItem>> _loadViewings() {
    return context.read<BuyerRepository>().viewings();
  }

  Future<void> _refreshBrowse() async {
    await _catalogueController!.load(
      filters: _appliedFilters,
      query: _searchController.text,
    );
  }

  Future<void> _refreshSaved() async {
    setState(() {
      _savedFuture = _loadSaved();
    });
    await _savedFuture;
  }

  Future<void> _refreshQuotes() async {
    setState(() {
      _quotesFuture = _loadQuotes();
    });
    await _quotesFuture;
  }

  Future<void> _refreshRequests() async {
    setState(() {
      _requestFuture = _loadRequests();
    });
    await _requestFuture;
  }

  Future<void> _refreshRequestActivity() async {
    setState(() {
      _quotesFuture = _loadQuotes();
      _requestFuture = _loadRequests();
    });
    await Future.wait([_quotesFuture, _requestFuture]);
  }

  Future<void> _refreshViewings() async {
    setState(() {
      _viewingsFuture = _loadViewings();
    });
    await _viewingsFuture;
  }
}

class _BrowseTab extends StatelessWidget {
  const _BrowseTab({
    required this.controller,
    required this.searchController,
    required this.filters,
    required this.makes,
    required this.cities,
    required this.onApplyFilters,
    required this.onSearch,
    required this.onSearchChanged,
    required this.onClearFilters,
    required this.bodyTypes,
    required this.transmissionTypes,
    required this.fuelTypes,
    required this.onOpenListing,
    required this.onRefresh,
  });

  final BuyerCatalogueController controller;
  final TextEditingController searchController;
  final ListingFilterState filters;
  final List<VehicleMake> makes;
  final List<String> cities;
  final ValueChanged<ListingFilterState> onApplyFilters;
  final VoidCallback onSearch;
  final ValueChanged<String> onSearchChanged;
  final VoidCallback onClearFilters;
  final List<ReferenceOption> bodyTypes;
  final List<ReferenceOption> transmissionTypes;
  final List<ReferenceOption> fuelTypes;
  final Future<void> Function(String listingId, {bool saved}) onOpenListing;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) => _buildState(context),
    );
  }

  Widget _buildState(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    if (controller.isLoading) {
      return AppLoadingView(label: copy.text('searchingCatalogue'));
    }
    if (controller.error != null && controller.items.isEmpty) {
      return EmptyState(
        title: copy.catalogueUnavailable,
        message: controller.error!.supportMessage,
        action: ElevatedButton(onPressed: onRefresh, child: Text(copy.retry)),
      );
    }
    return LayoutBuilder(
      builder: (context, constraints) => Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 960),
          child: _content(context, constraints.maxWidth),
        ),
      ),
    );
  }

  Widget _content(BuildContext context, double width) {
    final copy = AutoIqLocalizations.of(context);
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: adaptivePageInsets(width),
        children: [
          BrowseFilters(
            searchController: searchController,
            searchError: controller.queryError,
            filters: filters,
            makes: makes,
            cities: cities,
            bodyTypes: bodyTypes,
            onApplyFilters: onApplyFilters,
            onSearch: onSearch,
            onSearchChanged: onSearchChanged,
            onClearFilters: onClearFilters,
            transmissionTypes: transmissionTypes,
            fuelTypes: fuelTypes,
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            copy.vehicleCount(controller.items.length),
            style: Theme.of(context).textTheme.labelLarge,
          ),
          const SizedBox(height: AppSpacing.sm),
          if (controller.items.isEmpty)
            EmptyState(
              title: copy.noPublishedVehicles,
              message: copy.noPublishedVehiclesMessage,
              action: OutlinedButton(
                onPressed: onClearFilters,
                child: Text(copy.clearFilters),
              ),
            )
          else
            ...controller.items.map(_listingCard),
          if (controller.error != null && controller.items.isNotEmpty)
            _PaginationError(
              message: controller.error!.supportMessage,
              onRetry: controller.loadMore,
            ),
          if (controller.hasMore) _loadMoreButton(context),
        ],
      ),
    );
  }

  Widget _listingCard(ListingCard listing) {
    final saved = controller.savedIds.contains(listing.id);
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: _ListingCard(
        listing: listing,
        saved: saved,
        onTap: () => onOpenListing(listing.id, saved: saved),
      ),
    );
  }

  Widget _loadMoreButton(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: AppSpacing.xs),
      child: OutlinedButton.icon(
        key: const Key('browse-load-more'),
        onPressed: controller.isLoadingMore ? null : controller.loadMore,
        icon: controller.isLoadingMore
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : const Icon(Icons.expand_more),
        label: Text(
          AutoIqLocalizations.of(context).text('loadMoreVehicles'),
        ),
      ),
    );
  }
}

class BrowseFilters extends StatelessWidget {
  const BrowseFilters({
    super.key,
    required this.searchController,
    required this.filters,
    required this.makes,
    required this.cities,
    required this.bodyTypes,
    required this.transmissionTypes,
    required this.fuelTypes,
    required this.onApplyFilters,
    required this.onSearch,
    this.onSearchChanged,
    required this.onClearFilters,
    this.searchError,
  });

  final TextEditingController searchController;
  final ListingFilterState filters;
  final List<VehicleMake> makes;
  final List<String> cities;
  final List<ReferenceOption> bodyTypes;
  final List<ReferenceOption> transmissionTypes;
  final List<ReferenceOption> fuelTypes;
  final ValueChanged<ListingFilterState> onApplyFilters;
  final VoidCallback onSearch;
  final ValueChanged<String>? onSearchChanged;
  final VoidCallback onClearFilters;
  final String? searchError;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    final applied = _appliedFilterItems(
      copy,
      filters,
      bodyTypes,
      transmissionTypes,
      fuelTypes,
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _searchField(copy),
        const SizedBox(height: 12),
        _primaryActions(context, copy, applied.length),
        if (applied.isNotEmpty) ...[
          const SizedBox(height: 12),
          _AppliedFilterOverview(
            items: applied,
            onApplyFilters: onApplyFilters,
            onClearFilters: onClearFilters,
          ),
        ],
      ],
    );
  }

  Widget _searchField(AutoIqLocalizations copy) {
    return AnimatedBuilder(
      animation: searchController,
      builder: (context, _) => TextField(
        key: const Key('browse-search-field'),
        controller: searchController,
        textInputAction: TextInputAction.search,
        onChanged: onSearchChanged,
        onSubmitted: (_) => onSearch(),
        decoration: InputDecoration(
          prefixIcon: const Icon(Icons.search_outlined),
          labelText: copy.searchHint,
          errorText: searchError,
          suffixIcon: searchController.text.isEmpty
              ? null
              : IconButton(
                  key: const Key('browse-clear-search'),
                  tooltip: copy.clearSearch,
                  onPressed: _clearSearch,
                  icon: const Icon(Icons.close),
                ),
        ),
      ),
    );
  }

  Widget _primaryActions(
    BuildContext context,
    AutoIqLocalizations copy,
    int appliedCount,
  ) {
    final filterIcon = appliedCount == 0
        ? const Icon(Icons.tune)
        : Badge(
            backgroundColor: AppColors.amber,
            label: Text('$appliedCount'),
            textColor: AppColors.ink900,
            child: const Icon(Icons.tune),
          );
    return Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            key: const Key('browse-open-filters'),
            onPressed: () => _openFilterWizard(context),
            icon: filterIcon,
            label: Text(copy.filters),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton.icon(
            key: const Key('browse-apply-search'),
            onPressed: onSearch,
            icon: const Icon(Icons.search),
            label: Text(copy.search),
          ),
        ),
      ],
    );
  }

  void _clearSearch() {
    searchController.clear();
    onSearch();
  }

  Future<void> _openFilterWizard(BuildContext context) async {
    final result = await showModalBottomSheet<ListingFilterState>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => FractionallySizedBox(
        heightFactor: 0.96,
        child: _FilterWizard(
          initialFilters: filters,
          makes: makes,
          cities: cities,
          bodyTypes: bodyTypes,
          transmissionTypes: transmissionTypes,
          fuelTypes: fuelTypes,
        ),
      ),
    );
    if (result != null && context.mounted) {
      onApplyFilters(result);
    }
  }
}

class _AppliedFilterOverview extends StatelessWidget {
  const _AppliedFilterOverview({
    required this.items,
    required this.onApplyFilters,
    required this.onClearFilters,
  });

  final List<_AppliedFilterItem> items;
  final ValueChanged<ListingFilterState> onApplyFilters;
  final VoidCallback onClearFilters;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Container(
      key: const Key('browse-applied-filters'),
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.ink200),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _overviewHeader(copy),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(children: _chips(copy)),
          ),
        ],
      ),
    );
  }

  Widget _overviewHeader(AutoIqLocalizations copy) {
    return Row(
      children: [
        Expanded(
          child: Text(
            copy.filtersApplied(items.length),
            style: const TextStyle(
              color: AppColors.ink900,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        TextButton(
          key: const Key('browse-clear-filters'),
          onPressed: onClearFilters,
          child: Text(copy.clearFilters),
        ),
      ],
    );
  }

  List<Widget> _chips(AutoIqLocalizations copy) {
    return items
        .map(
          (item) => Padding(
            padding: const EdgeInsetsDirectional.only(end: 8),
            child: Semantics(
              button: true,
              label: copy.removeFilter(item.label),
              onTap: () => onApplyFilters(item.filtersWithout),
              child: ExcludeSemantics(
                child: InputChip(
                  key: Key('browse-applied-${item.key}'),
                  label: Text(item.label),
                  onDeleted: () => onApplyFilters(item.filtersWithout),
                ),
              ),
            ),
          ),
        )
        .toList(growable: false);
  }
}

class _AppliedFilterItem {
  const _AppliedFilterItem({
    required this.key,
    required this.label,
    required this.filtersWithout,
  });

  final String key;
  final String label;
  final ListingFilterState filtersWithout;
}

class _FilterWizard extends StatefulWidget {
  const _FilterWizard({
    required this.initialFilters,
    required this.makes,
    required this.cities,
    required this.bodyTypes,
    required this.transmissionTypes,
    required this.fuelTypes,
  });

  final ListingFilterState initialFilters;
  final List<VehicleMake> makes;
  final List<String> cities;
  final List<ReferenceOption> bodyTypes;
  final List<ReferenceOption> transmissionTypes;
  final List<ReferenceOption> fuelTypes;

  @override
  State<_FilterWizard> createState() => _FilterWizardState();
}

class _FilterWizardState extends State<_FilterWizard> {
  static const _stepCount = 4;
  late ListingFilterState _draft;
  int _step = 0;

  @override
  void initState() {
    super.initState();
    _draft = widget.initialFilters;
  }

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Material(
      color: Colors.white,
      borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          _WizardHeader(
            step: _step,
            stepCount: _stepCount,
            hasFilters: _draft != const ListingFilterState(),
            onClear: _clear,
          ),
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 180),
              layoutBuilder: _topAlignedTransition,
              child: SingleChildScrollView(
                key: ValueKey(_step),
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                child: _stepContent(copy),
              ),
            ),
          ),
          _WizardFooter(
            step: _step,
            stepCount: _stepCount,
            onBack: _back,
            onNext: _next,
            onApply: _apply,
          ),
        ],
      ),
    );
  }

  Widget _stepContent(AutoIqLocalizations copy) {
    return switch (_step) {
      0 => _VehicleFilterStep(
          filters: _draft,
          makes: widget.makes,
          bodyTypes: widget.bodyTypes,
          onChanged: _update,
        ),
      1 => _BudgetFilterStep(filters: _draft, onChanged: _update),
      2 => _UsageFilterStep(
          filters: _draft,
          transmissionTypes: widget.transmissionTypes,
          fuelTypes: widget.fuelTypes,
          onChanged: _update,
        ),
      _ => _LocationFilterStep(
          filters: _draft,
          cities: widget.cities,
          onChanged: _update,
        ),
    };
  }

  void _update(ListingFilterState value) => setState(() => _draft = value);

  void _clear() => setState(() => _draft = const ListingFilterState());

  void _back() => setState(() => _step--);

  void _next() => setState(() => _step++);

  void _apply() => Navigator.of(context).pop(_draft);
}

Widget _topAlignedTransition(
  Widget? currentChild,
  List<Widget> previousChildren,
) {
  return Stack(
    alignment: Alignment.topCenter,
    fit: StackFit.expand,
    children: [
      ...previousChildren,
      if (currentChild != null) currentChild,
    ],
  );
}

class _WizardHeader extends StatelessWidget {
  const _WizardHeader({
    required this.step,
    required this.stepCount,
    required this.hasFilters,
    required this.onClear,
  });

  final int step;
  final int stepCount;
  final bool hasFilters;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
      child: Column(
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.ink200,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 4),
          _titleRow(context, copy),
          Semantics(
            label: copy.filterStep(step + 1, stepCount),
            value: '${step + 1}/$stepCount',
            child: LinearProgressIndicator(
              value: (step + 1) / stepCount,
              minHeight: 4,
              borderRadius: BorderRadius.circular(4),
              color: AppColors.amber,
              backgroundColor: AppColors.ink100,
            ),
          ),
        ],
      ),
    );
  }

  Widget _titleRow(BuildContext context, AutoIqLocalizations copy) {
    return Row(
      children: [
        IconButton(
          key: const Key('filter-wizard-close'),
          tooltip: copy.closeFilters,
          onPressed: () => Navigator.of(context).pop(),
          icon: const Icon(Icons.close),
        ),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(copy.filters, style: _wizardTitleStyle),
              Text(copy.filterStep(step + 1, stepCount)),
            ],
          ),
        ),
        if (hasFilters)
          TextButton(
            key: const Key('filter-wizard-clear'),
            onPressed: onClear,
            child: Text(copy.clearFilters),
          ),
      ],
    );
  }
}

class _WizardFooter extends StatelessWidget {
  const _WizardFooter({
    required this.step,
    required this.stepCount,
    required this.onBack,
    required this.onNext,
    required this.onApply,
  });

  final int step;
  final int stepCount;
  final VoidCallback onBack;
  final VoidCallback onNext;
  final VoidCallback onApply;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppColors.ink100)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                key: const Key('filter-wizard-apply'),
                onPressed: onApply,
                icon: const Icon(Icons.check),
                label: Text(copy.applyFilters),
              ),
            ),
            if (step > 0 || step < stepCount - 1) ...[
              const SizedBox(height: 8),
              _navigation(copy),
            ],
          ],
        ),
      ),
    );
  }

  Widget _navigation(AutoIqLocalizations copy) {
    return Row(
      children: [
        if (step > 0)
          Expanded(
            child: TextButton.icon(
              key: const Key('filter-wizard-back'),
              onPressed: onBack,
              icon: const Icon(Icons.arrow_back),
              label: Text(copy.back),
            ),
          ),
        if (step > 0 && step < stepCount - 1) const SizedBox(width: 8),
        if (step < stepCount - 1)
          Expanded(
            child: OutlinedButton.icon(
              key: const Key('filter-wizard-next'),
              onPressed: onNext,
              iconAlignment: IconAlignment.end,
              icon: const Icon(Icons.arrow_forward),
              label: Text(copy.next),
            ),
          ),
      ],
    );
  }
}

class _VehicleFilterStep extends StatelessWidget {
  const _VehicleFilterStep({
    required this.filters,
    required this.makes,
    required this.bodyTypes,
    required this.onChanged,
  });

  final ListingFilterState filters;
  final List<VehicleMake> makes;
  final List<ReferenceOption> bodyTypes;
  final ValueChanged<ListingFilterState> onChanged;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    final selectedMake = _makeFor(makes, filters.make);
    return _FilterStepBody(
      title: copy.vehicleFilterStep,
      description: copy.vehicleFilterStepDescription,
      children: [
        _makeDropdown(copy),
        const SizedBox(height: 16),
        _modelDropdown(copy, selectedMake),
        const SizedBox(height: 16),
        _bodyTypeDropdown(copy),
      ],
    );
  }

  Widget _makeDropdown(AutoIqLocalizations copy) {
    return _FilterDropdown<String?>(
      controlKey: 'browse-filter-make',
      label: copy.make,
      selectedValue: filters.make,
      items: [
        DropdownMenuItem(value: null, child: Text(copy.allMakes)),
        ...makes.map(
          (make) => DropdownMenuItem(
            value: make.name,
            child: Text(make.name),
          ),
        ),
      ],
      onChanged: (value) => onChanged(
        filters.copyWith(make: value, model: null),
      ),
    );
  }

  Widget _modelDropdown(
    AutoIqLocalizations copy,
    VehicleMake? selectedMake,
  ) {
    final models = selectedMake?.popularModels ?? const <String>[];
    return _FilterDropdown<String?>(
      controlKey: 'browse-filter-model',
      label: copy.model,
      selectedValue: filters.model,
      items: [
        DropdownMenuItem(value: null, child: Text(copy.allModels)),
        ...models.map(
          (model) => DropdownMenuItem(value: model, child: Text(model)),
        ),
      ],
      onChanged: selectedMake == null
          ? null
          : (value) => onChanged(filters.copyWith(model: value)),
    );
  }

  Widget _bodyTypeDropdown(AutoIqLocalizations copy) {
    return _optionDropdown(
      controlKey: 'browse-filter-body-type',
      label: copy.bodyType,
      emptyLabel: copy.allBodyTypes,
      selectedValue: filters.bodyType,
      options: bodyTypes,
      onChanged: (value) => onChanged(filters.copyWith(bodyType: value)),
    );
  }
}

class _BudgetFilterStep extends StatelessWidget {
  const _BudgetFilterStep({required this.filters, required this.onChanged});

  final ListingFilterState filters;
  final ValueChanged<ListingFilterState> onChanged;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return _FilterStepBody(
      title: copy.budgetFilterStep,
      description: copy.budgetFilterStepDescription,
      children: [
        _priceRange(copy),
        const SizedBox(height: 20),
        _yearRange(copy),
      ],
    );
  }

  Widget _priceRange(AutoIqLocalizations copy) {
    return _RangeDropdowns(
      title: copy.priceUsd,
      minimumKey: 'browse-filter-price-min',
      maximumKey: 'browse-filter-price-max',
      minimum: filters.priceMin,
      maximum: filters.priceMax,
      values: cataloguePriceOptions,
      minimumLabel: copy.minimum,
      maximumLabel: copy.maximum,
      anyMinimum: copy.anyMinimum,
      anyMaximum: copy.anyMaximum,
      formatValue: _formatUsd,
      onMinimumChanged: _changePriceMinimum,
      onMaximumChanged: _changePriceMaximum,
    );
  }

  Widget _yearRange(AutoIqLocalizations copy) {
    return _RangeDropdowns(
      title: copy.year,
      minimumKey: 'browse-filter-year-min',
      maximumKey: 'browse-filter-year-max',
      minimum: filters.yearMin,
      maximum: filters.yearMax,
      values: catalogueYearOptions,
      minimumLabel: copy.yearFrom,
      maximumLabel: copy.yearTo,
      anyMinimum: copy.anyYear,
      anyMaximum: copy.anyYear,
      formatValue: (value) => '$value',
      onMinimumChanged: _changeYearMinimum,
      onMaximumChanged: _changeYearMaximum,
    );
  }

  void _changePriceMinimum(int? value) => onChanged(
        filters.copyWith(
          priceMin: value,
          priceMax: _validMaximum(value, filters.priceMax),
        ),
      );

  void _changePriceMaximum(int? value) => onChanged(
        filters.copyWith(
          priceMin: _validMinimum(filters.priceMin, value),
          priceMax: value,
        ),
      );

  void _changeYearMinimum(int? value) => onChanged(
        filters.copyWith(
          yearMin: value,
          yearMax: _validMaximum(value, filters.yearMax),
        ),
      );

  void _changeYearMaximum(int? value) => onChanged(
        filters.copyWith(
          yearMin: _validMinimum(filters.yearMin, value),
          yearMax: value,
        ),
      );
}

class _UsageFilterStep extends StatelessWidget {
  const _UsageFilterStep({
    required this.filters,
    required this.transmissionTypes,
    required this.fuelTypes,
    required this.onChanged,
  });

  final ListingFilterState filters;
  final List<ReferenceOption> transmissionTypes;
  final List<ReferenceOption> fuelTypes;
  final ValueChanged<ListingFilterState> onChanged;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return _FilterStepBody(
      title: copy.usageFilterStep,
      description: copy.usageFilterStepDescription,
      children: [
        _mileageRange(copy),
        const SizedBox(height: 20),
        _transmissionDropdown(copy),
        const SizedBox(height: 16),
        _fuelDropdown(copy),
      ],
    );
  }

  Widget _mileageRange(AutoIqLocalizations copy) {
    return _RangeDropdowns(
      title: copy.mileage,
      minimumKey: 'browse-filter-mileage-min',
      maximumKey: 'browse-filter-mileage-max',
      minimum: filters.mileageMin,
      maximum: filters.mileageMax,
      values: catalogueMileageOptions,
      minimumLabel: copy.minimum,
      maximumLabel: copy.maximum,
      anyMinimum: copy.anyMinimum,
      anyMaximum: copy.anyMaximum,
      formatValue: _formatKm,
      onMinimumChanged: _changeMileageMinimum,
      onMaximumChanged: _changeMileageMaximum,
    );
  }

  Widget _transmissionDropdown(AutoIqLocalizations copy) {
    return _optionDropdown(
      controlKey: 'browse-filter-transmission',
      label: copy.transmission,
      emptyLabel: copy.anyTransmission,
      selectedValue: filters.transmission,
      options: transmissionTypes,
      onChanged: (value) => onChanged(filters.copyWith(transmission: value)),
    );
  }

  Widget _fuelDropdown(AutoIqLocalizations copy) {
    return _optionDropdown(
      controlKey: 'browse-filter-fuel-type',
      label: copy.fuelType,
      emptyLabel: copy.anyFuelType,
      selectedValue: filters.fuelType,
      options: fuelTypes,
      onChanged: (value) => onChanged(filters.copyWith(fuelType: value)),
    );
  }

  void _changeMileageMinimum(int? value) => onChanged(
        filters.copyWith(
          mileageMin: value,
          mileageMax: _validMaximum(value, filters.mileageMax),
        ),
      );

  void _changeMileageMaximum(int? value) => onChanged(
        filters.copyWith(
          mileageMin: _validMinimum(filters.mileageMin, value),
          mileageMax: value,
        ),
      );
}

class _LocationFilterStep extends StatelessWidget {
  const _LocationFilterStep({
    required this.filters,
    required this.cities,
    required this.onChanged,
  });

  final ListingFilterState filters;
  final List<String> cities;
  final ValueChanged<ListingFilterState> onChanged;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return _FilterStepBody(
      title: copy.locationFilterStep,
      description: copy.locationFilterStepDescription,
      children: [
        _locationDropdown(copy),
        const SizedBox(height: 20),
        _verifiedControl(copy),
      ],
    );
  }

  Widget _locationDropdown(AutoIqLocalizations copy) {
    return _FilterDropdown<String?>(
      controlKey: 'browse-filter-location',
      label: copy.location,
      selectedValue: filters.city,
      items: [
        DropdownMenuItem(value: null, child: Text(copy.allLocations)),
        ...cities.map(
          (city) => DropdownMenuItem(value: city, child: Text(city)),
        ),
      ],
      onChanged: (value) => onChanged(filters.copyWith(city: value)),
    );
  }

  Widget _verifiedControl(AutoIqLocalizations copy) {
    return Semantics(
      selected: filters.verifiedOnly,
      button: true,
      child: FilterChip(
        key: const Key('browse-filter-verified'),
        avatar: const Icon(Icons.verified_outlined, size: 18),
        label: Text(copy.verifiedOnly),
        selected: filters.verifiedOnly,
        onSelected: (selected) => onChanged(
          filters.copyWith(verifiedOnly: selected),
        ),
      ),
    );
  }
}

class _FilterStepBody extends StatelessWidget {
  const _FilterStepBody({
    required this.title,
    required this.description,
    required this.children,
  });

  final String title;
  final String description;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Column(
      key: Key('filter-step-content-$title'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: _stepTitleStyle),
        const SizedBox(height: 6),
        Text(description, style: _stepDescriptionStyle),
        const SizedBox(height: 24),
        ...children,
      ],
    );
  }
}

const _wizardTitleStyle = TextStyle(
  color: AppColors.ink900,
  fontSize: 18,
  fontWeight: FontWeight.w800,
);

const _stepTitleStyle = TextStyle(
  color: AppColors.ink900,
  fontSize: 24,
  fontWeight: FontWeight.w800,
);

const _stepDescriptionStyle = TextStyle(
  color: AppColors.ink500,
  fontSize: 14,
  height: 1.4,
);

List<_AppliedFilterItem> _appliedFilterItems(
  AutoIqLocalizations copy,
  ListingFilterState filters,
  List<ReferenceOption> bodyTypes,
  List<ReferenceOption> transmissionTypes,
  List<ReferenceOption> fuelTypes,
) {
  return [
    ..._vehicleAppliedItems(copy, filters, bodyTypes),
    ..._rangeAppliedItems(copy, filters),
    ..._preferenceAppliedItems(
      copy,
      filters,
      transmissionTypes,
      fuelTypes,
    ),
  ];
}

List<_AppliedFilterItem> _vehicleAppliedItems(
  AutoIqLocalizations copy,
  ListingFilterState filters,
  List<ReferenceOption> bodyTypes,
) {
  return [
    if (filters.make != null)
      _appliedItem(
        'make',
        copy.filterValue(copy.make, filters.make!),
        filters.copyWith(make: null, model: null),
      ),
    if (filters.model != null)
      _appliedItem(
        'model',
        copy.filterValue(copy.model, filters.model!),
        filters.copyWith(model: null),
      ),
    if (filters.bodyType != null)
      _appliedItem(
        'body-type',
        copy.filterValue(
          copy.bodyType,
          _optionLabel(bodyTypes, filters.bodyType!),
        ),
        filters.copyWith(bodyType: null),
      ),
  ];
}

List<_AppliedFilterItem> _rangeAppliedItems(
  AutoIqLocalizations copy,
  ListingFilterState filters,
) {
  final items = <_AppliedFilterItem>[];
  _addRangeItem(
    items,
    key: 'price',
    label: copy.priceUsd,
    minimum: filters.priceMin,
    maximum: filters.priceMax,
    formatter: _formatUsd,
    filtersWithout: filters.copyWith(priceMin: null, priceMax: null),
    copy: copy,
  );
  _addRangeItem(
    items,
    key: 'year',
    label: copy.year,
    minimum: filters.yearMin,
    maximum: filters.yearMax,
    formatter: (value) => '$value',
    filtersWithout: filters.copyWith(yearMin: null, yearMax: null),
    copy: copy,
  );
  _addRangeItem(
    items,
    key: 'mileage',
    label: copy.mileage,
    minimum: filters.mileageMin,
    maximum: filters.mileageMax,
    formatter: _formatKm,
    filtersWithout: filters.copyWith(mileageMin: null, mileageMax: null),
    copy: copy,
  );
  return items;
}

List<_AppliedFilterItem> _preferenceAppliedItems(
  AutoIqLocalizations copy,
  ListingFilterState filters,
  List<ReferenceOption> transmissionTypes,
  List<ReferenceOption> fuelTypes,
) {
  return [
    if (filters.city != null)
      _appliedItem(
        'location',
        copy.filterValue(copy.location, filters.city!),
        filters.copyWith(city: null),
      ),
    if (filters.transmission != null)
      _appliedItem(
        'transmission',
        copy.filterValue(
          copy.transmission,
          _optionLabel(transmissionTypes, filters.transmission!),
        ),
        filters.copyWith(transmission: null),
      ),
    if (filters.fuelType != null)
      _appliedItem(
        'fuel',
        copy.filterValue(
          copy.fuelType,
          _optionLabel(fuelTypes, filters.fuelType!),
        ),
        filters.copyWith(fuelType: null),
      ),
    if (filters.verifiedOnly)
      _appliedItem(
        'verified',
        copy.verifiedOnly,
        filters.copyWith(verifiedOnly: false),
      ),
  ];
}

void _addRangeItem(
  List<_AppliedFilterItem> items, {
  required String key,
  required String label,
  required int? minimum,
  required int? maximum,
  required String Function(int) formatter,
  required ListingFilterState filtersWithout,
  required AutoIqLocalizations copy,
}) {
  if (minimum == null && maximum == null) return;
  final value = _rangeValue(copy, minimum, maximum, formatter);
  items.add(_appliedItem(key, copy.filterValue(label, value), filtersWithout));
}

String _rangeValue(
  AutoIqLocalizations copy,
  int? minimum,
  int? maximum,
  String Function(int) formatter,
) {
  if (minimum != null && maximum != null) {
    return '${formatter(minimum)}–${formatter(maximum)}';
  }
  if (minimum != null) return copy.minimumFilterValue(formatter(minimum));
  return copy.maximumFilterValue(formatter(maximum!));
}

_AppliedFilterItem _appliedItem(
  String key,
  String label,
  ListingFilterState filtersWithout,
) {
  return _AppliedFilterItem(
    key: key,
    label: label,
    filtersWithout: filtersWithout,
  );
}

_FilterDropdown<String?> _optionDropdown({
  required String controlKey,
  required String label,
  required String emptyLabel,
  required String? selectedValue,
  required List<ReferenceOption> options,
  required ValueChanged<String?> onChanged,
}) {
  return _FilterDropdown<String?>(
    controlKey: controlKey,
    label: label,
    selectedValue: selectedValue,
    items: [
      DropdownMenuItem(value: null, child: Text(emptyLabel)),
      ...options.map(
        (option) => DropdownMenuItem(
          value: option.value,
          child: Text(option.label),
        ),
      ),
    ],
    onChanged: onChanged,
  );
}

VehicleMake? _makeFor(List<VehicleMake> makes, String? name) {
  for (final make in makes) {
    if (make.name == name) return make;
  }
  return null;
}

String _optionLabel(List<ReferenceOption> options, String value) {
  for (final option in options) {
    if (option.value == value) return option.label;
  }
  return value;
}

int? _validMaximum(int? minimum, int? maximum) {
  return minimum != null && maximum != null && minimum > maximum
      ? null
      : maximum;
}

int? _validMinimum(int? minimum, int? maximum) {
  return minimum != null && maximum != null && minimum > maximum
      ? null
      : minimum;
}

String _formatUsd(int value) => 'USD ${_withSeparators(value)}';

String _formatKm(int value) => '${_withSeparators(value)} km';

String _withSeparators(int value) {
  return value.toString().replaceAllMapped(
        RegExp(r'\B(?=(\d{3})+(?!\d))'),
        (_) => ',',
      );
}

class _RangeDropdowns extends StatelessWidget {
  const _RangeDropdowns({
    required this.title,
    required this.minimumKey,
    required this.maximumKey,
    required this.minimum,
    required this.maximum,
    required this.values,
    required this.minimumLabel,
    required this.maximumLabel,
    required this.anyMinimum,
    required this.anyMaximum,
    required this.formatValue,
    required this.onMinimumChanged,
    required this.onMaximumChanged,
  });

  final String title;
  final String minimumKey;
  final String maximumKey;
  final int? minimum;
  final int? maximum;
  final List<int> values;
  final String minimumLabel;
  final String maximumLabel;
  final String anyMinimum;
  final String anyMaximum;
  final String Function(int value) formatValue;
  final ValueChanged<int?> onMinimumChanged;
  final ValueChanged<int?> onMaximumChanged;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: AppColors.ink900,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _FilterDropdown<int?>(
                controlKey: minimumKey,
                label: minimumLabel,
                selectedValue: minimum,
                items: _items(anyMinimum, isMinimum: true),
                onChanged: onMinimumChanged,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _FilterDropdown<int?>(
                controlKey: maximumKey,
                label: maximumLabel,
                selectedValue: maximum,
                items: _items(anyMaximum, isMinimum: false),
                onChanged: onMaximumChanged,
              ),
            ),
          ],
        ),
      ],
    );
  }

  List<DropdownMenuItem<int?>> _items(
    String emptyLabel, {
    required bool isMinimum,
  }) {
    return [
      DropdownMenuItem(value: null, child: Text(emptyLabel)),
      ...values.map(
        (value) => DropdownMenuItem(
          value: value,
          enabled: _isValid(value, isMinimum: isMinimum),
          child: Text(formatValue(value)),
        ),
      ),
    ];
  }

  bool _isValid(int value, {required bool isMinimum}) {
    if (isMinimum) {
      return maximum == null || value <= maximum!;
    }
    return minimum == null || value >= minimum!;
  }
}

class _FilterDropdown<T> extends StatelessWidget {
  const _FilterDropdown({
    required this.controlKey,
    required this.label,
    required this.selectedValue,
    required this.items,
    required this.onChanged,
  });

  final String controlKey;
  final String label;
  final T selectedValue;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?>? onChanged;

  @override
  Widget build(BuildContext context) {
    return KeyedSubtree(
      key: Key(controlKey),
      child: DropdownButtonFormField<T>(
        key: ValueKey(selectedValue),
        initialValue: selectedValue,
        isExpanded: true,
        decoration: InputDecoration(labelText: label),
        items: items,
        onChanged: onChanged,
      ),
    );
  }
}

class _ListingCard extends StatelessWidget {
  const _ListingCard({
    required this.listing,
    required this.saved,
    required this.onTap,
  });

  final ListingCard listing;
  final bool saved;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Semantics(
      button: true,
      label: copy.formatText('listingCardLabel', {
        'title': listing.title,
        'city': listing.city,
        'price': listing.askPriceUsd.toStringAsFixed(0),
      }),
      child: SectionCard(
        padding: EdgeInsets.zero,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppRadii.lg),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.sm),
            child: LayoutBuilder(
              builder: (context, constraints) => constraints.maxWidth < 440
                  ? _compactCard(copy)
                  : _wideCard(copy),
            ),
          ),
        ),
      ),
    );
  }

  Widget _compactCard(AutoIqLocalizations copy) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _image(copy, height: 164),
        const SizedBox(height: AppSpacing.sm),
        _details(),
        const SizedBox(height: AppSpacing.xs),
        _status(copy),
      ],
    );
  }

  Widget _wideCard(AutoIqLocalizations copy) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(width: 110, child: _image(copy, height: 90)),
        const SizedBox(width: AppSpacing.sm),
        Expanded(child: _details()),
        _status(copy),
      ],
    );
  }

  Widget _image(AutoIqLocalizations copy, {required double height}) {
    return VehicleImageView(
      imageUrl: listing.coverImageUrl,
      height: height,
      semanticLabel: copy.formatText(
        'vehiclePhoto',
        {'title': listing.title},
      ),
    );
  }

  Widget _details() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (listing.bisellVerified) const VerifiedBadge(),
        const SizedBox(height: AppSpacing.xs),
        Text(
          listing.title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: AppColors.ink900,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '${listing.city} · ${listing.bodyType}',
          style: const TextStyle(fontSize: 13, color: AppColors.ink500),
        ),
        const SizedBox(height: AppSpacing.xs),
        PriceDisplay(
          amount: listing.askPriceUsd.toStringAsFixed(0),
          fontSize: 18,
        ),
      ],
    );
  }

  Widget _status(AutoIqLocalizations copy) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        if (listing.inspectionScore != null)
          Semantics(
            label: copy.formatText(
              'inspectionScoreLabel',
              {'score': listing.inspectionScore!},
            ),
            excludeSemantics: true,
            child: StatusChip(label: '${listing.inspectionScore}/100'),
          ),
        const SizedBox(height: AppSpacing.sm),
        Icon(
          saved ? Icons.bookmark : Icons.chevron_right,
          color: AppColors.ink400,
        ),
      ],
    );
  }
}

class _PaginationError extends StatelessWidget {
  const _PaginationError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Semantics(
      liveRegion: true,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
        child: Row(
          children: [
            const Icon(Icons.cloud_off_outlined, color: AppColors.reject),
            const SizedBox(width: AppSpacing.xs),
            Expanded(child: Text(message)),
            TextButton(onPressed: onRetry, child: Text(copy.retry)),
          ],
        ),
      ),
    );
  }
}

class _SavedTab extends StatelessWidget {
  const _SavedTab({
    required this.future,
    required this.onOpenListing,
    required this.onRefresh,
  });

  final Future<List<SavedVehicleItem>> future;
  final Future<void> Function(String listingId, {bool saved}) onOpenListing;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<SavedVehicleItem>>(
      future: future,
      builder: (context, snapshot) {
        final copy = AutoIqLocalizations.of(context);
        if (snapshot.connectionState != ConnectionState.done) {
          return AppLoadingView(label: copy.text('loadingSavedVehicles'));
        }
        if (snapshot.hasError) {
          return _ActivityError(
            title: copy.text('savedVehiclesUnavailable'),
            error: snapshot.error,
            onRetry: onRefresh,
          );
        }
        final items = snapshot.data ?? const <SavedVehicleItem>[];
        if (items.isEmpty) {
          return EmptyState(
            title: copy.text('noSavedVehicles'),
            message: copy.text('noSavedVehiclesMessage'),
            action: OutlinedButton(
              onPressed: onRefresh,
              child: Text(copy.text('refresh')),
            ),
          );
        }
        return RefreshIndicator(
          onRefresh: onRefresh,
          child: LayoutBuilder(
            builder: (context, constraints) => ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: adaptivePageInsets(constraints.maxWidth),
              itemCount: items.length,
              separatorBuilder: (_, __) =>
                  const SizedBox(height: AppSpacing.sm),
              itemBuilder: (context, index) {
                final item = items[index];
                return _ListingCard(
                  listing: item.listing,
                  saved: true,
                  onTap: () => onOpenListing(item.listing.id, saved: true),
                );
              },
            ),
          ),
        );
      },
    );
  }
}

class _RequestsTab extends StatelessWidget {
  const _RequestsTab({
    required this.quotesFuture,
    required this.requestFuture,
    required this.onCreateRequest,
    required this.onRefresh,
  });

  final Future<List<QuoteItem>> quotesFuture;
  final Future<List<VehicleRequestItem>> requestFuture;
  final Future<void> Function() onCreateRequest;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          SectionCard(
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        copy.text('needDifferentVehicle'),
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppColors.ink900,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        copy.text('sourcingPitch'),
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.ink500,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton.icon(
                  onPressed: onCreateRequest,
                  icon: const Icon(Icons.add),
                  label: Text(copy.text('newAction')),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text(
            copy.text('quotesTitle'),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.ink900,
            ),
          ),
          const SizedBox(height: 10),
          FutureBuilder<List<QuoteItem>>(
            future: quotesFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return _InlineLoading(
                  label: copy.text('loadingQuoteRequests'),
                );
              }
              if (snapshot.hasError) {
                return _InlineError(error: snapshot.error, onRetry: onRefresh);
              }
              final items = snapshot.data ?? const <QuoteItem>[];
              if (items.isEmpty) {
                return EmptyState(
                  title: copy.text('noQuoteRequests'),
                  message: copy.text('noQuoteRequestsMessage'),
                );
              }
              return Column(
                children: items
                    .map(
                      (item) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: SectionCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Wrap(
                                spacing: AppSpacing.xs,
                                runSpacing: AppSpacing.xs,
                                alignment: WrapAlignment.spaceBetween,
                                children: [
                                  Text(
                                    copy.formatText('offerUsd', {
                                      'amount':
                                          item.offerPriceUsd.toStringAsFixed(0),
                                    }),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.ink900,
                                    ),
                                  ),
                                  StatusChip(label: item.status),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                copy.formatText('askUsdPlan', {
                                  'amount': item.askPriceUsd.toStringAsFixed(0),
                                  'plan': item.paymentPlan.replaceAll('_', ' '),
                                }),
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: AppColors.ink500,
                                ),
                              ),
                              if (item.responseNote != null) ...[
                                const SizedBox(height: 8),
                                Text(
                                  item.responseNote!,
                                  style: const TextStyle(fontSize: 13),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    )
                    .toList(growable: false),
              );
            },
          ),
          const SizedBox(height: 16),
          Text(
            copy.text('sourcingRequestsTitle'),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.ink900,
            ),
          ),
          const SizedBox(height: 10),
          FutureBuilder<List<VehicleRequestItem>>(
            future: requestFuture,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return _InlineLoading(
                  label: copy.text('loadingSourcingRequests'),
                );
              }
              if (snapshot.hasError) {
                return _InlineError(error: snapshot.error, onRetry: onRefresh);
              }
              final items = snapshot.data ?? const <VehicleRequestItem>[];
              if (items.isEmpty) {
                return EmptyState(
                  title: copy.text('noSourcingRequests'),
                  message: copy.text('noSourcingRequestsMessage'),
                );
              }
              return Column(
                children: items
                    .map(
                      (item) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: SectionCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Wrap(
                                spacing: AppSpacing.xs,
                                runSpacing: AppSpacing.xs,
                                alignment: WrapAlignment.spaceBetween,
                                children: [
                                  Text(
                                    '${item.makeName ?? copy.text('anyMake')} ${item.model ?? ''}'
                                        .trim(),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.ink900,
                                    ),
                                  ),
                                  StatusChip(label: item.status),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                copy.formatText('budgetUsdUrgency', {
                                  'amount': (item.maxBudgetCents / 100)
                                      .toStringAsFixed(0),
                                  'urgency': item.urgency.replaceAll('_', ' '),
                                }),
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: AppColors.ink500,
                                ),
                              ),
                              if (item.adminNote != null) ...[
                                const SizedBox(height: 8),
                                Text(item.adminNote!),
                              ],
                            ],
                          ),
                        ),
                      ),
                    )
                    .toList(growable: false),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _ViewingsTab extends StatelessWidget {
  const _ViewingsTab({required this.future, required this.onRefresh});

  final Future<List<ViewingItem>> future;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<ViewingItem>>(
      future: future,
      builder: (context, snapshot) {
        final copy = AutoIqLocalizations.of(context);
        if (snapshot.connectionState != ConnectionState.done) {
          return AppLoadingView(label: copy.text('loadingViewings'));
        }
        if (snapshot.hasError) {
          return _ActivityError(
            title: copy.text('viewingsUnavailable'),
            error: snapshot.error,
            onRetry: onRefresh,
          );
        }
        final items = snapshot.data ?? const <ViewingItem>[];
        if (items.isEmpty) {
          return EmptyState(
            title: copy.text('noViewingsScheduled'),
            message: copy.text('noViewingsScheduledMessage'),
            action: OutlinedButton(
              onPressed: onRefresh,
              child: Text(copy.text('refresh')),
            ),
          );
        }
        return RefreshIndicator(
          onRefresh: onRefresh,
          child: ListView.separated(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(AppSpacing.md),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final item = items[index];
              final displaySlot = item.confirmedSlot ?? item.preferredSlot;
              return SectionCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            item.snapshotTitle,
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              color: AppColors.ink900,
                            ),
                          ),
                        ),
                        StatusChip(label: item.status),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      AppFormatters.dateTime(
                        context,
                        DateTime.parse(displaySlot).toLocal(),
                      ),
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.ink500,
                      ),
                    ),
                    if (item.location != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        item.location!.displayLine,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.ink500,
                        ),
                      ),
                    ],
                    if (item.outcomeNote != null) ...[
                      const SizedBox(height: 8),
                      Text(item.outcomeNote!),
                    ],
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }
}

class _InlineLoading extends StatelessWidget {
  const _InlineLoading({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return SizedBox(height: 140, child: AppLoadingView(label: label));
  }
}

class _InlineError extends StatelessWidget {
  const _InlineError({required this.error, required this.onRetry});

  final Object? error;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return EmptyState(
      icon: Icons.cloud_off_outlined,
      title: copy.text('unableToLoadSection'),
      message: _activityErrorMessage(context, error),
      action: TextButton(onPressed: onRetry, child: Text(copy.retry)),
    );
  }
}

class _ActivityError extends StatelessWidget {
  const _ActivityError({
    required this.title,
    required this.error,
    required this.onRetry,
  });

  final String title;
  final Object? error;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return EmptyState(
      icon: Icons.cloud_off_outlined,
      title: title,
      message: _activityErrorMessage(context, error),
      action: ElevatedButton(onPressed: onRetry, child: Text(copy.retry)),
    );
  }
}

String _activityErrorMessage(BuildContext context, Object? error) {
  if (error is ApiException) return error.supportMessage;
  return AutoIqLocalizations.of(context).text('checkConnection');
}

class _BuyerAccountTab extends StatefulWidget {
  const _BuyerAccountTab({
    required this.userName,
    required this.email,
    required this.city,
    required this.vehiclePurpose,
    required this.searchRadiusKm,
    required this.deliveryPreference,
    required this.paymentPreference,
    required this.preferredFuelTypes,
    required this.preferredTransmissions,
    required this.minSeats,
    required this.maxMileageKm,
    required this.yearMin,
    required this.yearMax,
    required this.budgetMin,
    required this.budgetMax,
    required this.fuelTypes,
    required this.transmissionTypes,
  });

  final String userName;
  final String email;
  final String city;
  final String? vehiclePurpose;
  final int? searchRadiusKm;
  final String? deliveryPreference;
  final String? paymentPreference;
  final List<String> preferredFuelTypes;
  final List<String> preferredTransmissions;
  final int? minSeats;
  final int? maxMileageKm;
  final int? yearMin;
  final int? yearMax;
  final double? budgetMin;
  final double? budgetMax;
  final List<ReferenceOption> fuelTypes;
  final List<ReferenceOption> transmissionTypes;

  @override
  State<_BuyerAccountTab> createState() => _BuyerAccountTabState();
}

class _BuyerAccountTabState extends State<_BuyerAccountTab> {
  late final TextEditingController _nameController;
  late final TextEditingController _cityController;
  late final TextEditingController _searchRadiusController;
  late final TextEditingController _budgetMinController;
  late final TextEditingController _budgetMaxController;
  late final TextEditingController _minSeatsController;
  late final TextEditingController _maxMileageController;
  late final TextEditingController _yearMinController;
  late final TextEditingController _yearMaxController;
  late String _vehiclePurpose;
  late String _deliveryPreference;
  late String _paymentPreference;
  late Set<String> _preferredFuelTypes;
  late Set<String> _preferredTransmissions;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.userName);
    _cityController = TextEditingController(text: widget.city);
    _searchRadiusController = TextEditingController(
      text: widget.searchRadiusKm?.toString() ?? '',
    );
    _budgetMinController = TextEditingController(
      text: widget.budgetMin?.toStringAsFixed(0) ?? '',
    );
    _budgetMaxController = TextEditingController(
      text: widget.budgetMax?.toStringAsFixed(0) ?? '',
    );
    _minSeatsController = TextEditingController(
      text: widget.minSeats?.toString() ?? '',
    );
    _maxMileageController = TextEditingController(
      text: widget.maxMileageKm?.toString() ?? '',
    );
    _yearMinController = TextEditingController(
      text: widget.yearMin?.toString() ?? '',
    );
    _yearMaxController = TextEditingController(
      text: widget.yearMax?.toString() ?? '',
    );
    _vehiclePurpose = widget.vehiclePurpose ?? '';
    _deliveryPreference = widget.deliveryPreference ?? '';
    _paymentPreference = widget.paymentPreference ?? '';
    _preferredFuelTypes = widget.preferredFuelTypes.toSet();
    _preferredTransmissions = widget.preferredTransmissions.toSet();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _cityController.dispose();
    _searchRadiusController.dispose();
    _budgetMinController.dispose();
    _budgetMaxController.dispose();
    _minSeatsController.dispose();
    _maxMileageController.dispose();
    _yearMinController.dispose();
    _yearMaxController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionController>();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.email,
                style: const TextStyle(fontSize: 13, color: AppColors.ink500),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Full name'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _cityController,
                decoration: const InputDecoration(labelText: 'City'),
              ),
              const SizedBox(height: 20),
              const Text(
                'Buying plan',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              _dropdown(
                label: 'Vehicle purpose',
                value: _vehiclePurpose,
                options: _vehiclePurposeOptions,
                onChanged: (value) => setState(() => _vehiclePurpose = value),
              ),
              const SizedBox(height: 12),
              _dropdown(
                label: 'Payment preference',
                value: _paymentPreference,
                options: _paymentPreferenceOptions,
                onChanged: (value) =>
                    setState(() => _paymentPreference = value),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _budgetMinController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Budget min',
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _budgetMaxController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Budget max',
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _searchRadiusController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Search radius (km)',
                ),
              ),
              const SizedBox(height: 12),
              _dropdown(
                label: 'Delivery preference',
                value: _deliveryPreference,
                options: _deliveryPreferenceOptions,
                onChanged: (value) =>
                    setState(() => _deliveryPreference = value),
              ),
              const SizedBox(height: 20),
              const Text(
                'Vehicle requirements',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              _choiceChips(
                label: 'Fuel types',
                options: widget.fuelTypes.isEmpty
                    ? _defaultFuelTypes
                    : widget.fuelTypes,
                selected: _preferredFuelTypes,
                onToggle: (value, selected) => setState(() {
                  selected
                      ? _preferredFuelTypes.add(value)
                      : _preferredFuelTypes.remove(value);
                }),
              ),
              const SizedBox(height: 12),
              _choiceChips(
                label: 'Transmissions',
                options: widget.transmissionTypes.isEmpty
                    ? _defaultTransmissionTypes
                    : widget.transmissionTypes,
                selected: _preferredTransmissions,
                onToggle: (value, selected) => setState(() {
                  selected
                      ? _preferredTransmissions.add(value)
                      : _preferredTransmissions.remove(value);
                }),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _minSeatsController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Minimum seats',
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _maxMileageController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'Max mileage (km)',
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _yearMinController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Year min'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _yearMaxController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Year max'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed:
                          session.isBusy ? null : () => _save(context, session),
                      child: const Text('Save profile'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  OutlinedButton(
                    onPressed: session.isBusy ? null : session.logout,
                    child: const Text('Logout'),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const AccountDeletionCard(),
      ],
    );
  }

  Widget _dropdown({
    required String label,
    required String value,
    required Map<String, String> options,
    required ValueChanged<String> onChanged,
  }) {
    return DropdownButtonFormField<String>(
      initialValue: value,
      decoration: InputDecoration(labelText: label),
      items: [
        const DropdownMenuItem(value: '', child: Text('No preference')),
        ...options.entries.map(
          (option) =>
              DropdownMenuItem(value: option.key, child: Text(option.value)),
        ),
      ],
      onChanged: (next) => onChanged(next ?? ''),
    );
  }

  Widget _choiceChips({
    required String label,
    required List<ReferenceOption> options,
    required Set<String> selected,
    required void Function(String value, bool selected) onToggle,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: options.map((option) {
            return FilterChip(
              label: Text(option.label),
              selected: selected.contains(option.value),
              onSelected: (active) => onToggle(option.value, active),
            );
          }).toList(growable: false),
        ),
      ],
    );
  }

  Future<void> _save(BuildContext context, SessionController session) async {
    final validation = _validate();
    if (validation != null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(validation)));
      return;
    }
    final fuelTypes = _preferredFuelTypes.toList()..sort();
    final transmissions = _preferredTransmissions.toList()..sort();
    try {
      await session.updateProfile({
        'fullName': _nameController.text.trim(),
        'city': _cityController.text.trim(),
        'vehiclePurpose': _nullableChoice(_vehiclePurpose),
        'searchRadiusKm': _optionalInt(_searchRadiusController),
        'deliveryPreference': _nullableChoice(_deliveryPreference),
        'paymentPreference': _nullableChoice(_paymentPreference),
        'preferredFuelTypes': fuelTypes,
        'preferredTransmissions': transmissions,
        'minSeats': _optionalInt(_minSeatsController),
        'maxMileageKm': _optionalInt(_maxMileageController),
        'yearMin': _optionalInt(_yearMinController),
        'yearMax': _optionalInt(_yearMaxController),
        'budgetMin': double.tryParse(_budgetMinController.text.trim()),
        'budgetMax': double.tryParse(_budgetMaxController.text.trim()),
      });
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Profile updated.')));
    } on ApiException catch (error) {
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.message)));
    }
  }

  String? _validate() {
    if (_nameController.text.trim().isEmpty) {
      return 'Full name is required.';
    }
    if (_cityController.text.trim().isEmpty) {
      return 'City is required.';
    }
    final budgetMinText = _budgetMinController.text.trim();
    final budgetMaxText = _budgetMaxController.text.trim();
    final budgetMin = double.tryParse(budgetMinText);
    final budgetMax = double.tryParse(budgetMaxText);
    if (budgetMinText.isNotEmpty && budgetMin == null) {
      return 'Minimum budget must be a number.';
    }
    if (budgetMaxText.isNotEmpty && budgetMax == null) {
      return 'Maximum budget must be a number.';
    }
    if (budgetMin != null && budgetMin < 0) {
      return 'Minimum budget cannot be negative.';
    }
    if (budgetMax != null && budgetMax < 0) {
      return 'Maximum budget cannot be negative.';
    }
    if (budgetMin != null && budgetMax != null && budgetMin > budgetMax) {
      return 'Minimum budget cannot be greater than maximum budget.';
    }
    final radiusError = _integerError(
      _searchRadiusController,
      'Search radius',
      1,
      1000,
    );
    if (radiusError != null) return radiusError;
    final seatsError = _integerError(
      _minSeatsController,
      'Minimum seats',
      1,
      100,
    );
    if (seatsError != null) return seatsError;
    final mileageError = _integerError(
      _maxMileageController,
      'Maximum mileage',
      0,
      10000000,
    );
    if (mileageError != null) return mileageError;
    final yearMinError = _integerError(
      _yearMinController,
      'Minimum year',
      1886,
      2200,
    );
    if (yearMinError != null) return yearMinError;
    final yearMaxError = _integerError(
      _yearMaxController,
      'Maximum year',
      1886,
      2200,
    );
    if (yearMaxError != null) return yearMaxError;
    final yearMin = _optionalInt(_yearMinController);
    final yearMax = _optionalInt(_yearMaxController);
    return yearMin != null && yearMax != null && yearMin > yearMax
        ? 'Minimum year cannot be greater than maximum year.'
        : null;
  }

  String? _integerError(
    TextEditingController controller,
    String label,
    int min,
    int max,
  ) {
    final text = controller.text.trim();
    if (text.isEmpty) return null;
    final value = int.tryParse(text);
    return value != null && value >= min && value <= max
        ? null
        : '$label must be between $min and $max.';
  }

  int? _optionalInt(TextEditingController controller) {
    return int.tryParse(controller.text.trim());
  }

  String? _nullableChoice(String value) => value.isEmpty ? null : value;
}

const _vehiclePurposeOptions = {
  'PERSONAL': 'Personal use',
  'FAMILY': 'Family use',
  'BUSINESS': 'Business use',
  'RIDE_HAILING': 'Taxi or ride hailing',
  'DELIVERY': 'Delivery work',
  'OTHER': 'Other',
};

const _deliveryPreferenceOptions = {
  'PICKUP': 'I can collect',
  'DELIVERY': 'Delivery required',
  'EITHER': 'Either',
};

const _paymentPreferenceOptions = {
  'CASH': 'Cash',
  'FINANCE': 'Finance',
  'EITHER': 'Cash or finance',
};

const _defaultFuelTypes = [
  ReferenceOption(value: 'PETROL', label: 'Petrol'),
  ReferenceOption(value: 'DIESEL', label: 'Diesel'),
  ReferenceOption(value: 'HYBRID', label: 'Hybrid'),
  ReferenceOption(value: 'ELECTRIC', label: 'Electric'),
  ReferenceOption(value: 'OTHER', label: 'Other'),
];

const _defaultTransmissionTypes = [
  ReferenceOption(value: 'AUTOMATIC', label: 'Automatic'),
  ReferenceOption(value: 'MANUAL', label: 'Manual'),
  ReferenceOption(value: 'CVT', label: 'CVT'),
  ReferenceOption(value: 'DSG', label: 'DSG'),
];
