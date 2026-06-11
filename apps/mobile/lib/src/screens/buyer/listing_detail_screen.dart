import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../theme/app_colors.dart';
import '../../../widgets/price_display.dart';
import '../../../widgets/score_gauge.dart';
import '../../../widgets/spec_chip.dart';
import '../../../widgets/verified_badge.dart';
import '../../core/network/api_exception.dart';
import '../../models/listing_models.dart';
import '../../models/reference_data.dart';
import '../../repositories/buyer_repository.dart';
import '../../widgets/section_card.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/vehicle_image.dart';

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
  late Future<ListingDetail> _future;
  late bool _isSaved;

  @override
  void initState() {
    super.initState();
    _isSaved = widget.initialSaved;
    _future = _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Vehicle detail'),
        actions: [
          IconButton(
            onPressed: _toggleSaved,
            icon: Icon(
              _isSaved ? Icons.bookmark : Icons.bookmark_border,
              color: _isSaved ? AppColors.amberDark : null,
            ),
          ),
        ],
      ),
      body: FutureBuilder<ListingDetail>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return _DetailError(onRetry: _reload);
          }
          final listing = snapshot.data!;
          return RefreshIndicator(
            onRefresh: _reload,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
              children: [
                const SizedBox(height: 8),
                SizedBox(
                  height: 220,
                  child: PageView(
                    children: listing.images.isEmpty
                        ? [
                            VehicleImageView(
                                imageUrl: listing.coverImageUrl, height: 220)
                          ]
                        : listing.images
                            .map(
                              (image) => VehicleImageView(
                                imageUrl: image.url,
                                height: 220,
                              ),
                            )
                            .toList(growable: false),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  listing.title,
                  style: const TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w800,
                    color: AppColors.ink900,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    if (listing.bisellVerified) const VerifiedBadge(),
                    StatusChip(label: listing.city),
                    StatusChip(label: '${listing.daysListed} days listed'),
                  ],
                ),
                const SizedBox(height: 12),
                PriceDisplay(amount: listing.askPriceUsd.toStringAsFixed(0)),
                const SizedBox(height: 4),
                Text(
                  listing.negotiable ? 'Negotiable' : 'Fixed asking price',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.ink500,
                  ),
                ),
                const SizedBox(height: 16),
                if (listing.inspectionSummary != null)
                  SectionCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Buyer-safe inspection summary',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppColors.ink900,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            ScoreGauge(
                              score: listing.inspectionSummary!.overallScore,
                              size: 88,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    listing.inspectionSummary!.roadworthy
                                        ? 'Roadworthy'
                                        : 'Needs attention',
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.ink900,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    listing.inspectionSummary!.inspectorNote ??
                                        'Inspection completed.',
                                    style: const TextStyle(
                                      fontSize: 13,
                                      color: AppColors.ink500,
                                      height: 1.4,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        ...listing.inspectionSummary!.findings.take(4).map(
                              (finding) => Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    StatusChip(label: finding.rating),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            finding.label,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                          if (finding.note != null)
                                            Text(
                                              finding.note!,
                                              style: const TextStyle(
                                                fontSize: 13,
                                                color: AppColors.ink500,
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                      ],
                    ),
                  ),
                const SizedBox(height: 16),
                SectionCard(
                  child: Wrap(
                    runSpacing: 12,
                    spacing: 12,
                    children: [
                      SpecChip(
                        icon: Icons.speed_outlined,
                        label: 'Mileage',
                        value: '${listing.mileageKm} km',
                      ),
                      SpecChip(
                        icon: Icons.local_gas_station_outlined,
                        label: 'Fuel',
                        value: listing.fuelType,
                      ),
                      SpecChip(
                        icon: Icons.settings_outlined,
                        label: 'Transmission',
                        value: listing.transmission,
                      ),
                      SpecChip(
                        icon: Icons.route_outlined,
                        label: 'Drive',
                        value: listing.driveType,
                      ),
                    ],
                  ),
                ),
                if (listing.sellerDisclosure != null) ...[
                  const SizedBox(height: 16),
                  SectionCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Seller disclosure',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppColors.ink900,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          listing.sellerDisclosure!,
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.ink500,
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => _openQuoteDialog(listing),
                        icon: const Icon(Icons.price_change_outlined),
                        label: const Text('Request quote'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _openViewingDialog(listing),
                        icon: const Icon(Icons.event_available_outlined),
                        label: const Text('Request viewing'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<ListingDetail> _load() {
    return context.read<BuyerRepository>().fetchDetail(widget.listingId);
  }

  Future<void> _reload() async {
    setState(() => _future = _load());
    await _future;
  }

  Future<void> _toggleSaved() async {
    try {
      final repository = context.read<BuyerRepository>();
      if (_isSaved) {
        await repository.removeSavedVehicle(widget.listingId);
      } else {
        await repository.saveVehicle(widget.listingId);
      }
      if (!mounted) {
        return;
      }
      setState(() => _isSaved = !_isSaved);
      widget.onSavedChanged(_isSaved);
    } on ApiException catch (error) {
      _showSnack(error.message);
    }
  }

  Future<void> _openQuoteDialog(ListingDetail listing) async {
    final controller =
        TextEditingController(text: listing.askPriceUsd.toStringAsFixed(0));
    String paymentPlan = 'FULL_CASH';
    final noteController = TextEditingController();
    final formKey = GlobalKey<FormState>();
    final submitted = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Request quote'),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: controller,
                  keyboardType: TextInputType.number,
                  decoration:
                      const InputDecoration(labelText: 'Offer price (USD)'),
                  validator: _required,
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: paymentPlan,
                  decoration: const InputDecoration(labelText: 'Payment plan'),
                  items: const [
                    DropdownMenuItem(
                      value: 'FULL_CASH',
                      child: Text('Full cash'),
                    ),
                    DropdownMenuItem(
                      value: 'BANK_TRANSFER',
                      child: Text('Bank transfer'),
                    ),
                    DropdownMenuItem(value: 'OTHER', child: Text('Other')),
                  ],
                  onChanged: (value) => paymentPlan = value ?? paymentPlan,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: noteController,
                  minLines: 3,
                  maxLines: 4,
                  decoration: const InputDecoration(labelText: 'Message'),
                ),
              ],
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
                  await context.read<BuyerRepository>().createQuote(
                        listingId: listing.id,
                        offerPriceUsd: double.parse(controller.text.trim()),
                        paymentPlan: paymentPlan,
                        message: noteController.text,
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
              child: const Text('Send'),
            ),
          ],
        );
      },
    );
    if (submitted == true && mounted) {
      _showSnack('Quote request sent.');
    }
  }

  Future<void> _openViewingDialog(ListingDetail listing) async {
    final noteController = TextEditingController();
    final now = DateTime.now().add(const Duration(days: 1));
    DateTime selectedDate = DateTime(now.year, now.month, now.day);
    TimeOfDay selectedTime = const TimeOfDay(hour: 10, minute: 0);
    String? locationId = widget.viewingLocations.isNotEmpty
        ? widget.viewingLocations.first.id
        : null;
    final submitted = await showDialog<bool>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Request viewing'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Preferred date'),
                    subtitle: Text(DateFormat.yMMMd().format(selectedDate)),
                    trailing: const Icon(Icons.calendar_today_outlined),
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: selectedDate,
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 60)),
                      );
                      if (picked != null) {
                        setDialogState(() => selectedDate = picked);
                      }
                    },
                  ),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Preferred time'),
                    subtitle: Text(selectedTime.format(context)),
                    trailing: const Icon(Icons.schedule_outlined),
                    onTap: () async {
                      final picked = await showTimePicker(
                        context: context,
                        initialTime: selectedTime,
                      );
                      if (picked != null) {
                        setDialogState(() => selectedTime = picked);
                      }
                    },
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    initialValue: locationId,
                    decoration: const InputDecoration(labelText: 'Location'),
                    items: widget.viewingLocations
                        .map(
                          (location) => DropdownMenuItem(
                            value: location.id,
                            child: Text(location.name),
                          ),
                        )
                        .toList(growable: false),
                    onChanged: (value) => locationId = value,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: noteController,
                    minLines: 3,
                    maxLines: 4,
                    decoration: const InputDecoration(labelText: 'Note'),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: locationId == null
                      ? null
                      : () async {
                          try {
                            await context
                                .read<BuyerRepository>()
                                .requestViewing(
                                  listingId: listing.id,
                                  preferredDate: DateFormat('yyyy-MM-dd')
                                      .format(selectedDate),
                                  preferredTime:
                                      '${selectedTime.hour.toString().padLeft(2, '0')}:${selectedTime.minute.toString().padLeft(2, '0')}',
                                  locationId: locationId!,
                                  note: noteController.text,
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
                  child: const Text('Request'),
                ),
              ],
            );
          },
        );
      },
    );
    if (submitted == true && mounted) {
      _showSnack('Viewing requested.');
    }
  }

  String? _required(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Required';
    }
    return null;
  }

  void _showSnack(String message) {
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }
}

class _DetailError extends StatelessWidget {
  const _DetailError({required this.onRetry});

  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Failed to load the listing.',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: onRetry,
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
