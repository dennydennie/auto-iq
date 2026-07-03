import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../theme/app_colors.dart';
import '../../../widgets/bisell_logo.dart';
import '../../core/config/app_config.dart';
import '../../core/network/api_exception.dart';
import '../../repositories/auth_repository.dart';
import '../../state/session_controller.dart';

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
  final _otpCodeController = TextEditingController();

  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController(text: '+263');
  final _registerPasswordController = TextEditingController();
  final _cityController = TextEditingController(text: 'Harare');

  bool _isRegisterMode = false;
  bool _busy = false;
  String _selectedRole = 'BUYER';
  String? _otpIdentifier;
  String? _otpPhone;
  String? _otpPassword;
  String? _otpMessage;

  @override
  void dispose() {
    _loginIdentifierController.dispose();
    _loginPasswordController.dispose();
    _otpCodeController.dispose();
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _registerPasswordController.dispose();
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
                  const Text(
                    'Android runtime for Auto IQ',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w800,
                      color: AppColors.ink900,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'This mobile build talks directly to ${AppConfig.apiLabel}.',
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.ink500,
                    ),
                  ),
                  const SizedBox(height: 24),
                  _ModeSwitch(
                    isRegisterMode: _isRegisterMode,
                    onChanged: _switchMode,
                  ),
                  const SizedBox(height: 16),
                  if (session.errorMessage != null)
                    _ErrorBanner(
                      message: session.errorMessage!,
                      onDismiss: session.clearError,
                    ),
                  if (_otpIdentifier != null && !_isRegisterMode)
                    _buildOtpCard()
                  else
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
            decoration: const InputDecoration(labelText: 'Email or phone'),
            validator: _required,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _loginPasswordController,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'Password'),
            validator: _required,
          ),
          const SizedBox(height: 16),
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
    return Form(
      key: _registerFormKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextFormField(
            controller: _fullNameController,
            decoration: const InputDecoration(labelText: 'Full name'),
            validator: _required,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'Email'),
            validator: _emailValidator,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: 'Phone (+263...)'),
            validator: _phoneValidator,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _cityController,
            decoration: const InputDecoration(labelText: 'City'),
            validator: _required,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _registerPasswordController,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'Password'),
            validator: _passwordValidator,
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _selectedRole,
            decoration: const InputDecoration(labelText: 'Role'),
            items: const [
              DropdownMenuItem(value: 'BUYER', child: Text('Buyer')),
              DropdownMenuItem(value: 'SELLER', child: Text('Seller')),
            ],
            onChanged: (value) {
              if (value == null) {
                return;
              }
              setState(() => _selectedRole = value);
            },
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _busy ? null : _register,
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

  Widget _buildOtpCard() {
    final identifier = _otpIdentifier ?? '';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Enter the 6-digit code',
          style: TextStyle(
            color: AppColors.ink900,
            fontSize: 22,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'We sent a verification code to the SMS and email channels tied to $identifier.',
          style: const TextStyle(
            color: AppColors.ink500,
            fontSize: 13,
            height: 1.5,
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _otpCodeController,
          keyboardType: TextInputType.number,
          maxLength: 6,
          decoration: const InputDecoration(
            counterText: '',
            labelText: 'Verification code',
            hintText: '123456',
          ),
        ),
        const SizedBox(height: 12),
        if (_otpMessage != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              _otpMessage!,
              style: const TextStyle(color: AppColors.verified, fontSize: 13),
            ),
          ),
        Row(
          children: [
            OutlinedButton(
              onPressed: _busy ? null : _sendOtp,
              child: const Text('Resend code'),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: _busy ? null : _verifyOtp,
                child: _busy
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Verify and sign in'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        TextButton(
          onPressed: _busy ? null : _clearOtpVerification,
          child: const Text('Back to sign in'),
        ),
      ],
    );
  }

  Future<void> _login() async {
    if (!_loginFormKey.currentState!.validate()) {
      return;
    }
    setState(() => _busy = true);
    try {
      await context.read<SessionController>().login(
            identifier: _loginIdentifierController.text,
            password: _loginPasswordController.text,
          );
    } on ApiException catch (error) {
      if (error.code == 'OTP_REQUIRED' && mounted) {
        _beginOtpVerification(
          identifier: _loginIdentifierController.text,
          phone: _loginIdentifierController.text.trim().startsWith('+')
              ? _loginIdentifierController.text
              : null,
          password: _loginPasswordController.text,
        );
        return;
      }
      _showError(error.message);
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  Future<void> _register() async {
    if (!_registerFormKey.currentState!.validate()) {
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
      if (!mounted) {
        return;
      }
      if (result.otpRequired) {
        _beginOtpVerification(
          identifier: _emailController.text,
          phone: _phoneController.text,
          password: _registerPasswordController.text,
        );
        await _sendOtp();
      }
    } on ApiException catch (error) {
      _showError(error.message);
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  void _switchMode(bool value) {
    setState(() {
      _isRegisterMode = value;
      if (value) {
        _clearOtpState();
      }
    });
  }

  void _beginOtpVerification({
    required String identifier,
    required String password,
    String? phone,
  }) {
    context.read<SessionController>().clearError();
    setState(() {
      _isRegisterMode = false;
      _otpIdentifier = identifier.trim();
      _otpPhone = phone?.trim();
      _otpPassword = password;
      _otpCodeController.clear();
      _otpMessage = 'Code sent. Enter it below to finish signing in.';
    });
  }

  void _clearOtpVerification() {
    setState(_clearOtpState);
  }

  void _clearOtpState() {
    _otpIdentifier = null;
    _otpPhone = null;
    _otpPassword = null;
    _otpMessage = null;
    _otpCodeController.clear();
  }

  Future<void> _sendOtp() async {
    final identifier = _otpIdentifier;
    if (identifier == null) {
      return;
    }
    setState(() {
      _busy = true;
      _otpMessage = null;
    });
    try {
      await context.read<AuthRepository>().sendOtp(
            identifier: identifier,
            phone: _otpPhone,
          );
      if (mounted) {
        setState(() => _otpMessage = 'Code sent. Check SMS and email.');
      }
    } on ApiException catch (error) {
      _showError(error.message);
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  Future<void> _verifyOtp() async {
    final identifier = _otpIdentifier;
    final password = _otpPassword;
    if (identifier == null || password == null) {
      return;
    }
    setState(() {
      _busy = true;
      _otpMessage = null;
    });
    try {
      final authRepository = context.read<AuthRepository>();
      final sessionController = context.read<SessionController>();
      await authRepository.verifyOtp(
        identifier: identifier,
        phone: _otpPhone,
        code: _otpCodeController.text,
      );
      await sessionController.login(identifier: identifier, password: password);
      if (mounted) {
        _clearOtpState();
      }
    } on ApiException catch (error) {
      _showError(error.message);
    } finally {
      if (mounted) {
        setState(() => _busy = false);
      }
    }
  }

  void _showError(String message) {
    if (!mounted) {
      return;
    }
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  String? _required(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Required';
    }
    return null;
  }

  String? _emailValidator(String? value) {
    final text = value?.trim() ?? '';
    if (text.isEmpty || !text.contains('@')) {
      return 'Enter a valid email';
    }
    return null;
  }

  String? _phoneValidator(String? value) {
    final text = value?.trim() ?? '';
    if (!text.startsWith('+263') || text.length < 13) {
      return 'Use E.164 format, for example +263771234567';
    }
    return null;
  }

  String? _passwordValidator(String? value) {
    final text = value ?? '';
    if (text.length < 8) {
      return 'Use at least 8 characters';
    }
    return null;
  }
}

class _ModeSwitch extends StatelessWidget {
  const _ModeSwitch({required this.isRegisterMode, required this.onChanged});

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
  const _ErrorBanner({required this.message, required this.onDismiss});

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
