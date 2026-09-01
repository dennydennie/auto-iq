import 'dart:async';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../../theme/app_colors.dart';
import '../../../theme/app_tokens.dart';
import '../../core/files/local_upload.dart';
import '../../core/forms/form_validators.dart';
import '../../core/i18n/app_formatters.dart';
import '../../core/i18n/app_localizations.dart';
import '../../core/network/api_exception.dart';
import '../../core/observability/mobile_analytics.dart';
import '../../models/listing_models.dart';
import '../../models/reference_data.dart';
import '../../models/seller_listing_readiness.dart';
import '../../models/seller_models.dart';
import '../../models/seller_upload_task.dart';
import '../../repositories/seller_repository.dart';
import '../../state/session_controller.dart';
import '../../widgets/adaptive_content.dart';
import '../../widgets/async_state_view.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/section_card.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/vehicle_image.dart';

class ListingEditorScreen extends StatefulWidget {
  const ListingEditorScreen({super.key, this.listingId});

  final String? listingId;

  @override
  State<ListingEditorScreen> createState() => _ListingEditorScreenState();
}

class _ListingEditorScreenState extends State<ListingEditorScreen> {
  final _specsKey = GlobalKey<FormState>();
  final _pricingKey = GlobalKey<FormState>();
  final _reviewKey = GlobalKey<FormState>();
  final _make = TextEditingController();
  final _model = TextEditingController();
  final _year = TextEditingController(text: '${DateTime.now().year}');
  final _colour = TextEditingController();
  final _engine = TextEditingController();
  final _mileage = TextEditingController();
  final _price = TextEditingController();
  final _accidentNote = TextEditingController();
  final _disclosure = TextEditingController();

  String? _listingId;
  SellerListingDetail? _detail;
  ApiException? _loadError;
  Future<List<SellerTimelineEntry>>? _timelineFuture;
  final List<SellerUploadTask> _uploads = [];
  List<VehicleImage> _images = [];
  String? _selectedBodyType;
  String? _selectedFuelType;
  String? _selectedTransmission;
  String? _selectedDriveType;
  String? _selectedCondition;
  String _documentType = SellerRepository.documentTypes.first;
  bool _negotiable = true;
  bool _hasAccidentHistory = false;
  bool _loading = false;
  bool _busy = false;
  bool _dirty = false;
  bool _didInitialize = false;
  int _step = 0;
  int _revision = 0;
  Timer? _autosaveTimer;
  final Set<String> _assetBusy = {};

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _initialize();
  }

  @override
  void dispose() {
    _autosaveTimer?.cancel();
    for (final upload in _uploads) {
      if (!upload.cancelToken.isCancelled) upload.cancelToken.cancel();
    }
    for (final controller in _controllers) {
      controller.dispose();
    }
    super.dispose();
  }

  List<TextEditingController> get _controllers => [
        _make,
        _model,
        _year,
        _colour,
        _engine,
        _mileage,
        _price,
        _accidentNote,
        _disclosure,
      ];

  ReferenceDataSet? get _references =>
      context.read<SessionController>().referenceData;

  SellerRepository get _repository => context.read<SellerRepository>();

  MobileAnalytics get _analytics => context.read<MobileAnalytics>();

  AutoIqLocalizations get _copy => AutoIqLocalizations.of(context);

  @override
  Widget build(BuildContext context) {
    final references = context.watch<SessionController>().referenceData;
    return PopScope(
      canPop: !_dirty && !_hasActiveUploads,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _confirmExit();
      },
      child: Scaffold(
        appBar: AppBar(title: Text(_title)),
        body: SafeArea(child: _body(references)),
      ),
    );
  }

  String get _title =>
      _listingId == null ? _copy.text('newListing') : _copy.text('editListing');

  bool get _hasActiveUploads => _uploads.any((item) => item.canCancel);

  Widget _body(ReferenceDataSet? references) {
    if (!_referenceDataReady(references)) return _referenceUnavailable();
    if (_loading && _detail == null && widget.listingId != null) {
      return AppLoadingView(label: _copy.text('loadingListingDraft'));
    }
    if (_loadError != null && _detail == null) return _loadFailure();
    return Column(
      children: [
        SellerWizardProgress(
          currentStep: _step,
          completion: _stepCompletion,
          onSelected: _selectStep,
        ),
        if (_loading || _busy) const LinearProgressIndicator(minHeight: 3),
        Expanded(child: _stepBody(references!)),
        _footer(),
      ],
    );
  }

  bool _referenceDataReady(ReferenceDataSet? data) {
    return data != null &&
        data.bodyTypes.isNotEmpty &&
        data.fuelTypes.isNotEmpty &&
        data.transmissionTypes.isNotEmpty &&
        data.driveTypes.isNotEmpty &&
        data.conditionGrades.isNotEmpty;
  }

  Widget _referenceUnavailable() {
    return EmptyState(
      icon: Icons.sync_problem_outlined,
      title: _copy.text('vehicleOptionsUnavailable'),
      message: _copy.text('vehicleOptionsUnavailableMessage'),
      action: ElevatedButton(
        onPressed: context.read<SessionController>().refreshProfile,
        child: Text(_copy.retry),
      ),
    );
  }

  Widget _loadFailure() {
    return EmptyState(
      icon: Icons.cloud_off_outlined,
      title: _copy.text('listingUnavailable'),
      message: _loadError!.supportMessage,
      action: ElevatedButton(onPressed: _loadDetail, child: Text(_copy.retry)),
    );
  }

  Widget _stepBody(ReferenceDataSet references) {
    return AdaptiveContent(
      maxWidth: AppBreakpoints.formMaxWidth,
      child: AnimatedSwitcher(
        duration: AppMotion.standard,
        child: SingleChildScrollView(
          key: ValueKey(_step),
          padding: const EdgeInsets.only(bottom: AppSpacing.lg),
          child: _stepWidget(references),
        ),
      ),
    );
  }

  Widget _stepWidget(ReferenceDataSet references) {
    return switch (SellerWizardStep.values[_step]) {
      SellerWizardStep.specifications => _specifications(references),
      SellerWizardStep.pricing => _pricingStep(),
      SellerWizardStep.photos => _photosStep(),
      SellerWizardStep.documents => _documentsStep(),
      SellerWizardStep.review => _reviewStep(),
    };
  }

  Widget _specifications(ReferenceDataSet references) {
    return Form(
      key: _specsKey,
      child: SectionCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _StepHeading(
              title: _copy.text('specifications'),
              description: _copy.text('specificationsDescription'),
            ),
            _textField(_make, _copy.text('makeLabel')),
            _gap(),
            _textField(_model, _copy.text('modelLabel')),
            _gap(),
            _ResponsivePair(
              first: _integerField(
                _year,
                _copy.text('yearLabel'),
                1900,
                2100,
              ),
              second: _textField(_colour, _copy.text('colourLabel')),
            ),
            _gap(),
            _dropdown(
              _copy.text('bodyTypeLabel'),
              _selectedBodyType,
              references.bodyTypes,
              (value) => _selectedBodyType = value,
            ),
            _gap(),
            _dropdown(
              _copy.text('fuelTypeLabel'),
              _selectedFuelType,
              references.fuelTypes,
              (value) => _selectedFuelType = value,
            ),
            _gap(),
            _dropdown(
              _copy.text('transmissionLabel'),
              _selectedTransmission,
              references.transmissionTypes,
              (value) => _selectedTransmission = value,
            ),
            _gap(),
            _dropdown(
              _copy.text('driveTypeLabel'),
              _selectedDriveType,
              references.driveTypes,
              (value) => _selectedDriveType = value,
            ),
            _gap(),
            _dropdown(
              _copy.text('conditionLabel'),
              _selectedCondition,
              references.conditionGrades,
              (value) => _selectedCondition = value,
            ),
            _gap(),
            _ResponsivePair(
              first: _textField(
                _engine,
                _copy.text('engineOptional'),
                required: false,
              ),
              second: _integerField(
                _mileage,
                _copy.text('mileageKm'),
                0,
                5000000,
              ),
            ),
            _gap(),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _hasAccidentHistory,
              title: Text(_copy.text('accidentHistory')),
              onChanged: _editable ? _setAccidentHistory : null,
            ),
            if (_hasAccidentHistory)
              _textField(
                _accidentNote,
                _copy.text('accidentNote'),
                required: true,
                minLines: 2,
              ),
          ],
        ),
      ),
    );
  }

  Widget _pricingStep() {
    return Form(
      key: _pricingKey,
      child: SectionCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _StepHeading(
              title: _copy.text('pricing'),
              description: _copy.text('pricingDescription'),
            ),
            TextFormField(
              key: const Key('seller-price'),
              controller: _price,
              enabled: _editable,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(labelText: _copy.text('askPriceUsd')),
              validator: (value) => FormValidators.decimal(
                value,
                label: _copy.text('askPriceLabel'),
                minimum: 1,
              ),
              onChanged: _changed,
            ),
            _gap(),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _negotiable,
              title: Text(_copy.text('priceNegotiable')),
              onChanged: _editable ? _setNegotiable : null,
            ),
          ],
        ),
      ),
    );
  }

  Widget _photosStep() {
    return SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StepHeading(
            title: _copy.text('photos'),
            description: _copy.text('photosDescription'),
          ),
          if (_images.isEmpty)
            EmptyState(
              title: _copy.text('noPhotos'),
              message: _copy.text('noPhotosMessage'),
            )
          else
            _imageList(),
          _gap(),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              key: const Key('seller-upload-images'),
              onPressed: _editable ? _pickImages : null,
              icon: const Icon(Icons.photo_library_outlined),
              label: Text(_copy.text('addPhotos')),
            ),
          ),
          if (_imageUploads.isNotEmpty) ...[
            _gap(),
            ..._imageUploads.map(_uploadTile),
          ],
        ],
      ),
    );
  }

  Widget _imageList() {
    return ReorderableListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      buildDefaultDragHandles: false,
      itemCount: _images.length,
      onReorder: _editable ? _reorderImages : (_, __) {},
      itemBuilder: (context, index) {
        final image = _images[index];
        return _ImageEditorRow(
          key: ValueKey(image.id),
          image: image,
          index: index,
          busy: _assetBusy.contains(image.id),
          editable: _editable,
          onCover: () => _setCover(image),
          onDelete: () => _deleteImage(image),
        );
      },
    );
  }

  Widget _documentsStep() {
    final documents = _detail?.documents ?? const <SellerDocument>[];
    return SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _StepHeading(
            title: _copy.text('documents'),
            description: _copy.text('documentsDescription'),
          ),
          _documentDropdown(),
          _gap(),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              key: const Key('seller-upload-document'),
              onPressed: _editable ? _pickDocument : null,
              icon: const Icon(Icons.upload_file_outlined),
              label: Text(_copy.text('addDocument')),
            ),
          ),
          _gap(),
          if (documents.isEmpty)
            EmptyState(
              title: _copy.text('noDocuments'),
              message: _copy.text('noDocumentsMessage'),
            )
          else
            ...documents.map(_documentRow),
          if (_documentUploads.isNotEmpty) ...[
            _gap(),
            ..._documentUploads.map(_uploadTile),
          ],
        ],
      ),
    );
  }

  Widget _documentDropdown() {
    return DropdownButtonFormField<String>(
      initialValue: _documentType,
      decoration: InputDecoration(labelText: _copy.text('documentType')),
      items: SellerRepository.documentTypes
          .map(
            (type) => DropdownMenuItem(
              value: type,
              child: Text(_documentLabel(type)),
            ),
          )
          .toList(growable: false),
      onChanged: _editable
          ? (value) => setState(
                () => _documentType = value ?? _documentType,
              )
          : null,
    );
  }

  Widget _documentRow(SellerDocument document) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: const Icon(Icons.description_outlined),
      title: Text(_humanize(document.documentType)),
      subtitle: Text(_humanize(document.reviewStatus)),
      trailing: IconButton(
        tooltip: _copy.formatText(
          'deleteDocument',
          {'document': _humanize(document.documentType)},
        ),
        onPressed: !_editable || _assetBusy.contains(document.id)
            ? null
            : () => _deleteDocument(document),
        icon: _assetBusy.contains(document.id)
            ? _smallProgress()
            : const Icon(Icons.delete_outline),
      ),
    );
  }

  Widget _reviewStep() {
    final issues = sellerReadinessIssues(_detail, _disclosure.text);
    return Column(
      children: [
        Form(
          key: _reviewKey,
          child: SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _StepHeading(
                  title: _copy.text('reviewAndSubmit'),
                  description: _copy.text('reviewDescription'),
                ),
                _disclosureField(),
                _gap(),
                _ReadinessChecklist(issues: issues, onSelected: _goToIssue),
              ],
            ),
          ),
        ),
        _gap(),
        _timeline(),
      ],
    );
  }

  Widget _disclosureField() {
    return TextFormField(
      key: const Key('seller-disclosure'),
      controller: _disclosure,
      enabled: _editable,
      minLines: 5,
      maxLines: 8,
      decoration: InputDecoration(
        labelText: _copy.text('disclosurePrompt'),
      ),
      validator: (value) {
        final text = value?.trim() ?? '';
        return text.length < 20
            ? _copy.formatText('useAtLeastCharacters', {'count': 20})
            : null;
      },
      onChanged: _changed,
    );
  }

  Widget _timeline() {
    return SectionCard(
      child: FutureBuilder<List<SellerTimelineEntry>>(
        future: _timelineFuture,
        builder: (context, snapshot) {
          if (_listingId == null) return _emptyTimeline();
          if (snapshot.connectionState != ConnectionState.done) {
            return SizedBox(
              height: 140,
              child: AppLoadingView(label: _copy.text('loadingTimeline')),
            );
          }
          if (snapshot.hasError) return _timelineError(snapshot.error);
          final entries = snapshot.data ?? const <SellerTimelineEntry>[];
          if (entries.isEmpty) return _emptyTimeline();
          return _TimelineEntries(entries: entries);
        },
      ),
    );
  }

  Widget _emptyTimeline() {
    return EmptyState(
      icon: Icons.timeline_outlined,
      title: _copy.text('noTimeline'),
      message: _copy.text('noTimelineMessage'),
    );
  }

  Widget _timelineError(Object? error) {
    final message = error is ApiException
        ? error.supportMessage
        : _copy.text('checkConnection');
    return EmptyState(
      icon: Icons.cloud_off_outlined,
      title: _copy.text('timelineUnavailable'),
      message: message,
      action: TextButton(onPressed: _refreshTimeline, child: Text(_copy.retry)),
    );
  }

  Widget _footer() {
    return SafeArea(
      top: false,
      child: DecoratedBox(
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppColors.ink100)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(children: _navigationActions()),
              const SizedBox(height: AppSpacing.xs),
              SizedBox(
                width: double.infinity,
                child: TextButton.icon(
                  key: const Key('seller-save-exit'),
                  onPressed: _busy || !_editable ? null : _saveAndExit,
                  icon: const Icon(Icons.save_outlined),
                  label: Text(_copy.text('saveAndExit')),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  List<Widget> _navigationActions() {
    return [
      if (_step > 0) ...[
        Expanded(
          child: OutlinedButton(
            onPressed: _busy ? null : _back,
            child: Text(_copy.back),
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
      ],
      Expanded(
        child: ElevatedButton(
          key: Key(_step == 4 ? 'seller-submit' : 'seller-next'),
          onPressed: _primaryAction,
          child: _busy
              ? _smallProgress()
              : Text(
                  _step == 4
                      ? _copy.text('submitForReview')
                      : _copy.text('continueAction'),
                ),
        ),
      ),
    ];
  }

  VoidCallback? get _primaryAction {
    if (_busy || !_editable) return null;
    if (_step < 4) return _next;
    final ready = sellerReadinessIssues(_detail, _disclosure.text).isEmpty;
    return ready ? _submit : null;
  }

  Widget _textField(
    TextEditingController controller,
    String label, {
    bool required = true,
    int minLines = 1,
  }) {
    return TextFormField(
      controller: controller,
      enabled: _editable,
      minLines: minLines,
      maxLines: minLines == 1 ? 1 : 4,
      decoration: InputDecoration(labelText: label),
      validator: required
          ? (value) => FormValidators.requiredText(value, label: label)
          : null,
      onChanged: _changed,
    );
  }

  Widget _integerField(
    TextEditingController controller,
    String label,
    int minimum,
    int maximum,
  ) {
    return TextFormField(
      controller: controller,
      enabled: _editable,
      keyboardType: TextInputType.number,
      decoration: InputDecoration(labelText: label),
      validator: (value) => FormValidators.integer(
        value,
        label: label,
        minimum: minimum,
        maximum: maximum,
      ),
      onChanged: _changed,
    );
  }

  Widget _dropdown(
    String label,
    String? value,
    List<ReferenceOption> options,
    ValueChanged<String?> assign,
  ) {
    return DropdownButtonFormField<String>(
      key: ValueKey('$label-$value'),
      initialValue: _validValue(value, options),
      isExpanded: true,
      decoration: InputDecoration(labelText: label),
      items: options
          .map(
            (option) => DropdownMenuItem(
              value: option.value,
              child: Text(
                option.label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          )
          .toList(growable: false),
      validator: (next) => next == null ? '$label is required.' : null,
      onChanged: _editable
          ? (next) {
              setState(() => assign(next));
              _changed();
            }
          : null,
    );
  }

  String? _validValue(String? value, List<ReferenceOption> options) {
    return options.any((item) => item.value == value) ? value : null;
  }

  Widget _gap() => const SizedBox(height: AppSpacing.sm);

  Widget _smallProgress() {
    return const SizedBox.square(
      dimension: 20,
      child: CircularProgressIndicator(strokeWidth: 2),
    );
  }

  bool get _editable => _detail?.isEditable ?? true;

  List<SellerUploadTask> get _imageUploads => _uploads
      .where((item) => item.kind == SellerUploadKind.image)
      .toList(growable: false);

  List<SellerUploadTask> get _documentUploads => _uploads
      .where((item) => item.kind == SellerUploadKind.document)
      .toList(growable: false);

  void _initialize() {
    if (_didInitialize) return;
    final references = _references;
    if (!_referenceDataReady(references)) return;
    _didInitialize = true;
    _listingId = widget.listingId;
    _setReferenceDefaults(references!);
    if (_listingId != null) _loadDetail();
  }

  void _setReferenceDefaults(ReferenceDataSet data) {
    _selectedBodyType = data.bodyTypes.first.value;
    _selectedFuelType = data.fuelTypes.first.value;
    _selectedTransmission = data.transmissionTypes.first.value;
    _selectedDriveType = data.driveTypes.first.value;
    _selectedCondition = _preferredCondition(data.conditionGrades);
  }

  String _preferredCondition(List<ReferenceOption> options) {
    return options.any((item) => item.value == 'GOOD')
        ? 'GOOD'
        : options.first.value;
  }

  Future<void> _loadDetail() async {
    if (_listingId == null) return;
    setState(() {
      _loading = true;
      _loadError = null;
    });
    try {
      final detail = await _repository.detail(_listingId!);
      if (mounted) _syncDetail(detail, syncFields: true);
    } on ApiException catch (error) {
      if (mounted) setState(() => _loadError = error);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _syncDetail(SellerListingDetail detail, {required bool syncFields}) {
    setState(() {
      _detail = detail;
      _images = [...detail.images]..sort(_compareImagePosition);
      _timelineFuture = _repository.timeline(detail.id);
      if (syncFields) _syncFields(detail);
    });
  }

  int _compareImagePosition(VehicleImage left, VehicleImage right) {
    return left.position.compareTo(right.position);
  }

  void _syncFields(SellerListingDetail detail) {
    _make.text = detail.specs.make;
    _model.text = detail.specs.model;
    _year.text = '${detail.specs.year}';
    _colour.text = detail.specs.colour;
    _engine.text = detail.specs.engineCapacity ?? '';
    _mileage.text = '${detail.specs.mileageKm}';
    _price.text = detail.pricing.askPriceUsd.toStringAsFixed(0);
    _accidentNote.text = detail.specs.accidentNote ?? '';
    _disclosure.text = detail.sellerDisclosure ?? '';
    _selectedBodyType = detail.specs.bodyType;
    _selectedFuelType = detail.specs.fuelType;
    _selectedTransmission = detail.specs.transmission;
    _selectedDriveType = detail.specs.driveType;
    _selectedCondition = detail.specs.condition;
    _hasAccidentHistory = detail.specs.hasAccidentHistory;
    _negotiable = detail.pricing.negotiable;
    _dirty = false;
  }

  void _changed([String? _]) {
    _revision += 1;
    if (!_dirty) setState(() => _dirty = true);
    _scheduleAutosave();
  }

  void _scheduleAutosave() {
    _autosaveTimer?.cancel();
    if (_listingId == null) return;
    _autosaveTimer = Timer(const Duration(milliseconds: 800), _autosave);
  }

  Future<void> _autosave() async {
    if (_busy) {
      _scheduleAutosave();
      return;
    }
    if (!_canPersistWithoutValidation) return;
    await _persist(showFeedback: false, refresh: false);
  }

  bool get _canPersistWithoutValidation {
    return _make.text.trim().isNotEmpty &&
        _model.text.trim().isNotEmpty &&
        _colour.text.trim().isNotEmpty &&
        int.tryParse(_year.text.trim()) != null &&
        int.tryParse(_mileage.text.trim()) != null &&
        double.tryParse(_price.text.trim()) != null &&
        _selectedBodyType != null &&
        _selectedFuelType != null &&
        _selectedTransmission != null &&
        _selectedDriveType != null &&
        _selectedCondition != null;
  }

  void _setAccidentHistory(bool value) {
    setState(() => _hasAccidentHistory = value);
    _changed();
  }

  void _setNegotiable(bool value) {
    setState(() => _negotiable = value);
    _changed();
  }

  List<bool> get _stepCompletion => [
        _specValuesComplete,
        (double.tryParse(_price.text.trim()) ?? 0) > 0,
        _images.length >= 3 && _images.any((image) => image.isCover),
        _requiredDocumentsComplete,
        sellerReadinessIssues(_detail, _disclosure.text).isEmpty,
      ];

  bool get _specValuesComplete =>
      _make.text.trim().isNotEmpty &&
      _model.text.trim().isNotEmpty &&
      _colour.text.trim().isNotEmpty &&
      int.tryParse(_year.text.trim()) != null &&
      int.tryParse(_mileage.text.trim()) != null;

  bool get _requiredDocumentsComplete {
    final uploaded =
        _detail?.documents.map((item) => item.documentType).toSet() ?? {};
    return SellerRepository.requiredDocumentTypes
        .every((type) => uploaded.contains(type));
  }

  void _selectStep(int step) {
    if (_busy) return;
    setState(() => _step = step);
  }

  void _back() => setState(() => _step -= 1);

  Future<void> _next() async {
    if (!_validateCurrentStep()) return;
    if (_step == SellerWizardStep.pricing.index) {
      final saved = await _saveExplicit();
      if (!saved) return;
    }
    _recordStepCompleted();
    if (mounted) setState(() => _step += 1);
  }

  bool _validateCurrentStep() {
    final valid = switch (SellerWizardStep.values[_step]) {
      SellerWizardStep.specifications =>
        _specsKey.currentState?.validate() ?? false,
      SellerWizardStep.pricing => _pricingKey.currentState?.validate() ?? false,
      SellerWizardStep.review => _reviewKey.currentState?.validate() ?? false,
      _ => true,
    };
    if (!valid) {
      _analytics.record(
        MobileFunnelEvent.validationFailed,
        attributes: {
          'flow': 'seller_listing',
          'step': SellerWizardStep.values[_step].name,
          'validation_count': 1,
        },
      );
    }
    return valid;
  }

  void _recordStepCompleted() {
    _analytics.record(
      MobileFunnelEvent.sellerStepCompleted,
      attributes: {'step': SellerWizardStep.values[_step].name},
    );
  }

  Future<bool> _saveExplicit() async {
    setState(() => _busy = true);
    try {
      return await _persist(showFeedback: true, refresh: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<bool> _persist({
    required bool showFeedback,
    required bool refresh,
  }) async {
    final revision = _revision;
    try {
      await _persistListing();
      if (refresh) await _refreshDetail(syncFields: revision == _revision);
      if (revision == _revision && mounted) setState(() => _dirty = false);
      if (showFeedback) _show(_copy.text('draftSaved'));
      return true;
    } on ApiException catch (error) {
      if (showFeedback) _show(error.supportMessage);
      return false;
    }
  }

  Future<void> _persistListing() async {
    if (_listingId == null) {
      _listingId = await _repository.createDraft(
        make: _make.text,
        model: _model.text,
        year: int.parse(_year.text.trim()),
        bodyType: _selectedBodyType!,
        colour: _colour.text,
        fuelType: _selectedFuelType!,
        transmission: _selectedTransmission!,
        driveType: _selectedDriveType!,
        engineCapacity: _engine.text,
        mileageKm: int.parse(_mileage.text.trim()),
        condition: _selectedCondition!,
        hasAccidentHistory: _hasAccidentHistory,
        accidentNote: _accidentNote.text,
        askPriceUsd: double.parse(_price.text.trim()),
        negotiable: _negotiable,
      );
      _timelineFuture = _repository.timeline(_listingId!);
    } else {
      await _updateListing();
    }
    if (_disclosure.text.trim().length >= 20) {
      await _repository.updateDisclosure(
        listingId: _listingId!,
        sellerDisclosure: _disclosure.text,
      );
    }
  }

  Future<void> _updateListing() async {
    await _repository.updateSpecs(
      listingId: _listingId!,
      make: _make.text,
      model: _model.text,
      year: int.parse(_year.text.trim()),
      bodyType: _selectedBodyType!,
      colour: _colour.text,
      fuelType: _selectedFuelType!,
      transmission: _selectedTransmission!,
      driveType: _selectedDriveType!,
      engineCapacity: _engine.text,
      mileageKm: int.parse(_mileage.text.trim()),
      condition: _selectedCondition!,
      hasAccidentHistory: _hasAccidentHistory,
      accidentNote: _accidentNote.text,
    );
    await _repository.updatePricing(
      listingId: _listingId!,
      askPriceUsd: double.parse(_price.text.trim()),
      negotiable: _negotiable,
    );
  }

  Future<void> _refreshDetail({required bool syncFields}) async {
    if (_listingId == null) return;
    final detail = await _repository.detail(_listingId!);
    if (mounted) _syncDetail(detail, syncFields: syncFields);
  }

  Future<bool> _ensureDraft() async {
    if (_listingId != null) return true;
    final specsValid =
        _specsKey.currentState?.validate() ?? _specValuesComplete;
    final pricingValid = _pricingKey.currentState?.validate() ??
        (double.tryParse(_price.text.trim()) ?? 0) > 0;
    if (!specsValid || !pricingValid) {
      setState(() => _step = specsValid ? 1 : 0);
      _show(_copy.text('completeBeforeUpload'));
      return false;
    }
    return _saveExplicit();
  }

  Future<void> _saveAndExit() async {
    if (!_specValuesComplete ||
        (double.tryParse(_price.text.trim()) ?? 0) <= 0) {
      setState(() => _step = _specValuesComplete ? 1 : 0);
      _validateCurrentStep();
      return;
    }
    final saved = await _saveExplicit();
    if (saved && mounted) {
      _dirty = false;
      Navigator.pop(context);
    }
  }

  Future<void> _pickImages() async {
    if (!await _ensureDraft() || !mounted) return;
    final files = await ImagePicker().pickMultiImage(imageQuality: 85);
    if (files.isEmpty) return;
    final tasks = await _imageTasks(files);
    if (tasks.isEmpty || !mounted) return;
    setState(() => _uploads.addAll(tasks));
    await Future.wait(tasks.map(_uploadTask));
    await _refreshDetail(syncFields: false);
  }

  Future<List<SellerUploadTask>> _imageTasks(List<XFile> files) async {
    final slots = _availableImageSlots();
    final tasks = <SellerUploadTask>[];
    for (var index = 0; index < files.length && index < slots.length; index++) {
      final upload = await LocalUpload.fromXFile(files[index]);
      if (!_validImage(upload)) continue;
      tasks.add(
        SellerUploadTask(
          id: _taskId(index),
          file: upload!,
          kind: SellerUploadKind.image,
          slot: slots[index],
        ),
      );
    }
    if (files.length > slots.length) {
      _show(_copy.text('photoLimit'));
    }
    return tasks;
  }

  List<String> _availableImageSlots() {
    final used = {
      ..._images.map((image) => image.slot),
      ..._imageUploads.map((task) => task.slot),
    };
    return SellerRepository.imageSlots
        .where((slot) => !used.contains(slot))
        .toList(growable: false);
  }

  bool _validImage(LocalUpload? upload) {
    if (upload == null || !upload.fileType.isImage) {
      _show(_copy.text('photoTypeError'));
      return false;
    }
    if (upload.length > 10 * 1024 * 1024) {
      _show(_copy.formatText('photoSizeLimit', {'name': upload.name}));
      return false;
    }
    return true;
  }

  Future<void> _pickDocument() async {
    if (!await _ensureDraft() || !mounted) return;
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      withData: kIsWeb,
      allowedExtensions: const ['pdf', 'png', 'jpg', 'jpeg'],
    );
    if (result == null) return;
    final upload = await LocalUpload.fromXFile(result.xFiles.single);
    if (!_validDocument(upload)) return;
    final task = SellerUploadTask(
      id: _taskId(0),
      file: upload!,
      kind: SellerUploadKind.document,
      documentType: _documentType,
    );
    if (mounted) setState(() => _uploads.add(task));
    await _uploadTask(task);
    await _refreshDetail(syncFields: false);
  }

  bool _validDocument(LocalUpload? upload) {
    final type = upload?.fileType.contentType;
    const supported = {'application/pdf', 'image/jpeg', 'image/png'};
    if (upload == null || !supported.contains(type)) {
      _show(_copy.text('documentTypeError'));
      return false;
    }
    if (upload.length > 15 * 1024 * 1024) {
      _show(_copy.formatText('documentSizeLimit', {'name': upload.name}));
      return false;
    }
    return true;
  }

  String _taskId(int index) =>
      '${DateTime.now().microsecondsSinceEpoch}-$index';

  Future<void> _uploadTask(SellerUploadTask task) async {
    _updateTask(task, SellerUploadState.uploading);
    try {
      if (task.kind == SellerUploadKind.image) {
        await _uploadImage(task);
      } else {
        await _uploadDocument(task);
      }
      _updateTask(task, SellerUploadState.completed, progress: 1);
    } on ApiException catch (error) {
      _handleUploadError(task, error);
    }
  }

  Future<void> _uploadImage(SellerUploadTask task) {
    return _repository.uploadImage(
      listingId: _listingId!,
      file: task.file,
      slot: task.slot!,
      isCover: _images.isEmpty && task == _imageUploads.first,
      onProgress: (sent, total) => _setProgress(task, sent, total),
      cancelToken: task.cancelToken,
    );
  }

  Future<void> _uploadDocument(SellerUploadTask task) {
    return _repository.uploadDocument(
      listingId: _listingId!,
      file: task.file,
      documentType: task.documentType!,
      onProgress: (sent, total) => _setProgress(task, sent, total),
      cancelToken: task.cancelToken,
    );
  }

  void _setProgress(SellerUploadTask task, int sent, int total) {
    final denominator = total > 0 ? total : task.file.length;
    if (mounted) setState(() => task.progress = sent / denominator);
  }

  void _updateTask(
    SellerUploadTask task,
    SellerUploadState state, {
    double? progress,
  }) {
    if (!mounted) return;
    setState(() {
      task.state = state;
      if (progress != null) task.progress = progress;
      task.error = null;
    });
  }

  void _handleUploadError(SellerUploadTask task, ApiException error) {
    if (!mounted) return;
    setState(() {
      task.state = error.code == 'UPLOAD_CANCELLED'
          ? SellerUploadState.cancelled
          : SellerUploadState.failed;
      task.error = error.supportMessage;
    });
    _analytics.record(
      MobileFunnelEvent.uploadFailed,
      attributes: {
        'file_kind': task.kind.name,
        'error_code': error.code ?? 'UNKNOWN',
      },
    );
  }

  Widget _uploadTile(SellerUploadTask task) {
    return _UploadTaskTile(
      task: task,
      onCancel: () => _cancelUpload(task),
      onRetry: () => _retryUpload(task),
      onRemove: () => _removeUpload(task),
    );
  }

  void _cancelUpload(SellerUploadTask task) {
    task.cancelToken.cancel('Cancelled by user');
  }

  Future<void> _retryUpload(SellerUploadTask task) async {
    task.prepareRetry();
    await _uploadTask(task);
    if (task.state == SellerUploadState.completed) {
      await _refreshDetail(syncFields: false);
    }
  }

  void _removeUpload(SellerUploadTask task) {
    if (task.canCancel) task.cancelToken.cancel('Removed by user');
    setState(() => _uploads.remove(task));
  }

  Future<void> _reorderImages(int oldIndex, int newIndex) async {
    if (newIndex > oldIndex) newIndex -= 1;
    final previous = [..._images];
    setState(() {
      final image = _images.removeAt(oldIndex);
      _images.insert(newIndex, image);
    });
    try {
      await _repository.reorderImages(
        listingId: _listingId!,
        imageIds: _images.map((image) => image.id).toList(),
      );
      await _refreshDetail(syncFields: false);
    } on ApiException catch (error) {
      if (mounted) setState(() => _images = previous);
      _show(error.supportMessage);
    }
  }

  Future<void> _setCover(VehicleImage image) async {
    await _withAssetBusy(image.id, () async {
      await _repository.setCoverImage(
        listingId: _listingId!,
        imageId: image.id,
      );
      await _refreshDetail(syncFields: false);
    });
  }

  Future<void> _deleteImage(VehicleImage image) async {
    await _withAssetBusy(image.id, () async {
      await _repository.deleteImage(
        listingId: _listingId!,
        imageId: image.id,
      );
      await _refreshDetail(syncFields: false);
    });
  }

  Future<void> _deleteDocument(SellerDocument document) async {
    await _withAssetBusy(document.id, () async {
      await _repository.deleteDocument(
        listingId: _listingId!,
        documentId: document.id,
      );
      await _refreshDetail(syncFields: false);
    });
  }

  Future<void> _withAssetBusy(
    String id,
    Future<void> Function() action,
  ) async {
    setState(() => _assetBusy.add(id));
    try {
      await action();
    } on ApiException catch (error) {
      _show(error.supportMessage);
    } finally {
      if (mounted) setState(() => _assetBusy.remove(id));
    }
  }

  Future<void> _refreshTimeline() async {
    if (_listingId == null) return;
    setState(() {
      _timelineFuture = _repository.timeline(_listingId!);
    });
    await _timelineFuture;
  }

  void _goToIssue(SellerReadinessIssue issue) {
    setState(() => _step = issue.step.index);
  }

  Future<void> _submit() async {
    if (!(_reviewKey.currentState?.validate() ?? false)) return;
    final confirmed = await _confirmSubmission();
    if (!confirmed || !mounted) return;
    _autosaveTimer?.cancel();
    _autosaveTimer = null;
    setState(() => _busy = true);
    try {
      await _repository.submit(
        listingId: _listingId!,
        disclosure: _disclosure.text,
      );
      await _refreshDetail(syncFields: false);
      _dirty = false;
      _show(_copy.text('listingSubmitted'));
    } on ApiException catch (error) {
      _show(error.supportMessage);
      _scheduleAutosave();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<bool> _confirmSubmission() async {
    return await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: Text(_copy.text('submitListingTitle')),
            content: Text(_copy.text('submitListingMessage')),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: Text(_copy.cancel),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(context, true),
                child: Text(_copy.text('submit')),
              ),
            ],
          ),
        ) ??
        false;
  }

  Future<void> _confirmExit() async {
    if (_hasActiveUploads) {
      _show(_copy.text('cancelUploadsBeforeLeaving'));
      return;
    }
    final discard = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(_copy.text('leaveWithoutSaving')),
        content: Text(_copy.text('leaveWithoutSavingMessage')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(_copy.text('keepEditing')),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(_copy.text('discard')),
          ),
        ],
      ),
    );
    if (discard == true && mounted) {
      _analytics.record(
        MobileFunnelEvent.flowAbandoned,
        attributes: {'flow': 'seller_listing', 'reason': 'discarded_changes'},
      );
      setState(() => _dirty = false);
      Navigator.pop(context);
    }
  }

  String _documentLabel(String type) {
    final required = SellerRepository.requiredDocumentTypes.contains(type);
    final suffix = required ? ' · ${_copy.text('requiredSuffix')}' : '';
    return '${_humanize(type)}$suffix';
  }

  String _humanize(String value) {
    final text = value.toLowerCase().replaceAll('_', ' ');
    return '${text[0].toUpperCase()}${text.substring(1)}';
  }

  void _show(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }
}

class SellerWizardProgress extends StatelessWidget {
  const SellerWizardProgress({
    super.key,
    required this.currentStep,
    required this.completion,
    required this.onSelected,
  });

  final int currentStep;
  final List<bool> completion;
  final ValueChanged<int> onSelected;

  static const _labelKeys = [
    'stepSpecs',
    'pricing',
    'photos',
    'documents',
    'stepReview',
  ];

  @override
  Widget build(BuildContext context) {
    final labels = _labels(context);
    return Semantics(
      container: true,
      label: AutoIqLocalizations.of(context).formatText(
        'listingStepOf',
        {'current': currentStep + 1, 'total': labels.length},
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.all(AppSpacing.sm),
        child: Row(
          children: List.generate(
            labels.length,
            (index) => _stepChip(index, labels[index]),
          ),
        ),
      ),
    );
  }

  List<String> _labels(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return _labelKeys.map(copy.text).toList(growable: false);
  }

  Widget _stepChip(int index, String label) {
    final selected = index == currentStep;
    return Padding(
      padding: const EdgeInsets.only(right: AppSpacing.xs),
      child: ChoiceChip(
        key: Key('seller-step-$index'),
        selected: selected,
        avatar: Icon(
          completion[index] ? Icons.check_circle : Icons.circle_outlined,
          size: 18,
        ),
        label: Text(label),
        onSelected: (_) => onSelected(index),
      ),
    );
  }
}

class _StepHeading extends StatelessWidget {
  const _StepHeading({required this.title, required this.description});

  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: AppColors.ink900,
                ),
          ),
          const SizedBox(height: AppSpacing.xxs),
          Text(description, style: const TextStyle(color: AppColors.ink500)),
        ],
      ),
    );
  }
}

class _ResponsivePair extends StatelessWidget {
  const _ResponsivePair({required this.first, required this.second});

  final Widget first;
  final Widget second;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 480) {
          return Column(
            children: [
              first,
              const SizedBox(height: AppSpacing.sm),
              second,
            ],
          );
        }
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: first),
            const SizedBox(width: AppSpacing.sm),
            Expanded(child: second),
          ],
        );
      },
    );
  }
}

class _ImageEditorRow extends StatelessWidget {
  const _ImageEditorRow({
    super.key,
    required this.image,
    required this.index,
    required this.busy,
    required this.editable,
    required this.onCover,
    required this.onDelete,
  });

  final VehicleImage image;
  final int index;
  final bool busy;
  final bool editable;
  final VoidCallback onCover;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: ListTile(
        leading: SizedBox(
          width: 72,
          child: VehicleImageView(
            imageUrl: image.url,
            height: 56,
            semanticLabel: copy.formatText(
              'listingPhoto',
              {'count': index + 1},
            ),
          ),
        ),
        title: Text(
          image.isCover
              ? copy.text('coverPhoto')
              : copy.formatText('photoNumber', {'count': index + 1}),
        ),
        subtitle: Text(image.slot.replaceAll('_', ' ').toLowerCase()),
        trailing: busy ? _progress() : _actions(copy),
      ),
    );
  }

  Widget _actions(AutoIqLocalizations copy) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          tooltip: image.isCover
              ? copy.text('currentCoverPhoto')
              : copy.text('makeCoverPhoto'),
          onPressed: !editable || image.isCover ? null : onCover,
          icon: Icon(image.isCover ? Icons.star : Icons.star_border),
        ),
        IconButton(
          tooltip: copy.text('deletePhoto'),
          onPressed: editable ? onDelete : null,
          icon: const Icon(Icons.delete_outline),
        ),
        if (editable)
          ReorderableDragStartListener(
            index: index,
            child: const SizedBox.square(
              dimension: AppSizes.minimumTouchTarget,
              child: Icon(Icons.drag_handle),
            ),
          ),
      ],
    );
  }

  Widget _progress() {
    return const SizedBox.square(
      dimension: 20,
      child: CircularProgressIndicator(strokeWidth: 2),
    );
  }
}

class _UploadTaskTile extends StatelessWidget {
  const _UploadTaskTile({
    required this.task,
    required this.onCancel,
    required this.onRetry,
    required this.onRemove,
  });

  final SellerUploadTask task;
  final VoidCallback onCancel;
  final VoidCallback onRetry;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Semantics(
      liveRegion: true,
      label: '${task.file.name}, ${_stateLabel(task.state, copy)}',
      child: ListTile(
        contentPadding: EdgeInsets.zero,
        leading: _leading(),
        title:
            Text(task.file.name, maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: _subtitle(copy),
        trailing: _action(copy),
      ),
    );
  }

  Widget _leading() {
    if (task.state == SellerUploadState.completed) {
      return const Icon(Icons.check_circle, color: AppColors.verifiedText);
    }
    if (task.state == SellerUploadState.failed) {
      return const Icon(Icons.error_outline, color: AppColors.reject);
    }
    return const Icon(Icons.upload_file_outlined);
  }

  Widget _subtitle(AutoIqLocalizations copy) {
    if (task.state == SellerUploadState.uploading) {
      return LinearProgressIndicator(value: task.progress.clamp(0, 1));
    }
    return Text(task.error ?? _stateLabel(task.state, copy));
  }

  Widget _action(AutoIqLocalizations copy) {
    if (task.canCancel) {
      return IconButton(
        tooltip: copy.text('cancelUpload'),
        onPressed: onCancel,
        icon: const Icon(Icons.cancel_outlined),
      );
    }
    if (task.canRetry) {
      return IconButton(
        tooltip: copy.text('retryUpload'),
        onPressed: onRetry,
        icon: const Icon(Icons.refresh),
      );
    }
    return IconButton(
      tooltip: copy.text('removeUploadItem'),
      onPressed: onRemove,
      icon: const Icon(Icons.close),
    );
  }

  String _stateLabel(
    SellerUploadState state,
    AutoIqLocalizations copy,
  ) {
    return switch (state) {
      SellerUploadState.queued => copy.text('queued'),
      SellerUploadState.uploading => copy.formatText(
          'uploadingPercent',
          {'percent': (task.progress * 100).round()},
        ),
      SellerUploadState.failed => copy.text('uploadFailed'),
      SellerUploadState.cancelled => copy.text('uploadCancelled'),
      SellerUploadState.completed => copy.text('uploadComplete'),
    };
  }
}

class _ReadinessChecklist extends StatelessWidget {
  const _ReadinessChecklist({required this.issues, required this.onSelected});

  final List<SellerReadinessIssue> issues;
  final ValueChanged<SellerReadinessIssue> onSelected;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    if (issues.isEmpty) {
      return ListTile(
        contentPadding: EdgeInsets.zero,
        leading: const Icon(
          Icons.check_circle,
          color: AppColors.verifiedText,
        ),
        title: Text(copy.text('readyToSubmit')),
        subtitle: Text(copy.text('readyToSubmitMessage')),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          copy.text('publishingReadiness'),
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        ...issues.map(
          (issue) => ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.radio_button_unchecked),
            title: Text(copy.formatText(issue.messageKey, issue.values)),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => onSelected(issue),
          ),
        ),
      ],
    );
  }
}

class _TimelineEntries extends StatelessWidget {
  const _TimelineEntries({required this.entries});

  final List<SellerTimelineEntry> entries;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          copy.text('timeline'),
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: AppSpacing.sm),
        ...entries.map((entry) => _entry(context, entry)),
      ],
    );
  }

  Widget _entry(BuildContext context, SellerTimelineEntry entry) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          StatusChip(label: entry.status),
          const SizedBox(width: AppSpacing.xs),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  AppFormatters.dateTime(
                    context,
                    DateTime.parse(entry.occurredAt).toLocal(),
                  ),
                ),
                if (entry.note != null) Text(entry.note!),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
