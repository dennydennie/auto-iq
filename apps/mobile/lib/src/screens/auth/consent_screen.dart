import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../theme/app_tokens.dart';
import '../../../widgets/bisell_logo.dart';
import '../../core/consent/consent_policy.dart';
import '../../core/i18n/app_localizations.dart';
import '../../core/network/api_exception.dart';
import '../../models/app_user.dart';
import '../../state/session_controller.dart';
import '../../widgets/adaptive_content.dart';
import '../../widgets/section_card.dart';

class ConsentScreen extends StatefulWidget {
  const ConsentScreen({super.key, required this.user});

  final AppUser user;

  @override
  State<ConsentScreen> createState() => _ConsentScreenState();
}

class _ConsentScreenState extends State<ConsentScreen> {
  late final List<String> _required;
  late Set<String> _accepted;
  ApiException? _error;

  @override
  void initState() {
    super.initState();
    _required = requiredConsentsForRoles(widget.user.roles);
    _accepted = widget.user.acceptedConsents.toSet();
  }

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    final session = context.watch<SessionController>();
    return Scaffold(
      body: SafeArea(
        child: AdaptiveContent(
          maxWidth: AppBreakpoints.formMaxWidth,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const BiSellLogo(size: 36),
                const SizedBox(height: AppSpacing.lg),
                Text(
                  copy.agreementsTitle,
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: AppSpacing.xs),
                Text(copy.agreementsDescription),
                const SizedBox(height: AppSpacing.lg),
                if (_error != null) _ConsentError(error: _error!),
                SectionCard(child: _agreementList(copy)),
                const SizedBox(height: AppSpacing.md),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    key: const Key('accept-consents'),
                    onPressed: _canSubmit(session) ? _submit : null,
                    child: Text(
                      session.isBusy
                          ? copy.savingAgreements
                          : copy.acceptAndContinue,
                    ),
                  ),
                ),
                Center(
                  child: TextButton(
                    onPressed: session.isBusy ? null : session.logout,
                    child: Text(copy.logout),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _agreementList(AutoIqLocalizations copy) {
    return Column(
      children: _required
          .map((type) => _AgreementTile(
                type: type,
                label: copy.consentLabel(type),
                accepted: _accepted.contains(type),
                onChanged: (value) => _toggle(type, value),
                onReview: () => _review(type),
              ))
          .toList(growable: false),
    );
  }

  bool _canSubmit(SessionController session) {
    return !session.isBusy && _required.every(_accepted.contains);
  }

  void _toggle(String type, bool value) {
    setState(() {
      _error = null;
      value ? _accepted.add(type) : _accepted.remove(type);
    });
  }

  Future<void> _submit() async {
    try {
      await context
          .read<SessionController>()
          .completeRequiredConsents(_accepted);
    } on ApiException catch (error) {
      if (mounted) setState(() => _error = error);
    }
  }

  Future<void> _review(String type) {
    final copy = AutoIqLocalizations.of(context);
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) => SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(copy.consentLabel(type),
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: AppSpacing.sm),
              Text(copy.agreementVersion),
              const SizedBox(height: AppSpacing.md),
              Text(copy.consentReviewNotice),
              const SizedBox(height: AppSpacing.lg),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text(copy.closeFilters),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AgreementTile extends StatelessWidget {
  const _AgreementTile({
    required this.type,
    required this.label,
    required this.accepted,
    required this.onChanged,
    required this.onReview,
  });

  final String type;
  final String label;
  final bool accepted;
  final ValueChanged<bool> onChanged;
  final VoidCallback onReview;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Column(
      children: [
        CheckboxListTile(
          key: Key('consent-$type'),
          value: accepted,
          onChanged: (value) => onChanged(value ?? false),
          controlAffinity: ListTileControlAffinity.leading,
          contentPadding: EdgeInsets.zero,
          title: Text(label),
        ),
        Align(
          alignment: AlignmentDirectional.centerEnd,
          child: TextButton(
            key: Key('review-$type'),
            onPressed: onReview,
            child: Text(copy.reviewAgreement),
          ),
        ),
        const Divider(),
      ],
    );
  }
}

class _ConsentError extends StatelessWidget {
  const _ConsentError({required this.error});

  final ApiException error;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Semantics(
        liveRegion: true,
        child: Text(
          error.supportMessage,
          style: TextStyle(color: Theme.of(context).colorScheme.error),
        ),
      ),
    );
  }
}
