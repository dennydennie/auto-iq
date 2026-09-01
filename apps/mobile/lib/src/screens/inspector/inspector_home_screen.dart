import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../theme/app_colors.dart';
import '../../core/i18n/app_formatters.dart';
import '../../core/i18n/app_localizations.dart';
import '../../models/inspector_models.dart';
import '../../repositories/inspector_repository.dart';
import '../../state/session_controller.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/role_account_tab.dart';
import '../../widgets/section_card.dart';
import '../../widgets/status_chip.dart';
import '../../widgets/vehicle_image.dart';
import 'inspection_task_screen.dart';

class InspectorHomeScreen extends StatefulWidget {
  const InspectorHomeScreen({super.key, this.onSwitchWorkspace});

  final VoidCallback? onSwitchWorkspace;

  @override
  State<InspectorHomeScreen> createState() => _InspectorHomeScreenState();
}

class _InspectorHomeScreenState extends State<InspectorHomeScreen> {
  int _tabIndex = 0;
  String? _status;
  late Future<List<InspectionTask>> _tasksFuture;

  @override
  void initState() {
    super.initState();
    _tasksFuture = _loadTasks();
  }

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    final user = context.watch<SessionController>().user!;
    final body = IndexedStack(
      index: _tabIndex,
      children: [
        _TasksTab(
          future: _tasksFuture,
          status: _status,
          onStatusChanged: _changeStatus,
          onRefresh: _refresh,
          onOpenTask: _openTask,
        ),
        RoleAccountTab(user: user),
      ],
    );
    return Scaffold(
      appBar: AppBar(
        title:
            Text('${copy.inspectorWorkspace} · ${_firstName(user.fullName)}'),
        actions: _workspaceActions(copy),
      ),
      body: body,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tabIndex,
        onDestinationSelected: (index) => setState(() => _tabIndex = index),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.assignment_outlined),
            selectedIcon: const Icon(Icons.assignment),
            label: copy.tasks,
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

  List<Widget>? _workspaceActions(AutoIqLocalizations copy) {
    if (widget.onSwitchWorkspace == null) return null;
    return [
      IconButton(
        tooltip: copy.switchWorkspace,
        onPressed: widget.onSwitchWorkspace,
        icon: const Icon(Icons.swap_horiz),
      ),
    ];
  }

  Future<List<InspectionTask>> _loadTasks() {
    return context.read<InspectorRepository>().tasks(status: _status);
  }

  Future<void> _refresh() async {
    setState(() {
      _tasksFuture = _loadTasks();
    });
    await _tasksFuture;
  }

  void _changeStatus(String? status) {
    setState(() {
      _status = status;
      _tasksFuture = _loadTasks();
    });
  }

  Future<void> _openTask(String taskId) async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => InspectionTaskScreen(taskId: taskId),
      ),
    );
    if (mounted) await _refresh();
  }
}

class _TasksTab extends StatelessWidget {
  const _TasksTab({
    required this.future,
    required this.status,
    required this.onStatusChanged,
    required this.onRefresh,
    required this.onOpenTask,
  });

  final Future<List<InspectionTask>> future;
  final String? status;
  final ValueChanged<String?> onStatusChanged;
  final Future<void> Function() onRefresh;
  final ValueChanged<String> onOpenTask;

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<InspectionTask>>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snapshot.hasError) return _error(context);
        return _content(context, snapshot.data ?? const []);
      },
    );
  }

  Widget _error(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return EmptyState(
      title: copy.inspectionsUnavailable,
      message: copy.catalogueUnavailableMessage,
      action: ElevatedButton(onPressed: onRefresh, child: Text(copy.retry)),
    );
  }

  Widget _content(BuildContext context, List<InspectionTask> tasks) {
    final copy = AutoIqLocalizations.of(context);
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            copy.assignedInspections,
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 12),
          _StatusFilter(value: status, onChanged: onStatusChanged),
          const SizedBox(height: 16),
          if (tasks.isEmpty)
            EmptyState(
              title: copy.noInspectionTasks,
              message: copy.noInspectionTasksMessage,
            )
          else
            ...tasks.map((task) => _TaskCard(task: task, onOpen: onOpenTask)),
        ],
      ),
    );
  }
}

class _StatusFilter extends StatelessWidget {
  const _StatusFilter({required this.value, required this.onChanged});

  final String? value;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return DropdownButtonFormField<String?>(
      key: const Key('inspection-status-filter'),
      initialValue: value,
      decoration: InputDecoration(labelText: copy.tasks),
      items: [
        DropdownMenuItem(value: null, child: Text(copy.allStatuses)),
        ..._inspectionStatuses.map(
          (status) => DropdownMenuItem(
            value: status,
            child: Text(_enumLabel(status)),
          ),
        ),
      ],
      onChanged: onChanged,
    );
  }
}

class _TaskCard extends StatelessWidget {
  const _TaskCard({required this.task, required this.onOpen});

  final InspectionTask task;
  final ValueChanged<String> onOpen;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: SectionCard(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            VehicleImageView(
              imageUrl: task.listing.coverImageUrl,
              height: 150,
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                StatusChip(label: task.status),
                const Spacer(),
                Text(_schedule(context, copy)),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              task.listing.title,
              style: const TextStyle(
                color: AppColors.ink900,
                fontSize: 17,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 4),
            Text(task.listing.city),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () => onOpen(task.id),
              child: Text(copy.openTask),
            ),
          ],
        ),
      ),
    );
  }

  String _schedule(BuildContext context, AutoIqLocalizations copy) {
    final value = DateTime.tryParse(task.scheduledAt ?? '');
    return value == null
        ? copy.notScheduled
        : AppFormatters.dateTime(context, value.toLocal());
  }
}

const _inspectionStatuses = [
  'SCHEDULED',
  'IN_PROGRESS',
  'REPORT_SUBMITTED',
  'BUYER_SUMMARY_APPROVED',
];

String _enumLabel(String value) {
  return value
      .toLowerCase()
      .split('_')
      .map((part) => '${part[0].toUpperCase()}${part.substring(1)}')
      .join(' ');
}

String _firstName(String fullName) {
  final parts = fullName.trim().split(RegExp(r'\s+'));
  return parts.isEmpty ? fullName : parts.first;
}
