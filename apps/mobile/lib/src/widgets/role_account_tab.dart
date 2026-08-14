import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/i18n/app_localizations.dart';
import '../core/network/api_exception.dart';
import '../models/app_user.dart';
import '../state/session_controller.dart';
import 'account_deletion_card.dart';
import 'section_card.dart';

class RoleAccountTab extends StatefulWidget {
  const RoleAccountTab({
    super.key,
    required this.user,
    this.includeBusinessName = false,
  });

  final AppUser user;
  final bool includeBusinessName;

  @override
  State<RoleAccountTab> createState() => _RoleAccountTabState();
}

class _RoleAccountTabState extends State<RoleAccountTab> {
  late final TextEditingController _nameController;
  late final TextEditingController _cityController;
  late final TextEditingController _businessController;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.user.fullName);
    _cityController = TextEditingController(text: widget.user.city);
    _businessController = TextEditingController(
      text: widget.user.sellerProfile?.businessName ?? '',
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _cityController.dispose();
    _businessController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    final session = context.watch<SessionController>();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _ContactStatus(user: widget.user),
              const SizedBox(height: 16),
              TextField(
                controller: _nameController,
                decoration: InputDecoration(labelText: copy.fullName),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _cityController,
                decoration: InputDecoration(labelText: copy.city),
              ),
              if (widget.includeBusinessName) ...[
                const SizedBox(height: 12),
                TextField(
                  controller: _businessController,
                  decoration: InputDecoration(labelText: copy.businessName),
                ),
              ],
              const SizedBox(height: 16),
              _Actions(
                busy: session.isBusy,
                onSave: () => _save(context, session),
                onLogout: session.logout,
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const AccountDeletionCard(),
      ],
    );
  }

  Future<void> _save(
    BuildContext context,
    SessionController session,
  ) async {
    final error = _validationError(context);
    if (error != null) return _show(context, error);
    try {
      await session.updateProfile(_payload());
      if (context.mounted) {
        _show(context, AutoIqLocalizations.of(context).profileUpdated);
      }
    } on ApiException catch (error) {
      if (context.mounted) _show(context, error.message);
    }
  }

  String? _validationError(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    if (_nameController.text.trim().isEmpty) return copy.fullNameRequired;
    if (_cityController.text.trim().isEmpty) return copy.cityRequired;
    return null;
  }

  Map<String, dynamic> _payload() => {
        'fullName': _nameController.text.trim(),
        'city': _cityController.text.trim(),
        if (widget.includeBusinessName)
          'businessName': _businessController.text.trim().isEmpty
              ? null
              : _businessController.text.trim(),
      };

  void _show(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }
}

class _ContactStatus extends StatelessWidget {
  const _ContactStatus({required this.user});

  final AppUser user;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Column(
      children: [
        _StatusRow(
          icon: Icons.email_outlined,
          value: user.email,
          verified: user.emailVerified,
          verifiedLabel: copy.verifiedStatus,
          pendingLabel: copy.notVerifiedStatus,
        ),
        const SizedBox(height: 10),
        _StatusRow(
          icon: Icons.phone_outlined,
          value: user.phone,
          verified: user.phoneVerified,
          verifiedLabel: copy.verifiedStatus,
          pendingLabel: copy.notVerifiedStatus,
        ),
      ],
    );
  }
}

class _StatusRow extends StatelessWidget {
  const _StatusRow({
    required this.icon,
    required this.value,
    required this.verified,
    required this.verifiedLabel,
    required this.pendingLabel,
  });

  final IconData icon;
  final String value;
  final bool verified;
  final String verifiedLabel;
  final String pendingLabel;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 20),
        const SizedBox(width: 10),
        Expanded(child: Text(value)),
        Text(verified ? verifiedLabel : pendingLabel),
      ],
    );
  }
}

class _Actions extends StatelessWidget {
  const _Actions({
    required this.busy,
    required this.onSave,
    required this.onLogout,
  });

  final bool busy;
  final VoidCallback onSave;
  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Row(
      children: [
        Expanded(
          child: ElevatedButton(
            onPressed: busy ? null : onSave,
            child: Text(copy.saveProfile),
          ),
        ),
        const SizedBox(width: 12),
        OutlinedButton(
          onPressed: busy ? null : onLogout,
          child: Text(copy.logout),
        ),
      ],
    );
  }
}
