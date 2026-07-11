import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../theme/app_colors.dart';
import '../../../widgets/bisell_logo.dart';
import '../../core/network/api_exception.dart';
import '../../repositories/auth_repository.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _busy = false;
  bool _submitted = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Password recovery')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [_recoveryCard()],
        ),
      ),
    );
  }

  Widget _recoveryCard() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const BiSellLogo(size: 32),
          const SizedBox(height: 24),
          const Text(
            'Recover your account',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: AppColors.ink900,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Enter your account email. We will send a secure link that opens in Auto IQ.',
            style: TextStyle(color: AppColors.ink500, height: 1.5),
          ),
          const SizedBox(height: 24),
          if (_submitted) _successMessage() else _requestForm(),
        ],
      ),
    );
  }

  Widget _requestForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextFormField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.done,
          autofillHints: const [AutofillHints.email],
          autocorrect: false,
          decoration: const InputDecoration(labelText: 'Email address'),
          validator: _validateEmail,
          onFieldSubmitted: (_) => _submit(),
        ),
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: _busy ? null : _submit,
          child: _busy
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Send reset link'),
        ),
      ],
    );
  }

  Widget _successMessage() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.amber.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(14),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Check your email',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          SizedBox(height: 6),
          Text(
            'If an account matches that address, the Auto IQ reset link will arrive shortly.',
            style: TextStyle(color: AppColors.ink500, height: 1.4),
          ),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      await context.read<AuthRepository>().forgotPassword(
            _emailController.text,
          );
      if (mounted) setState(() => _submitted = true);
    } on ApiException catch (error) {
      _showError(error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String? _validateEmail(String? value) {
    final email = value?.trim() ?? '';
    if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email)) {
      return 'Enter a valid email address';
    }
    return null;
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }
}
