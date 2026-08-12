import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/i18n/app_localizations.dart';
import '../core/network/api_exception.dart';
import '../state/session_controller.dart';
import 'section_card.dart';

class AccountDeletionCard extends StatelessWidget {
  const AccountDeletionCard({super.key});

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    final session = context.watch<SessionController>();
    return SectionCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            copy.deleteAccount,
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(copy.deleteAccountDescription),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: session.isBusy ? null : () => _confirm(context),
            icon: const Icon(Icons.delete_outline),
            label: Text(copy.requestAccountDeletion),
            style:
                OutlinedButton.styleFrom(foregroundColor: Colors.red.shade700),
          ),
        ],
      ),
    );
  }

  Future<void> _confirm(BuildContext context) async {
    final copy = AutoIqLocalizations.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(copy.deleteAccount),
        content: Text(copy.deleteAccountConfirmation),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: Text(copy.cancel),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red.shade700),
            child: Text(copy.requestAccountDeletion),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;
    await _request(context);
  }

  Future<void> _request(BuildContext context) async {
    try {
      await context.read<SessionController>().requestAccountDeletion();
    } on ApiException catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.message)),
      );
    }
  }
}
