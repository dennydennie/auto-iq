import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../theme/app_colors.dart';
import '../../core/network/api_exception.dart';
import '../../repositories/auth_repository.dart';

String extractResetToken(String value) {
  final text = value.trim();
  final uri = Uri.tryParse(text);
  final hash = uri?.fragment ?? '';
  final hashToken = Uri.splitQueryString(hash)['token'];
  final queryToken = uri?.queryParameters['token'];
  return _safeDecode(hashToken ?? queryToken ?? text);
}

String _safeDecode(String value) {
  try {
    return Uri.decodeComponent(value);
  } on ArgumentError {
    return value;
  }
}

class PasswordResetScreen extends StatefulWidget {
  const PasswordResetScreen({super.key});

  @override
  State<PasswordResetScreen> createState() => _PasswordResetScreenState();
}

class _PasswordResetScreenState extends State<PasswordResetScreen> {
  final _emailKey = GlobalKey<FormState>();
  final _resetKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _tokenController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _busy = false;
  bool _sent = false;
  bool _reset = false;
  bool _showPassword = false;

  @override
  void dispose() {
    _emailController.dispose();
    _tokenController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reset password')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const Text(
              'Recover your Auto IQ account',
              style: TextStyle(
                color: AppColors.ink900,
                fontSize: 26,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Send a reset link to your account email, then paste the link or token here to set a fresh password.',
              style: TextStyle(color: AppColors.ink500, height: 1.5),
            ),
            const SizedBox(height: 24),
            _buildRequestCard(),
            const SizedBox(height: 16),
            _buildResetCard(),
          ],
        ),
      ),
    );
  }

  Widget _buildRequestCard() {
    return _ResetCard(
      title: 'Request reset link',
      child: Form(
        key: _emailKey,
        child: Column(
          children: [
            TextFormField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              autofillHints: const [AutofillHints.email],
              decoration: const InputDecoration(labelText: 'Account email'),
              validator: _emailValidator,
            ),
            const SizedBox(height: 12),
            if (_sent)
              const _SuccessText(
                'Check your email for the reset link. It expires after 30 minutes.',
              ),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _busy ? null : _requestReset,
                child: _busy
                    ? const _ButtonSpinner()
                    : const Text('Send reset link'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildResetCard() {
    return _ResetCard(
      title: 'Set new password',
      child: Form(
        key: _resetKey,
        child: Column(
          children: [
            TextFormField(
              controller: _tokenController,
              decoration:
                  const InputDecoration(labelText: 'Reset link or token'),
              validator: _required,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _passwordController,
              obscureText: !_showPassword,
              decoration: InputDecoration(
                labelText: 'New password',
                suffixIcon: IconButton(
                  icon: Icon(
                      _showPassword ? Icons.visibility_off : Icons.visibility),
                  onPressed: () =>
                      setState(() => _showPassword = !_showPassword),
                ),
              ),
              validator: _passwordValidator,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _confirmController,
              obscureText: !_showPassword,
              decoration: const InputDecoration(labelText: 'Confirm password'),
              validator: _confirmPasswordValidator,
            ),
            const SizedBox(height: 12),
            if (_reset)
              const _SuccessText(
                  'Password updated. Return to sign in with your new password.'),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _busy ? null : _resetPassword,
                child: _busy
                    ? const _ButtonSpinner()
                    : const Text('Reset password'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _requestReset() async {
    if (!_emailKey.currentState!.validate()) return;
    await _run(() async {
      await context
          .read<AuthRepository>()
          .forgotPassword(_emailController.text);
      if (mounted) setState(() => _sent = true);
    });
  }

  Future<void> _resetPassword() async {
    if (!_resetKey.currentState!.validate()) return;
    await _run(() async {
      await context.read<AuthRepository>().resetPassword(
            token: extractResetToken(_tokenController.text),
            newPassword: _passwordController.text,
          );
      if (mounted) setState(() => _reset = true);
    });
  }

  Future<void> _run(Future<void> Function() action) async {
    setState(() => _busy = true);
    try {
      await action();
    } on ApiException catch (error) {
      _showSnack(error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _showSnack(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  String? _required(String? value) {
    return value == null || value.trim().isEmpty ? 'Required' : null;
  }

  String? _emailValidator(String? value) {
    final text = value?.trim() ?? '';
    return RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(text)
        ? null
        : 'Enter a valid email address';
  }

  String? _passwordValidator(String? value) {
    final text = value ?? '';
    if (text.length < 8) return 'Use at least 8 characters';
    if (!RegExp(r'[A-Za-z]').hasMatch(text) || !RegExp(r'\d').hasMatch(text)) {
      return 'Include at least one letter and one number';
    }
    return null;
  }

  String? _confirmPasswordValidator(String? value) {
    if (value != _passwordController.text) return "Passwords don't match";
    return null;
  }
}

class _ResetCard extends StatelessWidget {
  const _ResetCard({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                color: AppColors.ink900,
                fontWeight: FontWeight.w800,
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 14),
            child,
          ],
        ),
      ),
    );
  }
}

class _SuccessText extends StatelessWidget {
  const _SuccessText(this.message);

  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        message,
        style: const TextStyle(color: AppColors.verified, fontSize: 13),
      ),
    );
  }
}

class _ButtonSpinner extends StatelessWidget {
  const _ButtonSpinner();

  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      height: 18,
      width: 18,
      child: CircularProgressIndicator(strokeWidth: 2),
    );
  }
}
