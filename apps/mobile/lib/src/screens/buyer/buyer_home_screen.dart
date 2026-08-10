import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../theme/app_colors.dart';
import '../../../widgets/price_display.dart';
import '../../../widgets/verified_badge.dart';
import '../../core/network/api_exception.dart';
import '../../models/activity_models.dart';
import '../../models/listing_models.dart';
import '../../models/listing_filters.dart';
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
  ListingFilterState _draftFilters = const ListingFilterState();
  ListingFilterState _appliedFilters = const ListingFilterState();
  final _searchController = TextEditingController();
  String _draftSearchText = '';
  String _appliedSearchText = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

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
          searchController: _searchController,
          appliedSearchText: _appliedSearchText,
          filters: _draftFilters,
          makes: session.referenceData?.makes ?? const [],
          cities: uniqueCities(
            session.referenceData?.viewingLocations ?? const [],
          ),
          onSearchChanged: (value) => setState(() => _draftSearchText = value),
          onMakeChanged: (value) => setState(() {
            _draftFilters = _draftFilters.copyWith(
              make: value,
              model: null,
              year: null,
            );
          }),
          onModelChanged: (value) => setState(() {
            _draftFilters = _draftFilters.copyWith(model: value, year: null);
          }),
          onYearChanged: (value) => setState(
            () => _draftFilters = _draftFilters.copyWith(year: value),
          ),
          onCityChanged: (value) => setState(
            () => _draftFilters = _draftFilters.copyWith(city: value),
          ),
          onBodyTypeChanged: (value) => setState(
            () => _draftFilters = _draftFilters.copyWith(bodyType: value),
          ),
          onToggleVerified: () => setState(
            () => _draftFilters = _draftFilters.copyWith(
              verifiedOnly: !_draftFilters.verifiedOnly,
            ),
          ),
          onSearch: () => setState(() {
            _appliedFilters = _draftFilters;
            _appliedSearchText = _draftSearchText;
            _browseFuture = _loadBrowse();
          }),
          onClear: () => setState(() {
            _draftFilters = const ListingFilterState();
            _appliedFilters = const ListingFilterState();
            _searchController.clear();
            _draftSearchText = '';
            _appliedSearchText = '';
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
                              decoration: const InputDecoration(
                                labelText: 'Year min',
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              controller: yearMaxController,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(
                                labelText: 'Year max',
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        initialValue: bodyTypeId,
                        decoration: const InputDecoration(
                          labelText: 'Body type',
                        ),
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
                        decoration: const InputDecoration(
                          labelText: 'Fuel type',
                        ),
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
                        decoration: const InputDecoration(
                          labelText: 'Transmission',
                        ),
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
                            maxOdometerKm: _nullableInt(
                              odometerController.text,
                            ),
                            urgency: urgency,
                            notes: notesController.text,
                          );
                      if (context.mounted) {
                        Navigator.of(context).pop(true);
                      }
                    } on ApiException catch (error) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(
                          context,
                        ).showSnackBar(SnackBar(content: Text(error.message)));
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
    final page = await repository.browse(
      filters: _appliedFilters,
    );
    final savedItems = await repository.savedVehicles();
    final savedIds = savedItems.map((item) => item.listing.id).toSet();
    return ListingViewState(listings: page.data, savedIds: savedIds);
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
  ListingViewState({required this.listings, required this.savedIds});

  final List<ListingCard> listings;
  final Set<String> savedIds;
}

class _BrowseTab extends StatelessWidget {
  const _BrowseTab({
    required this.future,
    required this.searchController,
    required this.appliedSearchText,
    required this.filters,
    required this.makes,
    required this.cities,
    required this.onSearchChanged,
    required this.onMakeChanged,
    required this.onModelChanged,
    required this.onYearChanged,
    required this.onCityChanged,
    required this.onToggleVerified,
    required this.onBodyTypeChanged,
    required this.onSearch,
    required this.onClear,
    required this.bodyTypes,
    required this.onOpenListing,
    required this.onRefresh,
  });

  final Future<ListingViewState> future;
  final TextEditingController searchController;
  final String appliedSearchText;
  final ListingFilterState filters;
  final List<VehicleMake> makes;
  final List<String> cities;
  final ValueChanged<String> onSearchChanged;
  final ValueChanged<String?> onMakeChanged;
  final ValueChanged<String?> onModelChanged;
  final ValueChanged<int?> onYearChanged;
  final ValueChanged<String?> onCityChanged;
  final VoidCallback onToggleVerified;
  final ValueChanged<String?> onBodyTypeChanged;
  final VoidCallback onSearch;
  final VoidCallback onClear;
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
          final query = appliedSearchText.trim().toLowerCase();
          if (query.isEmpty) {
            return true;
          }
          return listing.title.toLowerCase().contains(query) ||
              listing.city.toLowerCase().contains(query);
        }).toList(growable: false);
        return RefreshIndicator(
          onRefresh: onRefresh,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              BrowseFilters(
                searchController: searchController,
                filters: filters,
                makes: makes,
                cities: cities,
                bodyTypes: bodyTypes,
                onSearchChanged: onSearchChanged,
                onMakeChanged: onMakeChanged,
                onModelChanged: onModelChanged,
                onYearChanged: onYearChanged,
                onCityChanged: onCityChanged,
                onBodyTypeChanged: onBodyTypeChanged,
                onToggleVerified: onToggleVerified,
                onSearch: onSearch,
                onClear: onClear,
              ),
              const SizedBox(height: 12),
              if (filtered.isEmpty)
                EmptyState(
                  title: 'No published vehicles',
                  message:
                      'Seed a published listing or widen the current filters.',
                  action: OutlinedButton(
                    onPressed: onClear,
                    child: const Text('Clear filters'),
                  ),
                )
              else
                ...filtered.map(
                  (listing) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: GestureDetector(
                      onTap: () => onOpenListing(
                        listing.id,
                        saved: viewState.savedIds.contains(listing.id),
                      ),
                      child: _ListingCard(
                        listing: listing,
                        saved: viewState.savedIds.contains(listing.id),
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

class BrowseFilters extends StatelessWidget {
  const BrowseFilters({
    super.key,
    required this.searchController,
    required this.filters,
    required this.makes,
    required this.cities,
    required this.bodyTypes,
    required this.onSearchChanged,
    required this.onMakeChanged,
    required this.onModelChanged,
    required this.onYearChanged,
    required this.onCityChanged,
    required this.onBodyTypeChanged,
    required this.onToggleVerified,
    required this.onSearch,
    required this.onClear,
  });

  final TextEditingController searchController;
  final ListingFilterState filters;
  final List<VehicleMake> makes;
  final List<String> cities;
  final List<ReferenceOption> bodyTypes;
  final ValueChanged<String> onSearchChanged;
  final ValueChanged<String?> onMakeChanged;
  final ValueChanged<String?> onModelChanged;
  final ValueChanged<int?> onYearChanged;
  final ValueChanged<String?> onCityChanged;
  final ValueChanged<String?> onBodyTypeChanged;
  final VoidCallback onToggleVerified;
  final VoidCallback onSearch;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final selectedMake = _makeFor(filters.make);
    final models = selectedMake?.popularModels ?? const <String>[];
    final years = _years();
    return Column(
      children: [
        TextField(
          controller: searchController,
          onChanged: onSearchChanged,
          decoration: const InputDecoration(
            prefixIcon: Icon(Icons.search_outlined),
            labelText: 'Search by make, model, or city',
          ),
        ),
        const SizedBox(height: 12),
        _FilterDropdown<String?>(
          controlKey: 'browse-filter-make',
          label: 'Make',
          selectedValue: filters.make,
          items: [
            const DropdownMenuItem(value: null, child: Text('All makes')),
            ...makes.map(
              (make) => DropdownMenuItem(
                value: make.name,
                child: Text(make.name),
              ),
            ),
          ],
          onChanged: onMakeChanged,
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _FilterDropdown<String?>(
                controlKey: 'browse-filter-model',
                label: 'Model',
                selectedValue: filters.model,
                items: [
                  const DropdownMenuItem(
                    value: null,
                    child: Text('All models'),
                  ),
                  ...models.map(
                    (model) => DropdownMenuItem(
                      value: model,
                      child: Text(model),
                    ),
                  ),
                ],
                onChanged: selectedMake == null ? null : onModelChanged,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _FilterDropdown<int?>(
                controlKey: 'browse-filter-year',
                label: 'Year',
                selectedValue: filters.year,
                items: [
                  const DropdownMenuItem(
                    value: null,
                    child: Text('Any year'),
                  ),
                  ...years.map(
                    (year) => DropdownMenuItem(
                      value: year,
                      child: Text('$year'),
                    ),
                  ),
                ],
                onChanged: filters.model == null ? null : onYearChanged,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        _FilterDropdown<String?>(
          controlKey: 'browse-filter-location',
          label: 'Location',
          selectedValue: filters.city,
          items: [
            const DropdownMenuItem(
              value: null,
              child: Text('All locations'),
            ),
            ...cities.map(
              (city) => DropdownMenuItem(value: city, child: Text(city)),
            ),
          ],
          onChanged: onCityChanged,
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _FilterDropdown<String?>(
                controlKey: 'browse-filter-body-type',
                label: 'Body type',
                selectedValue: filters.bodyType,
                items: [
                  const DropdownMenuItem(
                    value: null,
                    child: Text('All body types'),
                  ),
                  ...bodyTypes.map(
                    (type) => DropdownMenuItem(
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
              key: const Key('browse-filter-verified'),
              label: const Text('Verified'),
              selected: filters.verifiedOnly,
              onSelected: (_) => onToggleVerified(),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: onClear,
                child: const Text('Clear'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: onSearch,
                child: const Text('Search'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  VehicleMake? _makeFor(String? name) {
    for (final make in makes) {
      if (make.name == name) {
        return make;
      }
    }
    return null;
  }

  List<int> _years() {
    final currentYear = DateTime.now().year;
    return [for (var year = currentYear; year >= 1990; year--) year];
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
        decoration: InputDecoration(labelText: label),
        items: items,
        onChanged: onChanged,
      ),
    );
  }
}

class _ListingCard extends StatelessWidget {
  const _ListingCard({required this.listing, required this.saved});

  final ListingCard listing;
  final bool saved;

  @override
  Widget build(BuildContext context) {
    return SectionCard(
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
                if (listing.bisellVerified) const VerifiedBadge(),
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
                  style: const TextStyle(fontSize: 13, color: AppColors.ink500),
                ),
                const SizedBox(height: 8),
                PriceDisplay(
                  amount: listing.askPriceUsd.toStringAsFixed(0),
                  fontSize: 18,
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (listing.inspectionScore != null)
                StatusChip(label: '${listing.inspectionScore}/100'),
              const SizedBox(height: 12),
              Icon(
                saved ? Icons.bookmark : Icons.chevron_right,
                color: AppColors.ink400,
              ),
            ],
          ),
        ],
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
  const _ViewingsTab({required this.future, required this.onRefresh});

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
                      DateFormat.yMMMd().add_jm().format(
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
