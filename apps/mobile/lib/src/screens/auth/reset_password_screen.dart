import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../theme/app_colors.dart';
import '../../../widgets/bisell_logo.dart';
import '../../core/network/api_exception.dart';
import '../../repositories/auth_repository.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key, required this.token});

  final String token;

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _busy = false;
  bool _completed = false;
  bool _showPassword = false;

  @override
  void dispose() {
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
          children: [_content()],
        ),
      ),
    );
  }

  Widget _content() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const BiSellLogo(size: 32),
          const SizedBox(height: 24),
          Text(
            _completed ? 'Password updated' : 'Choose a new password',
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: AppColors.ink900,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _completed
                ? 'Your Auto IQ account is secure. Return to sign in with your new password.'
                : 'Use at least 8 characters with a letter and a number.',
            style: const TextStyle(color: AppColors.ink500, height: 1.5),
          ),
          const SizedBox(height: 24),
          if (_completed) _backButton() else _passwordForm(),
        ],
      ),
    );
  }

  Widget _passwordForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _passwordField(),
        const SizedBox(height: 14),
        TextFormField(
          controller: _confirmController,
          obscureText: !_showPassword,
          textInputAction: TextInputAction.done,
          autofillHints: const [AutofillHints.newPassword],
          decoration: const InputDecoration(labelText: 'Confirm password'),
          validator: _validateConfirmation,
          onFieldSubmitted: (_) => _submit(),
        ),
        const SizedBox(height: 18),
        ElevatedButton(
          onPressed: _busy ? null : _submit,
          child: _busy
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Reset password'),
        ),
      ],
    );
  }

  Widget _passwordField() {
    return TextFormField(
      controller: _passwordController,
      obscureText: !_showPassword,
      textInputAction: TextInputAction.next,
      autofillHints: const [AutofillHints.newPassword],
      decoration: InputDecoration(
        labelText: 'New password',
        suffixIcon: IconButton(
          tooltip: _showPassword ? 'Hide password' : 'Show password',
          icon: Icon(_showPassword ? Icons.visibility_off : Icons.visibility),
          onPressed: () => setState(() => _showPassword = !_showPassword),
        ),
      ),
      validator: _validatePassword,
    );
  }

  Widget _backButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: () =>
            Navigator.of(context).popUntil((route) => route.isFirst),
        child: const Text('Back to sign in'),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      await context.read<AuthRepository>().resetPassword(
            token: widget.token,
            newPassword: _passwordController.text,
          );
      _complete();
    } on ApiException catch (error) {
      _showError(error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _complete() {
    if (!mounted) return;
    _passwordController.clear();
    _confirmController.clear();
    setState(() => _completed = true);
  }

  String? _validatePassword(String? value) {
    final password = value ?? '';
    if (password.length < 8) return 'Use at least 8 characters';
    if (!RegExp(r'[A-Za-z]').hasMatch(password) ||
        !RegExp(r'\d').hasMatch(password)) {
      return 'Include at least one letter and one number';
    }
    return null;
  }

  String? _validateConfirmation(String? value) {
    if (value != _passwordController.text) return "Passwords don't match";
    return null;
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }
}
