import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../theme/app_colors.dart';
import '../../../widgets/bisell_logo.dart';
import '../../core/network/api_exception.dart';
import '../../repositories/auth_repository.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key, this.token, this.email})
      : assert(token != null || email != null);

  final String? email;
  final String? token;

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _emailController;
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _busy = false;
  bool _completed = false;
  bool _showPassword = false;

  bool get _usesCode => widget.token == null;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController(text: widget.email ?? '');
  }

  @override
  void dispose() {
    _emailController.dispose();
    _codeController.dispose();
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
            _completed
                ? 'Password updated'
                : _usesCode
                    ? 'Enter reset code'
                    : 'Choose a new password',
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
                : _usesCode
                    ? 'Enter the 6-digit code from your email, then choose a new password.'
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
        if (_usesCode) ...[
          _emailField(),
          const SizedBox(height: 14),
          _codeField(),
          const SizedBox(height: 14),
        ],
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

  Widget _emailField() {
    return TextFormField(
      controller: _emailController,
      keyboardType: TextInputType.emailAddress,
      textInputAction: TextInputAction.next,
      autofillHints: const [AutofillHints.email],
      autocorrect: false,
      decoration: const InputDecoration(labelText: 'Email address'),
      validator: _validateEmail,
    );
  }

  Widget _codeField() {
    return TextFormField(
      controller: _codeController,
      keyboardType: TextInputType.number,
      textInputAction: TextInputAction.next,
      autofillHints: const [AutofillHints.oneTimeCode],
      inputFormatters: [
        FilteringTextInputFormatter.digitsOnly,
        LengthLimitingTextInputFormatter(6),
      ],
      decoration: const InputDecoration(labelText: 'Reset code'),
      validator: _validateCode,
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
      if (_usesCode) {
        await context.read<AuthRepository>().resetPasswordWithCode(
              email: _emailController.text,
              code: _codeController.text,
              newPassword: _passwordController.text,
            );
      } else {
        await context.read<AuthRepository>().resetPassword(
              token: widget.token!,
              newPassword: _passwordController.text,
            );
      }
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
    _codeController.clear();
    setState(() => _completed = true);
  }

  String? _validateEmail(String? value) {
    final email = value?.trim() ?? '';
    if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email)) {
      return 'Enter a valid email address';
    }
    return null;
  }

  String? _validateCode(String? value) {
    if (!RegExp(r'^\d{6}$').hasMatch(value ?? '')) {
      return 'Enter the 6-digit code';
    }
    return null;
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
