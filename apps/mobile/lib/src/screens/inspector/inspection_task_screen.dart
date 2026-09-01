import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../../theme/app_colors.dart';
import '../../../theme/app_tokens.dart';
import '../../core/files/local_upload.dart';
import '../../core/i18n/app_localizations.dart';
import '../../core/network/api_exception.dart';
import '../../core/observability/mobile_analytics.dart';
import '../../models/inspector_models.dart';
import '../../repositories/inspector_repository.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/async_state_view.dart';
import '../../widgets/section_card.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/vehicle_image.dart';

class InspectionTaskScreen extends StatefulWidget {
  const InspectionTaskScreen({super.key, required this.taskId});

  final String taskId;

  @override
  State<InspectionTaskScreen> createState() => _InspectionTaskScreenState();
}

class _InspectionTaskScreenState extends State<InspectionTaskScreen> {
  late Future<InspectionTaskDetail> _future;

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(copy.inspectionReport)),
      body: FutureBuilder<InspectionTaskDetail>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return AppLoadingView(label: copy.text('loadingInspection'));
          }
          if (snapshot.hasError) return _error(context);
          return _TaskBody(detail: snapshot.data!, onSubmitted: _refresh);
        },
      ),
    );
  }

  Future<InspectionTaskDetail> _load() {
    return context.read<InspectorRepository>().detail(widget.taskId);
  }

  Future<void> _refresh() async {
    setState(() => _future = _load());
    await _future;
  }

  Widget _error(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return EmptyState(
      title: copy.inspectionsUnavailable,
      message: copy.catalogueUnavailableMessage,
      action: ElevatedButton(onPressed: _refresh, child: Text(copy.retry)),
    );
  }
}

class _TaskBody extends StatelessWidget {
  const _TaskBody({required this.detail, required this.onSubmitted});

  final InspectionTaskDetail detail;
  final Future<void> Function() onSubmitted;

  @override
  Widget build(BuildContext context) {
    final task = detail.task;
    return LayoutBuilder(
      builder: (context, constraints) => Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 760),
          child: ListView(
            padding: adaptivePageInsets(constraints.maxWidth),
            children: [
              SectionCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    VehicleImageView(
                      imageUrl: task.listing.coverImageUrl,
                      height: 190,
                      semanticLabel: task.listing.title,
                    ),
                    const SizedBox(height: 12),
                    StatusChip(label: task.status),
                    const SizedBox(height: 10),
                    Text(
                      task.listing.title,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 4),
                    Text(task.listing.city),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              if (detail.report != null)
                _SubmittedReport(report: detail.report!)
              else if (task.canSubmitReport)
                InspectionReportForm(taskId: task.id, onSubmitted: onSubmitted)
              else
                const EmptyState(
                  title: 'Report unavailable',
                  message:
                      'This task is not currently open for report capture.',
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class InspectionReportForm extends StatefulWidget {
  const InspectionReportForm({
    super.key,
    required this.taskId,
    required this.onSubmitted,
  });

  final String taskId;
  final Future<void> Function() onSubmitted;

  @override
  State<InspectionReportForm> createState() => _InspectionReportFormState();
}

class _InspectionReportFormState extends State<InspectionReportForm> {
  final _summaryController = TextEditingController();
  var _findings = List<InspectionFindingDraft>.of(requiredInspectionFindings);
  var _roadworthy = true;
  var _submitting = false;
  var _dirty = false;
  int? _uploadingIndex;

  @override
  void dispose() {
    _summaryController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return PopScope(
      canPop: !_dirty,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _confirmDiscard();
      },
      child: SectionCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _Score(value: inspectionScore(_findings)),
            const SizedBox(height: 16),
            ...List.generate(
              _findings.length,
              (index) => _FindingEditor(
                finding: _findings[index],
                uploading: _uploadingIndex == index,
                onChanged: (finding) => _updateFinding(index, finding),
                onPhoto: () => _pickPhoto(index),
              ),
            ),
            TextField(
              key: const Key('inspector-summary'),
              controller: _summaryController,
              minLines: 3,
              maxLines: 6,
              maxLength: 4000,
              decoration: InputDecoration(labelText: copy.inspectorSummary),
              onChanged: (_) => setState(() => _dirty = true),
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(copy.roadworthy),
              value: _roadworthy,
              onChanged: (value) => setState(() {
                _roadworthy = value;
                _dirty = true;
              }),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                key: const Key('submit-inspection-report'),
                onPressed: _canSubmit ? _submit : null,
                child: _submitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(copy.submitInspectionReport),
              ),
            ),
          ],
        ),
      ),
    );
  }

  bool get _canSubmit {
    return !_submitting &&
        _uploadingIndex == null &&
        _summaryController.text.trim().isNotEmpty &&
        inspectionDraftIsComplete(_findings);
  }

  void _updateFinding(int index, InspectionFindingDraft finding) {
    setState(() {
      _dirty = true;
      _findings = [
        ..._findings.take(index),
        finding,
        ..._findings.skip(index + 1),
      ];
    });
  }

  Future<void> _pickPhoto(int index) async {
    final source = await _chooseSource();
    if (source == null) return;
    final file =
        await ImagePicker().pickImage(source: source, imageQuality: 85);
    if (file == null || !mounted) return;
    await _uploadPhoto(index, file);
  }

  Future<ImageSource?> _chooseSource() {
    return showModalBottomSheet<ImageSource>(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(children: [
          ListTile(
            leading: const Icon(Icons.camera_alt_outlined),
            title: const Text('Camera'),
            onTap: () => Navigator.pop(context, ImageSource.camera),
          ),
          ListTile(
            leading: const Icon(Icons.photo_library_outlined),
            title: const Text('Photo library'),
            onTap: () => Navigator.pop(context, ImageSource.gallery),
          ),
        ]),
      ),
    );
  }

  Future<void> _uploadPhoto(int index, XFile file) async {
    setState(() => _uploadingIndex = index);
    final repository = context.read<InspectorRepository>();
    try {
      final upload = await _toUpload(file);
      final storageKey = await repository.uploadFindingPhoto(
        taskId: widget.taskId,
        file: upload,
      );
      _updateFinding(
        index,
        _findings[index].copyWith(
          photoStorageKey: storageKey,
          photoName: file.name,
        ),
      );
    } on ApiException catch (error) {
      _show(error.message);
    } finally {
      if (mounted) setState(() => _uploadingIndex = null);
    }
  }

  Future<LocalUpload> _toUpload(XFile file) async {
    final upload = await LocalUpload.fromXFile(file);
    if (upload == null || !upload.fileType.isImage) {
      throw ApiException(
          message: 'Use a JPEG, PNG, or WebP image.', statusCode: 400);
    }
    if (upload.length > 10 * 1024 * 1024) {
      throw ApiException(
          message: 'Evidence photos must be 10 MB or smaller.',
          statusCode: 400);
    }
    return upload;
  }

  Future<void> _submit() async {
    final confirmed = await _confirmSubmit();
    if (!confirmed || !mounted) return;
    final analytics = context.read<MobileAnalytics>();
    setState(() => _submitting = true);
    try {
      await context.read<InspectorRepository>().submitReport(
            taskId: widget.taskId,
            findings: _findings,
            inspectorNote: _summaryController.text,
            roadworthy: _roadworthy,
          );
      analytics.record(
        MobileFunnelEvent.inspectionSubmitted,
        attributes: {'finding_count': _findings.length},
      );
      if (mounted) _show(AutoIqLocalizations.of(context).reportSubmitted);
      _dirty = false;
      await widget.onSubmitted();
    } on ApiException catch (error) {
      _show(error.message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<bool> _confirmSubmit() async {
    final copy = AutoIqLocalizations.of(context);
    return await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: Text(copy.confirmReportTitle),
            content: Text(copy.confirmReportMessage),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: Text(copy.cancel),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(context, true),
                child: Text(copy.confirmSubmit),
              ),
            ],
          ),
        ) ??
        false;
  }

  Future<void> _confirmDiscard() async {
    final copy = AutoIqLocalizations.of(context);
    final discard = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(copy.discardReportTitle),
        content: Text(copy.discardReportMessage),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(copy.cancel),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(copy.discardChanges),
          ),
        ],
      ),
    );
    if (discard == true && mounted) {
      setState(() => _dirty = false);
      Navigator.of(context).pop();
    }
  }

  void _show(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }
}

class _Score extends StatelessWidget {
  const _Score({required this.value});

  final int? value;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    final score = value;
    return Semantics(
      label: score == null
          ? '${copy.computedScore}. ${copy.scoreIncomplete}'
          : '${copy.computedScore}: $score out of 100',
      excludeSemantics: true,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(copy.computedScore,
                    style: Theme.of(context).textTheme.titleMedium),
                if (score == null)
                  Text(copy.scoreIncomplete,
                      style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          Text(
            score == null ? '—' : '$score/100',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
        ],
      ),
    );
  }
}

class _FindingEditor extends StatelessWidget {
  const _FindingEditor({
    required this.finding,
    required this.uploading,
    required this.onChanged,
    required this.onPhoto,
  });

  final InspectionFindingDraft finding;
  final bool uploading;
  final ValueChanged<InspectionFindingDraft> onChanged;
  final VoidCallback onPhoto;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Semantics(
        container: true,
        label: finding.label,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(finding.label, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            SegmentedButton<String>(
              key: Key('finding-rating-${finding.category}'),
              segments: _ratings
                  .map((value) => ButtonSegment(
                        value: value,
                        label: Text(_ratingLabel(copy, value)),
                      ))
                  .toList(growable: false),
              selected: finding.rating == null ? {} : {finding.rating!},
              emptySelectionAllowed: true,
              onSelectionChanged: (values) {
                if (values.isNotEmpty) {
                  onChanged(finding.copyWith(rating: values.single));
                }
              },
            ),
            const SizedBox(height: 8),
            TextFormField(
              initialValue: finding.note,
              maxLength: 2000,
              minLines: 2,
              maxLines: 4,
              decoration: InputDecoration(labelText: copy.observationNote),
              onChanged: (value) => onChanged(finding.copyWith(note: value)),
            ),
            if (!finding.isRated)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                child: Text(
                  copy.findingUnrated,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              )
            else if (finding.validationMessage != null)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                child: Text(
                  finding.validationMessage!,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.error,
                    fontSize: 12,
                  ),
                ),
              ),
            OutlinedButton.icon(
              onPressed: uploading ? null : onPhoto,
              icon: Icon(
                  uploading ? Icons.hourglass_top : Icons.camera_alt_outlined),
              label: Text(
                uploading ? copy.uploadingEvidence : copy.addEvidencePhoto,
              ),
            ),
            if (finding.photoName != null)
              Text(
                finding.photoName!,
                style: const TextStyle(color: AppColors.verified),
              ),
          ],
        ),
      ),
    );
  }
}

class _SubmittedReport extends StatelessWidget {
  const _SubmittedReport({required this.report});

  final InspectionReport report;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Score(value: report.overallScore),
          const SizedBox(height: 8),
          Text(report.roadworthy ? copy.roadworthy : copy.notRoadworthy),
          const SizedBox(height: 8),
          StatusChip(
            label: report.buyerSummaryApproved
                ? copy.summaryApproved
                : copy.awaitingAdminReview,
          ),
          const SizedBox(height: 12),
          Text(report.inspectorNote),
          const SizedBox(height: 16),
          ...report.findings.map(
            (finding) => ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(finding.label),
              subtitle: Text(finding.note ?? copy.observationNote),
              trailing: StatusChip(label: finding.rating),
            ),
          ),
        ],
      ),
    );
  }
}

const _ratings = ['PASS', 'WATCH', 'FAIL'];

String _ratingLabel(AutoIqLocalizations copy, String value) {
  if (value == 'PASS') return copy.pass;
  if (value == 'WATCH') return copy.watch;
  return copy.fail;
}
