import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/i18n/app_localizations.dart';
import '../../core/network/api_exception.dart';
import '../../repositories/auth_repository.dart';
import '../../state/session_controller.dart';

class PasskeySettingsScreen extends StatefulWidget {
  const PasskeySettingsScreen({super.key});
  @override
  State<PasskeySettingsScreen> createState() => _PasskeySettingsState();
}

class _PasskeySettingsState extends State<PasskeySettingsScreen> {
  final _label = TextEditingController();
  List<Map<String, dynamic>>? _items;
  bool _busy = false;
  bool _supported = false;
  String? _error;
  bool _reauthenticate = false;
  AutoIqLocalizations get _copy => AutoIqLocalizations.of(context);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _label.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final repository = context.read<AuthRepository>().passkeys;
      final supported = await repository.supported();
      final items = await repository.list();
      if (mounted) {
        setState(() {
          _items = items;
          _supported = supported;
          _error = null;
        });
      }
    } on ApiException catch (error) {
      _showError(error);
    }
  }

  Future<void> _create() async {
    setState(() => _busy = true);
    try {
      final created = await context
          .read<AuthRepository>()
          .passkeys
          .create(label: _label.text.trim());
      if (!mounted || !created) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(_copy.text('passkeyCreated'))));
      await _load();
    } on ApiException catch (error) {
      _showError(error);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _remove(String id) async {
    setState(() => _busy = true);
    try {
      await context.read<AuthRepository>().passkeys.remove(id);
      await _load();
    } on ApiException catch (error) {
      _showError(error);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _showError(ApiException error) {
    if (mounted) {
      setState(() {
        _error =
            error.message.isEmpty ? _copy.text('passkeyFailed') : error.message;
        _reauthenticate = error.code == 'PASSKEY_REAUTHENTICATION_REQUIRED';
      });
    }
  }

  Future<void> _signInAgain() async {
    await context.read<SessionController>().logout();
    if (mounted) Navigator.of(context).popUntil((route) => route.isFirst);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(_copy.text('passkeys'))),
        body: ListView(padding: const EdgeInsets.all(20), children: [
          Text(_copy.text('passkeyDescription')),
          const SizedBox(height: 20),
          if (_error != null) ...[
            Text(_error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error)),
            TextButton(
                onPressed: _busy ? null : _load, child: Text(_copy.retry)),
            if (_reauthenticate)
              TextButton(
                  onPressed: _signInAgain,
                  child: Text(_copy.text('signInWithCode')))
          ],
          if (_items == null && _error == null)
            const Center(child: CircularProgressIndicator()),
          if (_items?.isEmpty == true) Text(_copy.text('noPasskeys')),
          for (final item in _items ?? <Map<String, dynamic>>[])
            ListTile(
                title: Text(item['label']?.toString() ??
                    _copy.text('defaultPasskeyLabel')),
                trailing: TextButton(
                    onPressed:
                        _busy ? null : () => _remove(item['id'].toString()),
                    child: Text(_copy.text('removePasskey')))),
          if (_supported) ...[
            const SizedBox(height: 20),
            TextField(
                controller: _label,
                maxLength: 80,
                decoration:
                    InputDecoration(labelText: _copy.text('passkeyName'))),
            FilledButton(
                onPressed:
                    _busy || (_items?.length ?? 0) >= 10 ? null : _create,
                child: Text(_copy.text('createPasskey')))
          ],
        ]),
      );
}

class PasskeyAccountAction extends StatelessWidget {
  const PasskeyAccountAction({super.key});
  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return ListTile(
        leading: const Icon(Icons.key_outlined),
        title: Text(copy.text('passkeys')),
        subtitle: Text(copy.text('passkeyDescription')),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(
            builder: (_) => const PasskeySettingsScreen())));
  }
}
