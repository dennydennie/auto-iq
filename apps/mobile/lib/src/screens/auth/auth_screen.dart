import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../theme/app_colors.dart';
import '../../../widgets/bisell_logo.dart';
import '../../core/config/app_config.dart';
import '../../core/network/api_exception.dart';
import '../../repositories/auth_repository.dart';
import '../../state/session_controller.dart';
import 'forgot_password_screen.dart';
import 'otp_verification_screen.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _loginFormKey = GlobalKey<FormState>();
  final _registerFormKey = GlobalKey<FormState>();

  final _loginIdentifierController = TextEditingController();
  final _loginPasswordController = TextEditingController();

  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController(text: '+263');
  final _registerPasswordController = TextEditingController();
  final _registerConfirmPasswordController = TextEditingController();
  final _cityController = TextEditingController(text: 'Harare');

  bool _isRegisterMode = false;
  bool _busy = false;
  bool _showLoginPassword = false;
  bool _showRegisterPassword = false;
  bool _showRegisterConfirmPassword = false;
  bool _acceptedRules = false;
  String _selectedRole = 'BUYER';

  @override
  void dispose() {
    _loginIdentifierController.dispose();
    _loginPasswordController.dispose();
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _registerPasswordController.dispose();
    _registerConfirmPasswordController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final session = context.watch<SessionController>();
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const BiSellLogo(size: 36),
                  const SizedBox(height: 20),
                  Text(
                    _isRegisterMode ? 'Create your account' : 'Welcome back',
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: AppColors.ink900,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _isRegisterMode
                        ? 'Sign up to browse verified vehicles or list your own.'
                        : 'Sign in to continue where you left off.',
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.ink500,
                    ),
                  ),
                  const SizedBox(height: 24),
                  _ModeSwitch(
                    isRegisterMode: _isRegisterMode,
                    onChanged: (value) =>
                        setState(() => _isRegisterMode = value),
                  ),
                  const SizedBox(height: 16),
                  if (AppConfig.isInsecureRemote) const _InsecureRemoteBanner(),
                  if (session.errorMessage != null)
                    _ErrorBanner(
                      message: session.errorMessage!,
                      onDismiss: session.clearError,
                    ),
                  _isRegisterMode ? _buildRegisterCard() : _buildLoginCard(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoginCard() {
    return Form(
      key: _loginFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextFormField(
            controller: _loginIdentifierController,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            autofillHints: const [AutofillHints.username, AutofillHints.email],
            autocorrect: false,
            decoration: const InputDecoration(
              labelText: 'Email or phone',
              hintText: 'you@example.com or +263...',
            ),
            validator: _required,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _loginPasswordController,
            obscureText: !_showLoginPassword,
            textInputAction: TextInputAction.done,
            autofillHints: const [AutofillHints.password],
            decoration: InputDecoration(
              labelText: 'Password',
              suffixIcon: IconButton(
                icon: Icon(_showLoginPassword
                    ? Icons.visibility_off
                    : Icons.visibility),
                onPressed: () =>
                    setState(() => _showLoginPassword = !_showLoginPassword),
                tooltip: _showLoginPassword ? 'Hide password' : 'Show password',
              ),
            ),
            onFieldSubmitted: (_) => _login(),
            validator: _required,
          ),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: _openForgotPassword,
              child: const Text('Forgot password?'),
            ),
          ),
          const SizedBox(height: 4),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _busy ? null : _login,
              child: _busy
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Sign in'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRegisterCard() {
    final password = _registerPasswordController.text;
    final confirm = _registerConfirmPasswordController.text;
    final passwordsMismatch = confirm.isNotEmpty && password != confirm;

    return Form(
      key: _registerFormKey,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextFormField(
            controller: _fullNameController,
            textCapitalization: TextCapitalization.words,
            textInputAction: TextInputAction.next,
            autofillHints: const [AutofillHints.name],
            decoration: const InputDecoration(labelText: 'Full name'),
            validator: _required,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            autofillHints: const [AutofillHints.email],
            autocorrect: false,
            decoration: const InputDecoration(labelText: 'Email'),
            validator: _emailValidator,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            textInputAction: TextInputAction.next,
            autofillHints: const [AutofillHints.telephoneNumber],
            inputFormatters: [
              FilteringTextInputFormatter.allow(RegExp(r'[0-9+]')),
            ],
            decoration: const InputDecoration(
              labelText: 'Phone',
              helperText: 'E.164 format, e.g. +263771234567',
            ),
            validator: _phoneValidator,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _cityController,
            textCapitalization: TextCapitalization.words,
            textInputAction: TextInputAction.next,
            autofillHints: const [AutofillHints.addressCity],
            decoration: const InputDecoration(labelText: 'City'),
            validator: _required,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _registerPasswordController,
            obscureText: !_showRegisterPassword,
            textInputAction: TextInputAction.next,
            autofillHints: const [AutofillHints.newPassword],
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              labelText: 'Password',
              helperText: 'Min 8 characters, mix of letters and numbers.',
              suffixIcon: IconButton(
                icon: Icon(_showRegisterPassword
                    ? Icons.visibility_off
                    : Icons.visibility),
                onPressed: () => setState(
                    () => _showRegisterPassword = !_showRegisterPassword),
                tooltip:
                    _showRegisterPassword ? 'Hide password' : 'Show password',
              ),
            ),
            validator: _passwordValidator,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _registerConfirmPasswordController,
            obscureText: !_showRegisterConfirmPassword,
            textInputAction: TextInputAction.done,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              labelText: 'Confirm password',
              errorText: passwordsMismatch ? "Passwords don't match" : null,
              suffixIcon: IconButton(
                icon: Icon(_showRegisterConfirmPassword
                    ? Icons.visibility_off
                    : Icons.visibility),
                onPressed: () => setState(() => _showRegisterConfirmPassword =
                    !_showRegisterConfirmPassword),
                tooltip: _showRegisterConfirmPassword
                    ? 'Hide password'
                    : 'Show password',
              ),
            ),
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Confirm your password';
              }
              if (value != _registerPasswordController.text) {
                return "Passwords don't match";
              }
              return null;
            },
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _selectedRole,
            decoration: const InputDecoration(labelText: 'I want to'),
            items: const [
              DropdownMenuItem(
                value: 'BUYER',
                child: Text('Browse and buy vehicles'),
              ),
              DropdownMenuItem(
                value: 'SELLER',
                child: Text('List and sell a vehicle'),
              ),
            ],
            onChanged: (value) {
              if (value == null) return;
              setState(() => _selectedRole = value);
            },
          ),
          const SizedBox(height: 12),
          CheckboxListTile(
            value: _acceptedRules,
            onChanged: (value) =>
                setState(() => _acceptedRules = value ?? false),
            controlAffinity: ListTileControlAffinity.leading,
            contentPadding: EdgeInsets.zero,
            title: const Text(
              'I agree to the platform rules and consent to verification and listing-related SMS/email.',
              style: TextStyle(fontSize: 13),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _busy || !_acceptedRules || passwordsMismatch
                  ? null
                  : _register,
              child: _busy
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Create account'),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _login() async {
    if (!_loginFormKey.currentState!.validate()) return;
    setState(() => _busy = true);
    try {
      await context.read<SessionController>().login(
            identifier: _loginIdentifierController.text,
            password: _loginPasswordController.text,
          );
    } on ApiException catch (error) {
      if (error.code == 'OTP_REQUIRED' && mounted) {
        final identifier = _loginIdentifierController.text.trim();
        await Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (_) => OtpVerificationScreen(
              phone: identifier.startsWith('+') ? identifier : null,
              identifier: identifier,
            ),
          ),
        );
        return;
      }
      _showError(error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _register() async {
    if (!_registerFormKey.currentState!.validate()) return;
    if (!_acceptedRules) {
      _showError('Please accept the platform rules to continue.');
      return;
    }
    setState(() => _busy = true);
    try {
      final result = await context.read<AuthRepository>().register(
            RegisterInput(
              fullName: _fullNameController.text,
              email: _emailController.text,
              phone: _phoneController.text,
              password: _registerPasswordController.text,
              role: _selectedRole,
              city: _cityController.text,
            ),
          );
      if (!mounted) return;

      // Always route through OTP verification. Even when the API says OTP
      // isn't required, taking the user to a verification screen with an
      // auto-send avoids a dead-end on the register screen.
      await Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => OtpVerificationScreen(
            phone: _phoneController.text,
            identifier: _emailController.text,
            autoSend: result.otpRequired,
          ),
        ),
      );

      // Clear the password once we come back; keeping the plaintext in memory
      // any longer than necessary is a minor security posture win.
      if (mounted) {
        _registerPasswordController.clear();
        _registerConfirmPasswordController.clear();
      }
    } on ApiException catch (error) {
      _showError(error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _openForgotPassword() {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => const ForgotPasswordScreen(),
      ),
    );
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  String? _required(String? value) {
    if (value == null || value.trim().isEmpty) return 'Required';
    return null;
  }

  String? _emailValidator(String? value) {
    final text = value?.trim() ?? '';
    // Tight but not exhaustive — server has the final say.
    final looksValid = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(text);
    if (!looksValid) return 'Enter a valid email address';
    return null;
  }

  String? _phoneValidator(String? value) {
    final text = value?.trim() ?? '';
    if (!text.startsWith('+263') || text.length < 13) {
      return 'Use E.164 format, for example +263771234567';
    }
    // Only digits after the +263 prefix.
    if (!RegExp(r'^\+263\d{9,10}$').hasMatch(text)) {
      return 'Only digits after +263';
    }
    return null;
  }

  String? _passwordValidator(String? value) {
    final text = value ?? '';
    if (text.length < 8) return 'Use at least 8 characters';
    final hasLetter = RegExp(r'[A-Za-z]').hasMatch(text);
    final hasNumber = RegExp(r'\d').hasMatch(text);
    if (!hasLetter || !hasNumber) {
      return 'Include at least one letter and one number';
    }
    return null;
  }
}

class _ModeSwitch extends StatelessWidget {
  const _ModeSwitch({
    required this.isRegisterMode,
    required this.onChanged,
  });

  final bool isRegisterMode;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return SegmentedButton<bool>(
      segments: const [
        ButtonSegment<bool>(value: false, label: Text('Sign in')),
        ButtonSegment<bool>(value: true, label: Text('Register')),
      ],
      selected: {isRegisterMode},
      onSelectionChanged: (selection) => onChanged(selection.first),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({
    required this.message,
    required this.onDismiss,
  });

  final String message;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.rejectSoft,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: AppColors.reject),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(color: AppColors.reject),
            ),
          ),
          IconButton(
            onPressed: onDismiss,
            icon: const Icon(Icons.close, size: 18),
          ),
        ],
      ),
    );
  }
}

class _InsecureRemoteBanner extends StatelessWidget {
  const _InsecureRemoteBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF3CD),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFFC72C), width: 1),
      ),
      child: const Row(
        children: [
          Icon(Icons.warning_amber_rounded, color: Color(0xFF8A5D00)),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'Talking to an insecure HTTP endpoint. Release builds require HTTPS.',
              style: TextStyle(color: Color(0xFF8A5D00), fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
}
