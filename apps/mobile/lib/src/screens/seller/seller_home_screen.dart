import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../theme/app_colors.dart';
import '../../../widgets/price_display.dart';
import '../../core/network/api_exception.dart';
import '../../models/seller_models.dart';
import '../../repositories/seller_repository.dart';
import '../../state/session_controller.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/section_card.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/vehicle_image.dart';
import 'listing_editor_screen.dart';

class SellerHomeScreen extends StatefulWidget {
  const SellerHomeScreen({super.key});

  @override
  State<SellerHomeScreen> createState() => _SellerHomeScreenState();
}

class _SellerHomeScreenState extends State<SellerHomeScreen> {
  int _tabIndex = 0;
  Future<List<SellerListingSummary>>? _listingsFuture;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final session = context.read<SessionController>();
    if (session.user?.consentsComplete == true && _listingsFuture == null) {
      _listingsFuture = _loadListings();
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionController>();
    final user = session.user!;
    final body = _tabIndex == 0
        ? _SellerDashboardTab(
            future: _listingsFuture,
            consentsComplete: user.consentsComplete,
            onRefresh: _refreshListings,
            onOpenListing: _openEditor,
            onCompleteConsents: session.completeRequiredConsents,
          )
        : _SellerAccountTab(
            businessName: user.sellerProfile?.businessName,
            city: user.sellerProfile?.city ?? user.city,
          );

    return Scaffold(
      appBar: AppBar(
        title: Text('Seller · ${user.fullName.split(' ').first}'),
      ),
      body: body,
      floatingActionButton: _tabIndex == 0
          ? FloatingActionButton.extended(
              onPressed: user.consentsComplete ? () => _openEditor() : null,
              icon: const Icon(Icons.add),
              label: const Text('New listing'),
            )
          : null,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tabIndex,
        onDestinationSelected: (index) => setState(() => _tabIndex = index),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
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

  Future<List<SellerListingSummary>> _loadListings() {
    return context.read<SellerRepository>().listings();
  }

  Future<void> _refreshListings() async {
    setState(() => _listingsFuture = _loadListings());
    await _listingsFuture;
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
    required this.consentsComplete,
    required this.onRefresh,
    required this.onOpenListing,
    required this.onCompleteConsents,
  });

  final Future<List<SellerListingSummary>>? future;
  final bool consentsComplete;
  final Future<void> Function() onRefresh;
  final Future<void> Function(String? listingId) onOpenListing;
  final Future<void> Function() onCompleteConsents;

  @override
  Widget build(BuildContext context) {
    if (!consentsComplete) {
      return ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Complete seller consents',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.ink900,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Listings stay locked until the marketplace consents are accepted.',
                  style: TextStyle(color: AppColors.ink500, height: 1.4),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () async {
                    try {
                      await onCompleteConsents();
                    } on ApiException catch (error) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(error.message)),
                        );
                      }
                    }
                  },
                  child: const Text('Complete consents'),
                ),
              ],
            ),
          ),
        ],
      );
    }

    return FutureBuilder<List<SellerListingSummary>>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) {
          return EmptyState(
            title: 'Listings unavailable',
            message: 'Refresh the dashboard after the API comes back.',
            action: ElevatedButton(
              onPressed: onRefresh,
              child: const Text('Retry'),
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
        return RefreshIndicator(
          onRefresh: onRefresh,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              SectionCard(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _StatBlock(label: 'Listings', value: '${listings.length}'),
                    _StatBlock(label: 'Views', value: '$viewCount'),
                    _StatBlock(label: 'Quotes', value: '$quoteCount'),
                    _StatBlock(label: 'Viewings', value: '$viewingCount'),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              if (listings.isEmpty)
                const EmptyState(
                  title: 'No listings yet',
                  message:
                      'Create a draft, upload media, then submit it for review.',
                )
              else
                ...listings.map(
                  (listing) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: GestureDetector(
                      onTap: () => onOpenListing(listing.id),
                      child: SectionCard(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: [
                            SizedBox(
                              width: 100,
                              child: VehicleImageView(
                                imageUrl: listing.coverImageUrl,
                                height: 84,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  StatusChip(label: listing.status),
                                  const SizedBox(height: 8),
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
                                    'Updated ${DateFormat.yMMMd().format(DateTime.parse(listing.updatedAt).toLocal())}',
                                    style: const TextStyle(
                                      fontSize: 12,
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
                            const Icon(Icons.chevron_right,
                                color: AppColors.ink400),
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

class _SellerAccountTab extends StatefulWidget {
  const _SellerAccountTab({
    required this.businessName,
    required this.city,
  });

  final String? businessName;
  final String city;

  @override
  State<_SellerAccountTab> createState() => _SellerAccountTabState();
}

class _SellerAccountTabState extends State<_SellerAccountTab> {
  late final TextEditingController _businessController;
  late final TextEditingController _cityController;

  @override
  void initState() {
    super.initState();
    _businessController =
        TextEditingController(text: widget.businessName ?? '');
    _cityController = TextEditingController(text: widget.city);
  }

  @override
  void dispose() {
    _businessController.dispose();
    _cityController.dispose();
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
              TextField(
                controller: _businessController,
                decoration: const InputDecoration(labelText: 'Business name'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _cityController,
                decoration: const InputDecoration(labelText: 'City'),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: session.isBusy ? null : () => _save(context),
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
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed:
                    session.isBusy ? null : session.completeRequiredConsents,
                child: const Text('Replay consents'),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Future<void> _save(BuildContext context) async {
    final session = context.read<SessionController>();
    try {
      await session.updateProfile({
        'businessName': _businessController.text.trim(),
        'city': _cityController.text.trim(),
      });
      if (!context.mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Seller profile updated.')),
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
