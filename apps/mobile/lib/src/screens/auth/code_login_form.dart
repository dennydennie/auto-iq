import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/i18n/app_localizations.dart';
import '../../core/network/api_exception.dart';
import '../../repositories/auth_repository.dart';
import '../../state/session_controller.dart';
import 'otp_verification_screen.dart';

class CodeLoginForm extends StatefulWidget {
  const CodeLoginForm({super.key, required this.onPassword});
  final VoidCallback onPassword;
  @override
  State<CodeLoginForm> createState() => _CodeLoginState();
}

class _CodeLoginState extends State<CodeLoginForm> {
  final _form = GlobalKey<FormState>();
  final _identifier = TextEditingController();
  String _channel = 'SMS';
  bool _busy = false;
  bool _passkeysReady = false;
  AutoIqLocalizations get _copy => AutoIqLocalizations.of(context);
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _availability());
  }

  @override
  void dispose() {
    _identifier.dispose();
    super.dispose();
  }

  Future<void> _availability() async {
    final ready = await context.read<AuthRepository>().passkeys.supported();
    if (mounted) setState(() => _passkeysReady = ready);
  }

  String _value() {
    final value = _identifier.text.trim();
    if (_channel == 'EMAIL') return value.toLowerCase();
    final digits = value.replaceAll(RegExp(r'\D'), '');
    if (value.startsWith('+') || digits.startsWith('263')) return '+$digits';
    return '+263${digits.replaceFirst(RegExp(r'^0'), '')}';
  }

  Future<void> _send() async {
    if (_form.currentState?.validate() != true) return;
    setState(() => _busy = true);
    try {
      await context.read<AuthRepository>().requestLoginCode(_value(), _channel);
      if (!mounted) return;
      await Navigator.of(context).push(MaterialPageRoute<void>(
          builder: (_) => OtpVerificationScreen(
              identifier: _value(),
              autoSend: false,
              login: true,
              channel: _channel)));
    } on ApiException catch (error) {
      _error(error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _passkey() async {
    setState(() => _busy = true);
    try {
      final session = context.read<SessionController>();
      if (await context.read<AuthRepository>().passkeys.signIn()) {
        await session.refreshProfile();
      }
    } on ApiException catch (error) {
      _error(
          error.message.isEmpty ? _copy.text('passkeyFailed') : error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _error(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(message)));
    }
  }

  @override
  Widget build(BuildContext context) => Form(
      key: _form,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(_copy.text('codeLoginDescription')),
          const SizedBox(height: 16),
          SegmentedButton<String>(
              segments: [
                ButtonSegment(
                    value: 'SMS', label: Text(_copy.text('smsChannel'))),
                ButtonSegment(
                    value: 'EMAIL', label: Text(_copy.text('emailChannel'))),
              ],
              selected: {
                _channel
              },
              onSelectionChanged: _busy
                  ? null
                  : (value) => setState(() {
                        _channel = value.first;
                        _identifier.clear();
                      })),
          const SizedBox(height: 16),
          TextFormField(
              controller: _identifier,
              enabled: !_busy,
              keyboardType: _channel == 'SMS'
                  ? TextInputType.phone
                  : TextInputType.emailAddress,
              autofillHints: const [AutofillHints.username],
              autocorrect: false,
              decoration: InputDecoration(
                  labelText:
                      _copy.text(_channel == 'SMS' ? 'phoneNumber' : 'email')),
              validator: (value) => value?.trim().isNotEmpty == true
                  ? null
                  : _copy.text('required'),
              onFieldSubmitted: (_) {
                if (!_busy) _send();
              }),
          const SizedBox(height: 20),
          FilledButton(
              onPressed: _busy ? null : _send,
              child: _busy
                  ? const SizedBox.square(
                      dimension: 18,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : Text(_copy.text('sendSignInCode'))),
          if (_passkeysReady) ...[
            const SizedBox(height: 12),
            OutlinedButton.icon(
                onPressed: _busy ? null : _passkey,
                icon: const Icon(Icons.key_outlined),
                label: Text(_copy.text('signInWithPasskey')))
          ],
          TextButton(
              onPressed: _busy ? null : widget.onPassword,
              child: Text(_copy.text('signInWithPassword'))),
        ],
      ));
}
