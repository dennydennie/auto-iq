import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/i18n/app_localizations.dart';
import '../../core/network/api_exception.dart';
import '../../repositories/auth_repository.dart';
import '../../state/session_controller.dart';

class PasskeyOffer extends StatefulWidget {
  const PasskeyOffer({super.key, required this.accountId, required this.child});
  final String accountId;
  final Widget child;
  @override
  State<PasskeyOffer> createState() => _PasskeyOfferState();
}

class _PasskeyOfferState extends State<PasskeyOffer> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _offer());
  }

  Future<void> _offer() async {
    if (!context.read<SessionController>().takePasskeyOffer()) return;
    try {
      final store = SharedPreferencesAsync();
      final key = 'auto-iq.passkey.declined.${widget.accountId}';
      final repository = context.read<AuthRepository>().passkeys;
      if (await store.getBool(key) == true || !await repository.supported()) {
        return;
      }
      if ((await repository.list()).isNotEmpty || !mounted) return;
      if (!await _ask()) {
        await store.setBool(key, true);
        return;
      }
      final created = await repository.create();
      if (created && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content:
                Text(AutoIqLocalizations.of(context).text('passkeyCreated'))));
      }
    } on ApiException catch (error) {
      if (mounted) _report(error);
    }
  }

  Future<bool> _ask() async {
    final copy = AutoIqLocalizations.of(context);
    return await showModalBottomSheet<bool>(
            context: context,
            builder: (context) => SafeArea(
                  child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(copy.text('passkeyOffer'),
                                style:
                                    Theme.of(context).textTheme.headlineSmall),
                            const SizedBox(height: 12),
                            Text(copy.text('passkeyDescription')),
                            const SizedBox(height: 24),
                            FilledButton(
                                onPressed: () => Navigator.pop(context, true),
                                child: Text(copy.text('createPasskey'))),
                            TextButton(
                                onPressed: () => Navigator.pop(context, false),
                                child: Text(copy.text('notNow'))),
                          ])),
                )) ??
        false;
  }

  void _report(ApiException error) {
    final message = error.message.isEmpty
        ? AutoIqLocalizations.of(context).text('passkeyFailed')
        : error.message;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
