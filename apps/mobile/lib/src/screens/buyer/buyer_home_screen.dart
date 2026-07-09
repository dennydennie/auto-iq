import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../theme/app_colors.dart';
import '../../../widgets/price_display.dart';
import '../../../widgets/verified_badge.dart';
import '../../core/network/api_exception.dart';
import '../../models/activity_models.dart';
import '../../models/listing_models.dart';
import '../../models/reference_data.dart';
import '../../repositories/buyer_repository.dart';
import '../../state/session_controller.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/section_card.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/vehicle_image.dart';
import 'listing_detail_screen.dart';

class BuyerHomeScreen extends StatefulWidget {
  const BuyerHomeScreen({super.key});

  @override
  State<BuyerHomeScreen> createState() => _BuyerHomeScreenState();
}

class _BuyerHomeScreenState extends State<BuyerHomeScreen> {
  int _tabIndex = 0;
  late Future<ListingViewState> _browseFuture;
  late Future<List<SavedVehicleItem>> _savedFuture;
  late Future<List<QuoteItem>> _quotesFuture;
  late Future<List<VehicleRequestItem>> _requestFuture;
  late Future<List<ViewingItem>> _viewingsFuture;
  String _searchText = '';
  String? _selectedBodyType;
  bool _verifiedOnly = false;

  @override
  void initState() {
    super.initState();
    _browseFuture = _loadBrowse();
    _savedFuture = _loadSaved();
    _quotesFuture = _loadQuotes();
    _requestFuture = _loadRequests();
    _viewingsFuture = _loadViewings();
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionController>();
    final user = session.user!;
    final body = IndexedStack(
      index: _tabIndex,
      children: [
        _BrowseTab(
          future: _browseFuture,
          searchText: _searchText,
          selectedBodyType: _selectedBodyType,
          verifiedOnly: _verifiedOnly,
          onSearchChanged: (value) => setState(() => _searchText = value),
          onToggleVerified: () => setState(() {
            _verifiedOnly = !_verifiedOnly;
            _browseFuture = _loadBrowse();
          }),
          onBodyTypeChanged: (value) => setState(() {
            _selectedBodyType = value;
            _browseFuture = _loadBrowse();
          }),
          bodyTypes: session.referenceData?.bodyTypes ?? const [],
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
        ),
        _ViewingsTab(
          future: _viewingsFuture,
          onRefresh: _refreshViewings,
        ),
        _BuyerAccountTab(
          userName: user.fullName,
          email: user.email,
          city: user.city,
          budgetMin: user.buyerProfile?.budgetMin,
          budgetMax: user.buyerProfile?.budgetMax,
        ),
      ],
    );

    return Scaffold(
      appBar: AppBar(
        title: Text('Mhoro, ${user.fullName.split(' ').first}'),
        actions: [
          IconButton(
            tooltip: 'Refresh profile',
            onPressed: session.isBusy ? null : session.refreshProfile,
            icon: const Icon(Icons.sync_outlined),
          ),
        ],
      ),
      body: body,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tabIndex,
        onDestinationSelected: (index) => setState(() => _tabIndex = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.search_outlined),
            selectedIcon: Icon(Icons.search),
            label: 'Browse',
          ),
          NavigationDestination(
            icon: Icon(Icons.bookmark_border_outlined),
            selectedIcon: Icon(Icons.bookmark),
            label: 'Saved',
          ),
          NavigationDestination(
            icon: Icon(Icons.request_page_outlined),
            selectedIcon: Icon(Icons.request_page),
            label: 'Requests',
          ),
          NavigationDestination(
            icon: Icon(Icons.event_note_outlined),
            selectedIcon: Icon(Icons.event_note),
            label: 'Viewings',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Account',
          ),
        ],
      ),
    );
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
          },
        ),
      ),
    );
    await _refreshSaved();
    await _refreshQuotes();
    await _refreshViewings();
  }

  Future<void> _openRequestDialog() async {
    final makes =
        context.read<SessionController>().referenceData?.makes ?? const [];
    final bodyTypes =
        context.read<SessionController>().referenceData?.bodyTypes ?? const [];
    final fuelTypes =
        context.read<SessionController>().referenceData?.fuelTypes ?? const [];
    final transmissions =
        context.read<SessionController>().referenceData?.transmissionTypes ??
            const [];
    final budgetController = TextEditingController();
    final modelController = TextEditingController();
    final yearMinController = TextEditingController();
    final yearMaxController = TextEditingController();
    final odometerController = TextEditingController();
    final notesController = TextEditingController();
    String urgency = 'ASAP';
    String? makeId = makes.isNotEmpty ? makes.first.id : null;
    String? bodyTypeId = bodyTypes.isNotEmpty ? bodyTypes.first.value : null;
    String? fuelTypeId = fuelTypes.isNotEmpty ? fuelTypes.first.value : null;
    String? transmissionId =
        transmissions.isNotEmpty ? transmissions.first.value : null;
    final formKey = GlobalKey<FormState>();
    final created = await showDialog<bool>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Request a vehicle'),
              content: SingleChildScrollView(
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      TextFormField(
                        controller: budgetController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Max budget (USD)',
                        ),
                        validator: _required,
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        initialValue: makeId,
                        decoration: const InputDecoration(labelText: 'Make'),
                        items: makes
                            .map(
                              (make) => DropdownMenuItem(
                                value: make.id,
                                child: Text(make.name),
                              ),
                            )
                            .toList(growable: false),
                        onChanged: (value) => makeId = value,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: modelController,
                        decoration: const InputDecoration(labelText: 'Model'),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: yearMinController,
                              keyboardType: TextInputType.number,
                              decoration:
                                  const InputDecoration(labelText: 'Year min'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              controller: yearMaxController,
                              keyboardType: TextInputType.number,
                              decoration:
                                  const InputDecoration(labelText: 'Year max'),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        initialValue: bodyTypeId,
                        decoration:
                            const InputDecoration(labelText: 'Body type'),
                        items: bodyTypes
                            .map(
                              (item) => DropdownMenuItem(
                                value: item.value,
                                child: Text(item.label),
                              ),
                            )
                            .toList(growable: false),
                        onChanged: (value) => bodyTypeId = value,
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        initialValue: fuelTypeId,
                        decoration:
                            const InputDecoration(labelText: 'Fuel type'),
                        items: fuelTypes
                            .map(
                              (item) => DropdownMenuItem(
                                value: item.value,
                                child: Text(item.label),
                              ),
                            )
                            .toList(growable: false),
                        onChanged: (value) => fuelTypeId = value,
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        initialValue: transmissionId,
                        decoration:
                            const InputDecoration(labelText: 'Transmission'),
                        items: transmissions
                            .map(
                              (item) => DropdownMenuItem(
                                value: item.value,
                                child: Text(item.label),
                              ),
                            )
                            .toList(growable: false),
                        onChanged: (value) => transmissionId = value,
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: odometerController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Max odometer (km)',
                        ),
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        initialValue: urgency,
                        decoration: const InputDecoration(labelText: 'Urgency'),
                        items: const [
                          DropdownMenuItem(value: 'ASAP', child: Text('ASAP')),
                          DropdownMenuItem(
                            value: 'ONE_MONTH',
                            child: Text('Within one month'),
                          ),
                          DropdownMenuItem(
                            value: 'BROWSING',
                            child: Text('Still browsing'),
                          ),
                        ],
                        onChanged: (value) =>
                            setDialogState(() => urgency = value ?? urgency),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: notesController,
                        minLines: 3,
                        maxLines: 4,
                        decoration: const InputDecoration(labelText: 'Notes'),
                      ),
                    ],
                  ),
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () async {
                    if (!formKey.currentState!.validate()) {
                      return;
                    }
                    try {
                      await context
                          .read<BuyerRepository>()
                          .createVehicleRequest(
                            maxBudgetCents:
                                (double.parse(budgetController.text) * 100)
                                    .round(),
                            makeId: makeId,
                            model: modelController.text,
                            yearMin: _nullableInt(yearMinController.text),
                            yearMax: _nullableInt(yearMaxController.text),
                            bodyTypeId: bodyTypeId,
                            fuelTypeId: fuelTypeId,
                            transmissionTypeId: transmissionId,
                            maxOdometerKm:
                                _nullableInt(odometerController.text),
                            urgency: urgency,
                            notes: notesController.text,
                          );
                      if (context.mounted) {
                        Navigator.of(context).pop(true);
                      }
                    } on ApiException catch (error) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(error.message)),
                        );
                      }
                    }
                  },
                  child: const Text('Create'),
                ),
              ],
            );
          },
        );
      },
    );
    if (created == true) {
      await _refreshRequests();
    }
  }

  Future<ListingViewState> _loadBrowse() async {
    final repository = context.read<BuyerRepository>();
    final listings = await repository.browseAll(
      bodyType: _selectedBodyType,
      verifiedOnly: _verifiedOnly ? true : null,
    );
    final savedItems = await repository.savedVehicles();
    final savedIds = savedItems.map((item) => item.listing.id).toSet();
    return ListingViewState(
      listings: listings,
      savedIds: savedIds,
    );
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
    setState(() => _browseFuture = _loadBrowse());
    await _browseFuture;
  }

  Future<void> _refreshSaved() async {
    setState(() => _savedFuture = _loadSaved());
    await _savedFuture;
  }

  Future<void> _refreshQuotes() async {
    setState(() => _quotesFuture = _loadQuotes());
    await _quotesFuture;
  }

  Future<void> _refreshRequests() async {
    setState(() => _requestFuture = _loadRequests());
    await _requestFuture;
  }

  Future<void> _refreshViewings() async {
    setState(() => _viewingsFuture = _loadViewings());
    await _viewingsFuture;
  }

  String? _required(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Required';
    }
    return null;
  }

  int? _nullableInt(String value) {
    if (value.trim().isEmpty) {
      return null;
    }
    return int.tryParse(value.trim());
  }
}

class ListingViewState {
  ListingViewState({
    required this.listings,
    required this.savedIds,
  });

  final List<ListingCard> listings;
  final Set<String> savedIds;
}

class _BrowseTab extends StatelessWidget {
  const _BrowseTab({
    required this.future,
    required this.searchText,
    required this.selectedBodyType,
    required this.verifiedOnly,
    required this.onSearchChanged,
    required this.onToggleVerified,
    required this.onBodyTypeChanged,
    required this.bodyTypes,
    required this.onOpenListing,
    required this.onRefresh,
  });

  final Future<ListingViewState> future;
  final String searchText;
  final String? selectedBodyType;
  final bool verifiedOnly;
  final ValueChanged<String> onSearchChanged;
  final VoidCallback onToggleVerified;
  final ValueChanged<String?> onBodyTypeChanged;
  final List<ReferenceOption> bodyTypes;
  final Future<void> Function(String listingId, {bool saved}) onOpenListing;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<ListingViewState>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return EmptyState(
            title: 'Catalogue unavailable',
            message: 'Check the local API and refresh the app.',
            action: ElevatedButton(
              onPressed: onRefresh,
              child: const Text('Retry'),
            ),
          );
        }
        final viewState = snapshot.data!;
        final filtered = viewState.listings.where((listing) {
          final query = searchText.trim().toLowerCase();
          if (query.isEmpty) {
            return true;
          }
          return listing.title.toLowerCase().contains(query) ||
              listing.city.toLowerCase().contains(query);
        }).toList(growable: false);
        if (filtered.isEmpty) {
          return RefreshIndicator(
            onRefresh: onRefresh,
            child: ListView(
              children: [
                const SizedBox(height: 120),
                EmptyState(
                  title: 'No published vehicles',
                  message:
                      'Seed a published listing or widen the current filters.',
                  action: OutlinedButton(
                    onPressed: onToggleVerified,
                    child: const Text('Toggle verified filter'),
                  ),
                ),
              ],
            ),
          );
        }
        return RefreshIndicator(
          onRefresh: onRefresh,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              TextField(
                onChanged: onSearchChanged,
                decoration: const InputDecoration(
                  prefixIcon: Icon(Icons.search_outlined),
                  labelText: 'Search by make, model, or city',
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<String?>(
                      initialValue: selectedBodyType,
                      decoration: const InputDecoration(labelText: 'Body type'),
                      items: [
                        const DropdownMenuItem<String?>(
                          value: null,
                          child: Text('All body types'),
                        ),
                        ...bodyTypes.map(
                          (type) => DropdownMenuItem<String?>(
                            value: type.value,
                            child: Text(type.label),
                          ),
                        ),
                      ],
                      onChanged: onBodyTypeChanged,
                    ),
                  ),
                  const SizedBox(width: 12),
                  FilterChip(
                    label: const Text('Verified'),
                    selected: verifiedOnly,
                    onSelected: (_) => onToggleVerified(),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              ...filtered.map(
                (listing) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: GestureDetector(
                    onTap: () => onOpenListing(
                      listing.id,
                      saved: viewState.savedIds.contains(listing.id),
                    ),
                    child: SectionCard(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SizedBox(
                            width: 110,
                            child: VehicleImageView(
                              imageUrl: listing.coverImageUrl,
                              height: 90,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                if (listing.bisellVerified)
                                  const VerifiedBadge(),
                                const SizedBox(height: 8),
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
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: AppColors.ink500,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                PriceDisplay(
                                  amount:
                                      listing.askPriceUsd.toStringAsFixed(0),
                                  fontSize: 18,
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              if (listing.inspectionScore != null)
                                StatusChip(
                                    label: '${listing.inspectionScore}/100'),
                              const SizedBox(height: 12),
                              Icon(
                                viewState.savedIds.contains(listing.id)
                                    ? Icons.bookmark
                                    : Icons.chevron_right,
                                color: AppColors.ink400,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
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
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        final items = snapshot.data ?? const <SavedVehicleItem>[];
        if (items.isEmpty) {
          return const EmptyState(
            title: 'No saved vehicles',
            message: 'Bookmark listings from Browse to keep them here.',
          );
        }
        return RefreshIndicator(
          onRefresh: onRefresh,
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final item = items[index];
              return GestureDetector(
                onTap: () => onOpenListing(item.listing.id, saved: true),
                child: SectionCard(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 90,
                        child: VehicleImageView(
                          imageUrl: item.listing.coverImageUrl,
                          height: 74,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.listing.title,
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                color: AppColors.ink900,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Saved ${DateFormat.yMMMd().format(DateTime.parse(item.savedAt).toLocal())}',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.ink500,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right, color: AppColors.ink400),
                    ],
                  ),
                ),
              );
            },
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
  });

  final Future<List<QuoteItem>> quotesFuture;
  final Future<List<VehicleRequestItem>> requestFuture;
  final Future<void> Function() onCreateRequest;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        SectionCard(
          child: Row(
            children: [
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Need a different vehicle?',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.ink900,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Create a sourcing request and let the team look for a match.',
                      style: TextStyle(fontSize: 13, color: AppColors.ink500),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              ElevatedButton.icon(
                onPressed: onCreateRequest,
                icon: const Icon(Icons.add),
                label: const Text('New'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Quotes',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.ink900,
          ),
        ),
        const SizedBox(height: 10),
        FutureBuilder<List<QuoteItem>>(
          future: quotesFuture,
          builder: (context, snapshot) {
            final items = snapshot.data ?? const <QuoteItem>[];
            if (items.isEmpty) {
              return const EmptyState(
                title: 'No quote requests',
                message: 'Quotes you send from listing detail will show here.',
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
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Offer USD ${item.offerPriceUsd.toStringAsFixed(0)}',
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
                              'Ask USD ${item.askPriceUsd.toStringAsFixed(0)} · ${item.paymentPlan.replaceAll('_', ' ')}',
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
        const Text(
          'Sourcing requests',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.ink900,
          ),
        ),
        const SizedBox(height: 10),
        FutureBuilder<List<VehicleRequestItem>>(
          future: requestFuture,
          builder: (context, snapshot) {
            final items = snapshot.data ?? const <VehicleRequestItem>[];
            if (items.isEmpty) {
              return const EmptyState(
                title: 'No sourcing requests',
                message:
                    'Create one when you want the team to source a vehicle.',
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
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '${item.makeName ?? 'Any make'} ${item.model ?? ''}'
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
                              'Budget USD ${(item.maxBudgetCents / 100).toStringAsFixed(0)} · ${item.urgency.replaceAll('_', ' ')}',
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
    );
  }
}

class _ViewingsTab extends StatelessWidget {
  const _ViewingsTab({
    required this.future,
    required this.onRefresh,
  });

  final Future<List<ViewingItem>> future;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<ViewingItem>>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        final items = snapshot.data ?? const <ViewingItem>[];
        if (items.isEmpty) {
          return const EmptyState(
            title: 'No viewings scheduled',
            message: 'Confirmed and requested viewings will appear here.',
          );
        }
        return RefreshIndicator(
          onRefresh: onRefresh,
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
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
                      DateFormat.yMMMd()
                          .add_jm()
                          .format(DateTime.parse(displaySlot).toLocal()),
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

class _BuyerAccountTab extends StatefulWidget {
  const _BuyerAccountTab({
    required this.userName,
    required this.email,
    required this.city,
    required this.budgetMin,
    required this.budgetMax,
  });

  final String userName;
  final String email;
  final String city;
  final double? budgetMin;
  final double? budgetMax;

  @override
  State<_BuyerAccountTab> createState() => _BuyerAccountTabState();
}

class _BuyerAccountTabState extends State<_BuyerAccountTab> {
  late final TextEditingController _nameController;
  late final TextEditingController _cityController;
  late final TextEditingController _budgetMinController;
  late final TextEditingController _budgetMaxController;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.userName);
    _cityController = TextEditingController(text: widget.city);
    _budgetMinController = TextEditingController(
      text: widget.budgetMin?.toStringAsFixed(0) ?? '',
    );
    _budgetMaxController = TextEditingController(
      text: widget.budgetMax?.toStringAsFixed(0) ?? '',
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _cityController.dispose();
    _budgetMinController.dispose();
    _budgetMaxController.dispose();
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
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.ink500,
                ),
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
      ],
    );
  }

  Future<void> _save(BuildContext context, SessionController session) async {
    try {
      await session.updateProfile({
        'fullName': _nameController.text.trim(),
        'city': _cityController.text.trim(),
        'budgetMin': double.tryParse(_budgetMinController.text.trim()),
        'budgetMax': double.tryParse(_budgetMaxController.text.trim()),
      });
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated.')),
      );
    } on ApiException catch (error) {
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.message)),
      );
    }
  }
}
