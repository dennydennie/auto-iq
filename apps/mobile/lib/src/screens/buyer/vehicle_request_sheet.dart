import 'package:flutter/material.dart';

import '../../../theme/app_colors.dart';
import '../../../theme/app_tokens.dart';
import '../../core/forms/form_validators.dart';
import '../../core/i18n/app_localizations.dart';
import '../../core/network/api_exception.dart';
import '../../core/observability/mobile_analytics.dart';
import '../../models/reference_data.dart';
import '../../repositories/buyer_repository.dart';

class VehicleRequestSheet extends StatefulWidget {
  const VehicleRequestSheet({
    super.key,
    required this.repository,
    required this.makes,
    required this.bodyTypes,
    required this.fuelTypes,
    required this.transmissions,
    required this.analytics,
  });

  final BuyerRepository repository;
  final List<VehicleMake> makes;
  final List<ReferenceOption> bodyTypes;
  final List<ReferenceOption> fuelTypes;
  final List<ReferenceOption> transmissions;
  final MobileAnalytics analytics;

  @override
  State<VehicleRequestSheet> createState() => _VehicleRequestSheetState();
}

class _VehicleRequestSheetState extends State<VehicleRequestSheet> {
  final _formKey = GlobalKey<FormState>();
  final _budget = TextEditingController();
  final _model = TextEditingController();
  final _yearMin = TextEditingController();
  final _yearMax = TextEditingController();
  final _odometer = TextEditingController();
  final _notes = TextEditingController();

  String _urgency = 'ASAP';
  String? _makeId;
  String? _bodyTypeId;
  String? _fuelTypeId;
  String? _transmissionId;
  String? _rangeError;
  bool _busy = false;

  @override
  void dispose() {
    for (final controller in _controllers) {
      controller.dispose();
    }
    super.dispose();
  }

  List<TextEditingController> get _controllers => [
        _budget,
        _model,
        _yearMin,
        _yearMax,
        _odometer,
        _notes,
      ];

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Theme.of(context).scaffoldBackgroundColor,
      child: SafeArea(
        child: Column(
          children: [
            _header(),
            Expanded(child: _form()),
            _actions(),
          ],
        ),
      ),
    );
  }

  Widget _header() {
    final copy = AutoIqLocalizations.of(context);
    return ListTile(
      title: Text(
        copy.text('vehicleRequestTitle'),
        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
      ),
      subtitle: Text(copy.text('vehicleRequestDescription')),
      trailing: IconButton(
        tooltip: copy.text('close'),
        onPressed: _busy ? null : () => Navigator.pop(context, false),
        icon: const Icon(Icons.close),
      ),
    );
  }

  Widget _form() {
    return Form(
      key: _formKey,
      child: ListView(
        padding: EdgeInsets.fromLTRB(
          AppSpacing.md,
          AppSpacing.xs,
          AppSpacing.md,
          MediaQuery.viewInsetsOf(context).bottom + AppSpacing.md,
        ),
        children: [
          _budgetField(),
          const SizedBox(height: AppSpacing.sm),
          _preferenceDropdowns(),
          const SizedBox(height: AppSpacing.sm),
          _yearFields(),
          if (_rangeError != null) _rangeErrorText(),
          const SizedBox(height: AppSpacing.sm),
          _odometerField(),
          const SizedBox(height: AppSpacing.sm),
          _urgencyField(),
          const SizedBox(height: AppSpacing.sm),
          _notesField(),
        ],
      ),
    );
  }

  Widget _budgetField() {
    final copy = AutoIqLocalizations.of(context);
    return TextFormField(
      key: const Key('request-budget'),
      controller: _budget,
      enabled: !_busy,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      decoration: InputDecoration(labelText: copy.text('maxBudgetUsd')),
      validator: (value) => FormValidators.decimal(
        value,
        label: copy.text('maximumBudget'),
        minimum: 1,
      ),
    );
  }

  Widget _preferenceDropdowns() {
    final copy = AutoIqLocalizations.of(context);
    return Column(
      children: [
        _optionalDropdown(
          label: copy.make,
          emptyLabel: copy.text('noMakePreference'),
          value: _makeId,
          options: widget.makes.map((item) => (item.id, item.name)).toList(),
          onChanged: (value) => setState(() => _makeId = value),
        ),
        const SizedBox(height: AppSpacing.sm),
        TextFormField(
          controller: _model,
          enabled: !_busy,
          decoration: InputDecoration(labelText: copy.text('modelOptional')),
        ),
        const SizedBox(height: AppSpacing.sm),
        _referenceDropdown(
          copy.bodyType,
          _bodyTypeId,
          widget.bodyTypes,
          (value) => _bodyTypeId = value,
        ),
        const SizedBox(height: AppSpacing.sm),
        _referenceDropdown(
          copy.fuelType,
          _fuelTypeId,
          widget.fuelTypes,
          (value) => _fuelTypeId = value,
        ),
        const SizedBox(height: AppSpacing.sm),
        _referenceDropdown(
          copy.transmission,
          _transmissionId,
          widget.transmissions,
          (value) => _transmissionId = value,
        ),
      ],
    );
  }

  Widget _referenceDropdown(
    String label,
    String? value,
    List<ReferenceOption> options,
    ValueChanged<String?> onChanged,
  ) {
    return _optionalDropdown(
      label: label,
      emptyLabel: AutoIqLocalizations.of(context).text('noPreference'),
      value: value,
      options: options.map((item) => (item.value, item.label)).toList(),
      onChanged: (next) => setState(() => onChanged(next)),
    );
  }

  Widget _optionalDropdown({
    required String label,
    required String emptyLabel,
    required String? value,
    required List<(String, String)> options,
    required ValueChanged<String?> onChanged,
  }) {
    return DropdownButtonFormField<String?>(
      initialValue: value,
      isExpanded: true,
      decoration: InputDecoration(labelText: label),
      items: [
        DropdownMenuItem(value: null, child: Text(emptyLabel)),
        ...options.map(
          (item) => DropdownMenuItem(value: item.$1, child: Text(item.$2)),
        ),
      ],
      onChanged: _busy ? null : onChanged,
    );
  }

  Widget _yearFields() {
    final copy = AutoIqLocalizations.of(context);
    return LayoutBuilder(
      builder: (context, constraints) {
        final minimum = _yearField(
          _yearMin,
          copy.text('yearMin'),
          copy.text('minimumYear'),
        );
        final maximum = _yearField(
          _yearMax,
          copy.text('yearMax'),
          copy.text('maximumYear'),
        );
        if (constraints.maxWidth < 520) {
          return Column(
            children: [
              minimum,
              const SizedBox(height: AppSpacing.sm),
              maximum,
            ],
          );
        }
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: minimum),
            const SizedBox(width: AppSpacing.sm),
            Expanded(child: maximum),
          ],
        );
      },
    );
  }

  Widget _yearField(
    TextEditingController controller,
    String label,
    String validatorLabel,
  ) {
    return TextFormField(
      key: Key(
        identical(controller, _yearMin)
            ? 'request-year-min'
            : 'request-year-max',
      ),
      controller: controller,
      enabled: !_busy,
      keyboardType: TextInputType.number,
      decoration: InputDecoration(labelText: label),
      validator: (value) => FormValidators.integer(
        value,
        label: validatorLabel,
        minimum: 1900,
        maximum: 2100,
        optional: true,
      ),
    );
  }

  Widget _rangeErrorText() {
    return Padding(
      padding: const EdgeInsets.only(top: AppSpacing.xs),
      child: Text(
        _rangeError!,
        style: TextStyle(color: Theme.of(context).colorScheme.error),
      ),
    );
  }

  Widget _odometerField() {
    final copy = AutoIqLocalizations.of(context);
    return TextFormField(
      key: const Key('request-odometer'),
      controller: _odometer,
      enabled: !_busy,
      keyboardType: TextInputType.number,
      decoration: InputDecoration(labelText: copy.text('maxOdometerKm')),
      validator: (value) => FormValidators.integer(
        value,
        label: copy.text('maximumOdometer'),
        minimum: 0,
        optional: true,
      ),
    );
  }

  Widget _urgencyField() {
    final copy = AutoIqLocalizations.of(context);
    return DropdownButtonFormField<String>(
      initialValue: _urgency,
      decoration: InputDecoration(labelText: copy.text('urgency')),
      items: [
        DropdownMenuItem(value: 'ASAP', child: Text(copy.text('asap'))),
        DropdownMenuItem(
          value: 'ONE_MONTH',
          child: Text(copy.text('withinOneMonth')),
        ),
        DropdownMenuItem(
          value: 'BROWSING',
          child: Text(copy.text('stillBrowsing')),
        ),
      ],
      onChanged: _busy
          ? null
          : (value) => setState(() => _urgency = value ?? _urgency),
    );
  }

  Widget _notesField() {
    final copy = AutoIqLocalizations.of(context);
    return TextFormField(
      controller: _notes,
      enabled: !_busy,
      minLines: 3,
      maxLines: 5,
      decoration: InputDecoration(labelText: copy.text('notesOptional')),
    );
  }

  Widget _actions() {
    final copy = AutoIqLocalizations.of(context);
    return DecoratedBox(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.ink100)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: _busy ? null : () => Navigator.pop(context, false),
                child: Text(copy.cancel),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: ElevatedButton(
                key: const Key('submit-vehicle-request'),
                onPressed: _busy ? null : _submit,
                child: _busy ? _progress() : Text(copy.text('createRequest')),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _progress() {
    return const SizedBox.square(
      dimension: 20,
      child: CircularProgressIndicator(strokeWidth: 2),
    );
  }

  Future<void> _submit() async {
    if (!_validate()) return;
    setState(() => _busy = true);
    try {
      await widget.repository.createVehicleRequest(
        maxBudgetCents: (double.parse(_budget.text.trim()) * 100).round(),
        makeId: _makeId,
        model: _model.text,
        yearMin: optionalInt(_yearMin.text),
        yearMax: optionalInt(_yearMax.text),
        bodyTypeId: _bodyTypeId,
        fuelTypeId: _fuelTypeId,
        transmissionTypeId: _transmissionId,
        maxOdometerKm: optionalInt(_odometer.text),
        urgency: _urgency,
        notes: _notes.text,
      );
      widget.analytics.record(MobileFunnelEvent.vehicleRequestSubmitted);
      if (mounted) Navigator.pop(context, true);
    } on ApiException catch (error) {
      _showError(error.supportMessage);
      if (mounted) setState(() => _busy = false);
    }
  }

  bool _validate() {
    final valid = _formKey.currentState?.validate() ?? false;
    final minimum = optionalInt(_yearMin.text);
    final maximum = optionalInt(_yearMax.text);
    final validRange = minimum == null || maximum == null || minimum <= maximum;
    setState(() {
      _rangeError = validRange
          ? null
          : AutoIqLocalizations.of(context).text('yearRangeError');
    });
    if (!valid || !validRange) {
      widget.analytics.record(
        MobileFunnelEvent.validationFailed,
        attributes: {
          'flow': 'vehicle_request',
          'validation_count': valid ? 1 : 2,
        },
      );
    }
    return valid && validRange;
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }
}
