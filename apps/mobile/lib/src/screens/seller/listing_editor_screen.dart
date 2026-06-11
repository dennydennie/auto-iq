import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../theme/app_colors.dart';
import '../../../widgets/price_display.dart';
import '../../core/files/file_type_sniffer.dart';
import '../../core/network/api_exception.dart';
import '../../models/reference_data.dart';
import '../../models/seller_models.dart';
import '../../repositories/seller_repository.dart';
import '../../state/session_controller.dart';
import '../../widgets/section_card.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/vehicle_image.dart';

class ListingEditorScreen extends StatefulWidget {
  const ListingEditorScreen({
    super.key,
    this.listingId,
  });

  final String? listingId;

  @override
  State<ListingEditorScreen> createState() => _ListingEditorScreenState();
}

class _ListingEditorScreenState extends State<ListingEditorScreen> {
  final _formKey = GlobalKey<FormState>();
  final _makeController = TextEditingController();
  final _modelController = TextEditingController();
  final _yearController = TextEditingController(text: '${DateTime.now().year}');
  final _colourController = TextEditingController();
  final _engineController = TextEditingController();
  final _mileageController = TextEditingController(text: '0');
  final _priceController = TextEditingController(text: '0');
  final _accidentNoteController = TextEditingController();
  final _disclosureController = TextEditingController();

  String? _listingId;
  Future<SellerListingDetail?>? _detailFuture;
  Future<List<SellerTimelineEntry>>? _timelineFuture;
  bool _busy = false;
  bool _negotiable = true;
  bool _hasAccidentHistory = false;
  String? _loadedMarker;
  String? _selectedBodyType;
  String? _selectedFuelType;
  String? _selectedTransmission;
  String? _selectedDriveType;
  String _selectedCondition = 'GOOD';
  String _selectedDocumentType = SellerRepository.documentTypes.first;

  @override
  void initState() {
    super.initState();
    _listingId = widget.listingId;
    if (_listingId != null) {
      _detailFuture = _loadDetail();
      _timelineFuture = _loadTimeline();
    }
  }

  @override
  void dispose() {
    _makeController.dispose();
    _modelController.dispose();
    _yearController.dispose();
    _colourController.dispose();
    _engineController.dispose();
    _mileageController.dispose();
    _priceController.dispose();
    _accidentNoteController.dispose();
    _disclosureController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final referenceData = context.read<SessionController>().referenceData!;
    _selectedBodyType ??= referenceData.bodyTypes.first.value;
    _selectedFuelType ??= referenceData.fuelTypes.first.value;
    _selectedTransmission ??= referenceData.transmissionTypes.first.value;
    _selectedDriveType ??= referenceData.driveTypes.first.value;

    return Scaffold(
      appBar: AppBar(
        title: Text(_listingId == null ? 'New listing' : 'Edit listing'),
      ),
      body: SafeArea(
        child: FutureBuilder<SellerListingDetail?>(
          future: _detailFuture,
          builder: (context, snapshot) {
            final detail = snapshot.data;
            if (_listingId != null &&
                snapshot.connectionState != ConnectionState.done) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasData) {
              _sync(detail!);
            }
            return Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (detail != null) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            detail.title,
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w800,
                              color: AppColors.ink900,
                            ),
                          ),
                        ),
                        StatusChip(label: detail.status),
                      ],
                    ),
                    if (detail.changesNote != null) ...[
                      const SizedBox(height: 12),
                      SectionCard(
                        child: Text(
                          detail.changesNote!,
                          style: const TextStyle(color: AppColors.ember),
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                  ],
                  _buildBasics(referenceData, detail),
                  const SizedBox(height: 16),
                  _buildPricing(detail),
                  const SizedBox(height: 16),
                  _buildDisclosure(),
                  const SizedBox(height: 16),
                  _buildMedia(detail),
                  const SizedBox(height: 16),
                  if (detail != null) _buildTimeline(),
                  const SizedBox(height: 16),
                  _buildActions(detail),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildBasics(
    ReferenceDataSet referenceData,
    SellerListingDetail? detail,
  ) {
    return SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Vehicle basics',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.ink900,
            ),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _makeController,
            decoration: const InputDecoration(labelText: 'Make'),
            validator: _required,
            enabled: detail?.isEditable ?? true,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _modelController,
            decoration: const InputDecoration(labelText: 'Model'),
            validator: _required,
            enabled: detail?.isEditable ?? true,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _yearController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Year'),
                  validator: _required,
                  enabled: detail?.isEditable ?? true,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextFormField(
                  controller: _colourController,
                  decoration: const InputDecoration(labelText: 'Colour'),
                  validator: _required,
                  enabled: detail?.isEditable ?? true,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _selectedBodyType,
            decoration: const InputDecoration(labelText: 'Body type'),
            items: referenceData.bodyTypes
                .map(
                  (option) => DropdownMenuItem(
                    value: option.value,
                    child: Text(option.label),
                  ),
                )
                .toList(growable: false),
            onChanged: detail?.isEditable ?? true
                ? (value) => setState(() => _selectedBodyType = value)
                : null,
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _selectedFuelType,
            decoration: const InputDecoration(labelText: 'Fuel type'),
            items: referenceData.fuelTypes
                .map(
                  (option) => DropdownMenuItem(
                    value: option.value,
                    child: Text(option.label),
                  ),
                )
                .toList(growable: false),
            onChanged: detail?.isEditable ?? true
                ? (value) => setState(() => _selectedFuelType = value)
                : null,
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _selectedTransmission,
            decoration: const InputDecoration(labelText: 'Transmission'),
            items: referenceData.transmissionTypes
                .map(
                  (option) => DropdownMenuItem(
                    value: option.value,
                    child: Text(option.label),
                  ),
                )
                .toList(growable: false),
            onChanged: detail?.isEditable ?? true
                ? (value) => setState(() => _selectedTransmission = value)
                : null,
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _selectedDriveType,
            decoration: const InputDecoration(labelText: 'Drive type'),
            items: referenceData.driveTypes
                .map(
                  (option) => DropdownMenuItem(
                    value: option.value,
                    child: Text(option.label),
                  ),
                )
                .toList(growable: false),
            onChanged: detail?.isEditable ?? true
                ? (value) => setState(() => _selectedDriveType = value)
                : null,
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _selectedCondition,
            decoration: const InputDecoration(labelText: 'Condition'),
            items: const [
              DropdownMenuItem(value: 'EXCELLENT', child: Text('Excellent')),
              DropdownMenuItem(value: 'GOOD', child: Text('Good')),
              DropdownMenuItem(value: 'FAIR', child: Text('Fair')),
              DropdownMenuItem(value: 'POOR', child: Text('Poor')),
            ],
            onChanged: detail?.isEditable ?? true
                ? (value) =>
                    setState(() => _selectedCondition = value ?? 'GOOD')
                : null,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _engineController,
                  decoration:
                      const InputDecoration(labelText: 'Engine (optional)'),
                  enabled: detail?.isEditable ?? true,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextFormField(
                  controller: _mileageController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Mileage (km)'),
                  validator: _required,
                  enabled: detail?.isEditable ?? true,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            value: _hasAccidentHistory,
            title: const Text('Accident history'),
            onChanged: detail?.isEditable ?? true
                ? (value) => setState(() => _hasAccidentHistory = value)
                : null,
          ),
          if (_hasAccidentHistory)
            TextFormField(
              controller: _accidentNoteController,
              minLines: 2,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Accident note'),
              enabled: detail?.isEditable ?? true,
            ),
        ],
      ),
    );
  }

  Widget _buildPricing(SellerListingDetail? detail) {
    return SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Pricing',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.ink900,
            ),
          ),
          const SizedBox(height: 12),
          if (detail != null)
            PriceDisplay(amount: detail.pricing.askPriceUsd.toStringAsFixed(0)),
          TextFormField(
            controller: _priceController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Ask price (USD)'),
            validator: _required,
            enabled: detail?.isEditable ?? true,
          ),
          const SizedBox(height: 12),
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            value: _negotiable,
            title: const Text('Negotiable'),
            onChanged: detail?.isEditable ?? true
                ? (value) => setState(() => _negotiable = value)
                : null,
          ),
        ],
      ),
    );
  }

  Widget _buildDisclosure() {
    return SectionCard(
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
          const SizedBox(height: 12),
          TextFormField(
            controller: _disclosureController,
            minLines: 4,
            maxLines: 6,
            decoration: const InputDecoration(
              labelText:
                  'Describe ownership, service history, and known issues',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMedia(SellerListingDetail? detail) {
    final editable = detail?.isEditable ?? _listingId == null;
    return SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Images and documents',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.ink900,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Create or save the draft first, then upload the required media directly to storage.',
            style: TextStyle(fontSize: 13, color: AppColors.ink500),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: detail?.images
                    .map(
                      (image) => SizedBox(
                        width: 120,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            VehicleImageView(imageUrl: image.url, height: 90),
                            const SizedBox(height: 4),
                            Text(
                              image.slot.replaceAll('_', ' '),
                              style: const TextStyle(fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                    )
                    .toList(growable: false) ??
                [
                  const Text(
                    'No images uploaded yet.',
                    style: TextStyle(color: AppColors.ink500),
                  ),
                ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed:
                      editable && _listingId != null ? _pickImages : null,
                  icon: const Icon(Icons.photo_library_outlined),
                  label: const Text('Upload images'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _selectedDocumentType,
            decoration: const InputDecoration(labelText: 'Document type'),
            items: SellerRepository.documentTypes
                .map(
                  (type) => DropdownMenuItem(
                    value: type,
                    child: Text(type.replaceAll('_', ' ')),
                  ),
                )
                .toList(growable: false),
            onChanged: editable && _listingId != null
                ? (value) => setState(
                      () => _selectedDocumentType =
                          value ?? SellerRepository.documentTypes.first,
                    )
                : null,
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: editable && _listingId != null ? _pickDocument : null,
            icon: const Icon(Icons.upload_file_outlined),
            label: const Text('Upload document'),
          ),
          if (detail != null && detail.documents.isNotEmpty) ...[
            const SizedBox(height: 12),
            ...detail.documents.map(
              (document) => ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(document.documentType.replaceAll('_', ' ')),
                subtitle: Text(document.reviewStatus),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTimeline() {
    return SectionCard(
      child: FutureBuilder<List<SellerTimelineEntry>>(
        future: _timelineFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          final timeline = snapshot.data ?? const <SellerTimelineEntry>[];
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Timeline',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.ink900,
                ),
              ),
              const SizedBox(height: 12),
              ...timeline.map(
                (entry) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      StatusChip(label: entry.status),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              DateFormat.yMMMd().add_jm().format(
                                    DateTime.parse(entry.occurredAt).toLocal(),
                                  ),
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.ink500,
                              ),
                            ),
                            if (entry.note != null) Text(entry.note!),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildActions(SellerListingDetail? detail) {
    final editable = detail?.isEditable ?? true;
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _busy || !editable ? null : _save,
            child: _busy
                ? const SizedBox(
                    height: 18,
                    width: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(_listingId == null ? 'Create draft' : 'Save changes'),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed:
                _busy || _listingId == null || !editable ? null : _submit,
            child: const Text('Submit for review'),
          ),
        ),
      ],
    );
  }

  Future<SellerListingDetail?> _loadDetail() async {
    if (_listingId == null) {
      return null;
    }
    return context.read<SellerRepository>().detail(_listingId!);
  }

  Future<List<SellerTimelineEntry>> _loadTimeline() async {
    if (_listingId == null) {
      return const [];
    }
    return context.read<SellerRepository>().timeline(_listingId!);
  }

  void _sync(SellerListingDetail detail) {
    final marker = [
      detail.id,
      detail.status,
      detail.images.length,
      detail.documents.length,
      detail.specs.make,
      detail.specs.model,
      detail.pricing.askPriceUsd,
      detail.sellerDisclosure ?? '',
    ].join('|');
    if (_loadedMarker == marker) {
      return;
    }
    _loadedMarker = marker;
    _makeController.text = detail.specs.make;
    _modelController.text = detail.specs.model;
    _yearController.text = detail.specs.year.toString();
    _colourController.text = detail.specs.colour;
    _engineController.text = detail.specs.engineCapacity ?? '';
    _mileageController.text = detail.specs.mileageKm.toString();
    _priceController.text = detail.pricing.askPriceUsd.toStringAsFixed(0);
    _accidentNoteController.text = detail.specs.accidentNote ?? '';
    _disclosureController.text = detail.sellerDisclosure ?? '';
    _selectedBodyType = detail.specs.bodyType;
    _selectedFuelType = detail.specs.fuelType;
    _selectedTransmission = detail.specs.transmission;
    _selectedDriveType = detail.specs.driveType;
    _selectedCondition = detail.specs.condition;
    _hasAccidentHistory = detail.specs.hasAccidentHistory;
    _negotiable = detail.pricing.negotiable;
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() => _busy = true);
    try {
      final repository = context.read<SellerRepository>();
      if (_listingId == null) {
        _listingId = await repository.createDraft(
          make: _makeController.text,
          model: _modelController.text,
          year: int.parse(_yearController.text),
          bodyType: _selectedBodyType!,
          colour: _colourController.text,
          fuelType: _selectedFuelType!,
          transmission: _selectedTransmission!,
          driveType: _selectedDriveType!,
          engineCapacity: _engineController.text,
          mileageKm: int.parse(_mileageController.text),
          condition: _selectedCondition,
          hasAccidentHistory: _hasAccidentHistory,
          accidentNote: _accidentNoteController.text,
          askPriceUsd: double.parse(_priceController.text),
          negotiable: _negotiable,
        );
      } else {
        await repository.updateSpecs(
          listingId: _listingId!,
          make: _makeController.text,
          model: _modelController.text,
          year: int.parse(_yearController.text),
          bodyType: _selectedBodyType!,
          colour: _colourController.text,
          fuelType: _selectedFuelType!,
          transmission: _selectedTransmission!,
          driveType: _selectedDriveType!,
          engineCapacity: _engineController.text,
          mileageKm: int.parse(_mileageController.text),
          condition: _selectedCondition,
          hasAccidentHistory: _hasAccidentHistory,
          accidentNote: _accidentNoteController.text,
        );
        await repository.updatePricing(
          listingId: _listingId!,
          askPriceUsd: double.parse(_priceController.text),
          negotiable: _negotiable,
        );
        await repository.updateDisclosure(
          listingId: _listingId!,
          sellerDisclosure: _disclosureController.text,
        );
      }
      await _refreshLoadedState();
      _showSnack(_listingId == widget.listingId
          ? 'Listing updated.'
          : 'Draft created.');
    } on ApiException catch (error) {
      _showSnack(error.message);
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  Future<void> _submit() async {
    try {
      await context.read<SellerRepository>().submit(
            listingId: _listingId!,
            disclosure: _disclosureController.text,
          );
      await _refreshLoadedState();
      _showSnack('Listing submitted for review.');
    } on ApiException catch (error) {
      _showSnack(error.message);
    }
  }

  Future<void> _pickImages() async {
    final picker = ImagePicker();
    final files = await picker.pickMultiImage(imageQuality: 85);
    if (files.isEmpty) {
      return;
    }
    if (!mounted) {
      return;
    }
    setState(() => _busy = true);
    try {
      final repository = context.read<SellerRepository>();
      final detail = await repository.detail(_listingId!);
      var nextIndex = detail.images.length;
      for (final file in files) {
        if (nextIndex >= SellerRepository.imageSlots.length) {
          break;
        }
        final bytes = await file.readAsBytes();
        final fileType = FileTypeSniffer.sniff(bytes);
        if (fileType == null || !fileType.isImage) {
          continue;
        }
        await repository.uploadImage(
          listingId: _listingId!,
          file: LocalUpload(
            bytes: bytes,
            fileType: fileType,
            name: file.name,
          ),
          slot: SellerRepository.imageSlots[nextIndex],
          isCover: nextIndex == 0,
        );
        nextIndex += 1;
      }
      await _refreshLoadedState();
    } on ApiException catch (error) {
      _showSnack(error.message);
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  Future<void> _pickDocument() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      withData: true,
      allowedExtensions: const ['pdf', 'png', 'jpg', 'jpeg'],
    );
    if (result == null || result.files.single.bytes == null) {
      return;
    }
    if (!mounted) {
      return;
    }
    setState(() => _busy = true);
    try {
      final repository = context.read<SellerRepository>();
      final bytes = Uint8List.fromList(result.files.single.bytes!);
      final fileType = FileTypeSniffer.sniff(bytes);
      if (fileType == null) {
        throw ApiException(
          message: 'Unsupported document type.',
          statusCode: 400,
        );
      }
      await repository.uploadDocument(
        listingId: _listingId!,
        file: LocalUpload(
          bytes: bytes,
          fileType: fileType,
          name: result.files.single.name,
        ),
        documentType: _selectedDocumentType,
      );
      await _refreshLoadedState();
    } on ApiException catch (error) {
      _showSnack(error.message);
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  Future<void> _refreshLoadedState() async {
    setState(() {
      _detailFuture = _loadDetail();
      _timelineFuture = _loadTimeline();
    });
    await _detailFuture;
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
