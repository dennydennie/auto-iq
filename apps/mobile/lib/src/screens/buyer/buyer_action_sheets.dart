import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../theme/app_colors.dart';
import '../../../theme/app_tokens.dart';
import '../../core/forms/form_validators.dart';
import '../../core/i18n/app_formatters.dart';
import '../../core/i18n/app_localizations.dart';
import '../../core/network/api_exception.dart';
import '../../core/observability/mobile_analytics.dart';
import '../../models/listing_models.dart';
import '../../models/reference_data.dart';
import '../../repositories/buyer_repository.dart';

class QuoteRequestSheet extends StatefulWidget {
  const QuoteRequestSheet({
    super.key,
    required this.listing,
    required this.repository,
    required this.analytics,
  });

  final ListingDetail listing;
  final BuyerRepository repository;
  final MobileAnalytics analytics;

  @override
  State<QuoteRequestSheet> createState() => _QuoteRequestSheetState();
}

class _QuoteRequestSheetState extends State<QuoteRequestSheet> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _offer;
  final _message = TextEditingController();
  String _paymentPlan = 'FULL_CASH';
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _offer = TextEditingController(
      text: widget.listing.askPriceUsd.toStringAsFixed(0),
    );
  }

  @override
  void dispose() {
    _offer.dispose();
    _message.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return _ActionSheetFrame(
      title: copy.text('quoteRequestTitle'),
      subtitle: widget.listing.title,
      busy: _busy,
      submitKey: const Key('submit-quote'),
      submitLabel: copy.text('sendQuoteRequest'),
      onSubmit: _submit,
      child: Form(
        key: _formKey,
        child: Column(
          children: [
            TextFormField(
              key: const Key('quote-offer'),
              controller: _offer,
              enabled: !_busy,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                labelText: copy.text('offerPriceUsd'),
              ),
              validator: (value) => FormValidators.decimal(
                value,
                label: copy.text('offerPrice'),
                minimum: 1,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            DropdownButtonFormField<String>(
              initialValue: _paymentPlan,
              decoration: InputDecoration(labelText: copy.text('paymentPlan')),
              items: [
                DropdownMenuItem(
                  value: 'FULL_CASH',
                  child: Text(copy.text('fullCash')),
                ),
                DropdownMenuItem(
                  value: 'BANK_TRANSFER',
                  child: Text(copy.text('bankTransfer')),
                ),
                DropdownMenuItem(
                  value: 'OTHER',
                  child: Text(copy.text('other')),
                ),
              ],
              onChanged: _busy
                  ? null
                  : (value) =>
                      setState(() => _paymentPlan = value ?? _paymentPlan),
            ),
            const SizedBox(height: AppSpacing.sm),
            TextFormField(
              controller: _message,
              enabled: !_busy,
              minLines: 4,
              maxLines: 6,
              decoration: InputDecoration(
                labelText: copy.text('messageOptional'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      _recordValidationFailure(widget.analytics, 'quote');
      return;
    }
    setState(() => _busy = true);
    try {
      await widget.repository.createQuote(
        listingId: widget.listing.id,
        offerPriceUsd: double.parse(_offer.text.trim()),
        paymentPlan: _paymentPlan,
        message: _message.text,
      );
      widget.analytics.record(
        MobileFunnelEvent.quoteSubmitted,
        attributes: {'payment_plan': _paymentPlan},
      );
      if (mounted) Navigator.pop(context, true);
    } on ApiException catch (error) {
      _handleError(error);
    }
  }

  void _handleError(ApiException error) {
    if (!mounted) return;
    setState(() => _busy = false);
    _showError(context, error.supportMessage);
  }
}

class ViewingRequestSheet extends StatefulWidget {
  const ViewingRequestSheet({
    super.key,
    required this.listing,
    required this.locations,
    required this.repository,
    required this.analytics,
  });

  final ListingDetail listing;
  final List<ViewingLocation> locations;
  final BuyerRepository repository;
  final MobileAnalytics analytics;

  @override
  State<ViewingRequestSheet> createState() => _ViewingRequestSheetState();
}

class _ViewingRequestSheetState extends State<ViewingRequestSheet> {
  final _formKey = GlobalKey<FormState>();
  final _note = TextEditingController();
  late DateTime _date;
  TimeOfDay _time = const TimeOfDay(hour: 10, minute: 0);
  String? _locationId;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    final tomorrow = DateTime.now().add(const Duration(days: 1));
    _date = DateTime(tomorrow.year, tomorrow.month, tomorrow.day);
  }

  @override
  void dispose() {
    _note.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return _ActionSheetFrame(
      title: copy.text('viewingRequestTitle'),
      subtitle: widget.listing.title,
      busy: _busy,
      submitKey: const Key('submit-viewing'),
      submitLabel: copy.text('viewingRequestTitle'),
      onSubmit: _submit,
      child: Form(
        key: _formKey,
        child: Column(
          children: [
            _dateTile(),
            _timeTile(),
            const SizedBox(height: AppSpacing.xs),
            _locationField(),
            const SizedBox(height: AppSpacing.sm),
            TextFormField(
              controller: _note,
              enabled: !_busy,
              minLines: 4,
              maxLines: 6,
              decoration: InputDecoration(
                labelText: copy.text('noteOptional'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _dateTile() {
    final copy = AutoIqLocalizations.of(context);
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(copy.text('preferredDate')),
      subtitle: Text(AppFormatters.shortDate(context, _date)),
      trailing: const Icon(Icons.calendar_today_outlined),
      onTap: _busy ? null : _pickDate,
    );
  }

  Widget _timeTile() {
    final copy = AutoIqLocalizations.of(context);
    return ListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(copy.text('preferredTime')),
      subtitle: Text(_time.format(context)),
      trailing: const Icon(Icons.schedule_outlined),
      onTap: _busy ? null : _pickTime,
    );
  }

  Widget _locationField() {
    final copy = AutoIqLocalizations.of(context);
    return DropdownButtonFormField<String>(
      key: const Key('viewing-location'),
      initialValue: _locationId,
      decoration: InputDecoration(labelText: copy.text('viewingLocation')),
      items: widget.locations
          .map(
            (location) => DropdownMenuItem(
              value: location.id,
              child: Text(location.name),
            ),
          )
          .toList(growable: false),
      onChanged: _busy ? null : (value) => setState(() => _locationId = value),
      validator: (value) =>
          value == null ? copy.text('chooseViewingLocation') : null,
    );
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 60)),
    );
    if (picked != null && mounted) setState(() => _date = picked);
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(context: context, initialTime: _time);
    if (picked != null && mounted) setState(() => _time = picked);
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      _recordValidationFailure(widget.analytics, 'viewing');
      return;
    }
    setState(() => _busy = true);
    try {
      await widget.repository.requestViewing(
        listingId: widget.listing.id,
        preferredDate: DateFormat('yyyy-MM-dd').format(_date),
        preferredTime: _timeValue,
        locationId: _locationId!,
        note: _note.text,
      );
      widget.analytics.record(MobileFunnelEvent.viewingSubmitted);
      if (mounted) Navigator.pop(context, true);
    } on ApiException catch (error) {
      _handleError(error);
    }
  }

  String get _timeValue {
    final hour = _time.hour.toString().padLeft(2, '0');
    final minute = _time.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }

  void _handleError(ApiException error) {
    if (!mounted) return;
    setState(() => _busy = false);
    _showError(context, error.supportMessage);
  }
}

class _ActionSheetFrame extends StatelessWidget {
  const _ActionSheetFrame({
    required this.title,
    required this.subtitle,
    required this.busy,
    required this.submitKey,
    required this.submitLabel,
    required this.onSubmit,
    required this.child,
  });

  final String title;
  final String subtitle;
  final bool busy;
  final Key submitKey;
  final String submitLabel;
  final VoidCallback onSubmit;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Theme.of(context).scaffoldBackgroundColor,
      child: SafeArea(
        child: Column(
          children: [
            _header(context),
            Expanded(child: _scrollBody(context)),
            _actions(context),
          ],
        ),
      ),
    );
  }

  Widget _header(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return ListTile(
      title: Text(title,
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
      subtitle: Text(subtitle),
      trailing: IconButton(
        tooltip: copy.text('close'),
        onPressed: busy ? null : () => Navigator.pop(context, false),
        icon: const Icon(Icons.close),
      ),
    );
  }

  Widget _scrollBody(BuildContext context) {
    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.md,
        AppSpacing.xs,
        AppSpacing.md,
        MediaQuery.viewInsetsOf(context).bottom + AppSpacing.md,
      ),
      child: child,
    );
  }

  Widget _actions(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: AppColors.ink100)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            key: submitKey,
            onPressed: busy ? null : onSubmit,
            child: busy ? _progress() : Text(submitLabel),
          ),
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
}

void _showError(BuildContext context, String message) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
}

void _recordValidationFailure(MobileAnalytics analytics, String flow) {
  analytics.record(
    MobileFunnelEvent.validationFailed,
    attributes: {'flow': flow, 'validation_count': 1},
  );
}
