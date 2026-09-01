import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../theme/app_colors.dart';
import '../../../theme/app_tokens.dart';
import '../../../widgets/bisell_logo.dart';
import '../../core/config/app_config.dart';
import '../../core/forms/form_validators.dart';
import '../../core/i18n/app_localizations.dart';
import '../../core/network/api_exception.dart';
import '../../repositories/auth_repository.dart';
import '../../state/session_controller.dart';
import '../../widgets/adaptive_content.dart';
import 'forgot_password_screen.dart';
import 'otp_verification_screen.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _loginFormKey = GlobalKey<FormState>();
  final _registerDetailsFormKey = GlobalKey<FormState>();
  final _registerSecurityFormKey = GlobalKey<FormState>();

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
  String _selectedRole = 'BUYER';
  int _registerStep = 0;

  AutoIqLocalizations get _copy => AutoIqLocalizations.of(context);

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
        child: AdaptiveContent(
          maxWidth: 520,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const BiSellLogo(size: 36),
                const SizedBox(height: 20),
                Text(
                  _isRegisterMode
                      ? _copy.text('createAccountTitle')
                      : _copy.text('welcomeBack'),
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: AppColors.ink900,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _isRegisterMode
                      ? _copy.text('registrationSubtitle')
                      : _copy.text('signInSubtitle'),
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppColors.ink500,
                  ),
                ),
                const SizedBox(height: 24),
                _ModeSwitch(
                  isRegisterMode: _isRegisterMode,
                  onChanged: (value) => setState(() => _isRegisterMode = value),
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
            decoration: InputDecoration(
              labelText: _copy.text('emailOrPhone'),
              hintText: _copy.text('emailOrPhoneHint'),
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
              labelText: _copy.text('password'),
              suffixIcon: IconButton(
                icon: Icon(_showLoginPassword
                    ? Icons.visibility_off
                    : Icons.visibility),
                onPressed: () =>
                    setState(() => _showLoginPassword = !_showLoginPassword),
                tooltip: _showLoginPassword
                    ? _copy.text('hidePassword')
                    : _copy.text('showPassword'),
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
              child: Text(_copy.text('forgotPassword')),
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
                  : Text(_copy.text('signIn')),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRegisterCard() {
    return AnimatedSwitcher(
      duration: AppMotion.standard,
      child: _registerStep == 0
          ? _buildRegistrationDetails()
          : _buildRegistrationSecurity(),
    );
  }

  Widget _buildRegistrationDetails() {
    return Form(
      key: _registerDetailsFormKey,
      child: Column(
        key: const ValueKey('registration-details'),
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _RegistrationProgress(step: 1),
          const SizedBox(height: AppSpacing.md),
          _fullNameField(),
          const SizedBox(height: AppSpacing.sm),
          _emailField(),
          const SizedBox(height: AppSpacing.sm),
          _phoneField(),
          const SizedBox(height: AppSpacing.sm),
          _cityField(),
          const SizedBox(height: AppSpacing.sm),
          _roleField(),
          const SizedBox(height: AppSpacing.md),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              key: const Key('registration-next'),
              onPressed: _openSecurityStep,
              child: Text(_copy.text('continueAction')),
            ),
          ),
        ],
      ),
    );
  }

  Widget _fullNameField() => TextFormField(
        controller: _fullNameController,
        textCapitalization: TextCapitalization.words,
        textInputAction: TextInputAction.next,
        autofillHints: const [AutofillHints.name],
        decoration: InputDecoration(labelText: _copy.fullName),
        validator: (value) =>
            FormValidators.requiredText(value, label: _copy.fullName),
      );

  Widget _emailField() => TextFormField(
        controller: _emailController,
        keyboardType: TextInputType.emailAddress,
        textInputAction: TextInputAction.next,
        autofillHints: const [AutofillHints.email],
        autocorrect: false,
        decoration: InputDecoration(labelText: _copy.text('email')),
        validator: FormValidators.email,
      );

  Widget _phoneField() => TextFormField(
        controller: _phoneController,
        keyboardType: TextInputType.phone,
        textInputAction: TextInputAction.next,
        autofillHints: const [AutofillHints.telephoneNumber],
        inputFormatters: [
          FilteringTextInputFormatter.allow(RegExp(r'[0-9+]')),
        ],
        decoration: InputDecoration(
          labelText: _copy.text('phone'),
          helperText: _copy.text('phoneHelper'),
        ),
        validator: FormValidators.zimbabwePhone,
      );

  Widget _cityField() => TextFormField(
        controller: _cityController,
        textCapitalization: TextCapitalization.words,
        textInputAction: TextInputAction.next,
        autofillHints: const [AutofillHints.addressCity],
        decoration: InputDecoration(labelText: _copy.city),
        validator: (value) =>
            FormValidators.requiredText(value, label: _copy.city),
      );

  Widget _roleField() => DropdownButtonFormField<String>(
        initialValue: _selectedRole,
        isExpanded: true,
        decoration: InputDecoration(labelText: _copy.text('rolePrompt')),
        items: [
          DropdownMenuItem(
            value: 'BUYER',
            child: Text(
              _copy.text('buyerRoleOption'),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          DropdownMenuItem(
            value: 'SELLER',
            child: Text(
              _copy.text('sellerRoleOption'),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
        onChanged: (value) {
          if (value != null) setState(() => _selectedRole = value);
        },
      );

  Widget _buildRegistrationSecurity() {
    final password = _registerPasswordController.text;
    final confirm = _registerConfirmPasswordController.text;
    final mismatch = confirm.isNotEmpty && password != confirm;
    return Form(
      key: _registerSecurityFormKey,
      autovalidateMode: AutovalidateMode.onUserInteraction,
      child: Column(
        key: const ValueKey('registration-security'),
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const _RegistrationProgress(step: 2),
          const SizedBox(height: AppSpacing.md),
          _passwordField(),
          const SizedBox(height: AppSpacing.sm),
          _confirmPasswordField(mismatch),
          const SizedBox(height: AppSpacing.sm),
          Text(
            _copy.text('agreementsAfterVerification'),
            style: const TextStyle(color: AppColors.ink500, height: 1.4),
          ),
          const SizedBox(height: AppSpacing.md),
          _registrationActions(mismatch),
        ],
      ),
    );
  }

  Widget _passwordField() => TextFormField(
        controller: _registerPasswordController,
        obscureText: !_showRegisterPassword,
        textInputAction: TextInputAction.next,
        autofillHints: const [AutofillHints.newPassword],
        onChanged: (_) => setState(() {}),
        decoration: InputDecoration(
          labelText: _copy.text('password'),
          helperText: _copy.text('passwordHelper'),
          suffixIcon: IconButton(
            icon: Icon(_showRegisterPassword
                ? Icons.visibility_off
                : Icons.visibility),
            onPressed: () => setState(
              () => _showRegisterPassword = !_showRegisterPassword,
            ),
            tooltip: _showRegisterPassword
                ? _copy.text('hidePassword')
                : _copy.text('showPassword'),
          ),
        ),
        validator: FormValidators.password,
      );

  Widget _confirmPasswordField(bool mismatch) => TextFormField(
        controller: _registerConfirmPasswordController,
        obscureText: !_showRegisterConfirmPassword,
        textInputAction: TextInputAction.done,
        onChanged: (_) => setState(() {}),
        decoration: InputDecoration(
          labelText: _copy.text('confirmPassword'),
          errorText: mismatch ? _copy.text('passwordsMismatch') : null,
          suffixIcon: IconButton(
            icon: Icon(_showRegisterConfirmPassword
                ? Icons.visibility_off
                : Icons.visibility),
            onPressed: () => setState(() {
              _showRegisterConfirmPassword = !_showRegisterConfirmPassword;
            }),
            tooltip: _showRegisterConfirmPassword
                ? _copy.text('hidePassword')
                : _copy.text('showPassword'),
          ),
        ),
        validator: _confirmPassword,
      );

  Widget _registrationActions(bool mismatch) {
    return Row(
      children: [
        OutlinedButton(
          onPressed: _busy ? null : () => setState(() => _registerStep = 0),
          child: Text(_copy.back),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: ElevatedButton(
            onPressed: _busy || mismatch ? null : _register,
            child: _busy
                ? const SizedBox(
                    height: 18,
                    width: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(_copy.text('createAccount')),
          ),
        ),
      ],
    );
  }

  String? _confirmPassword(String? value) {
    if (value == null || value.isEmpty) {
      return _copy.text('confirmYourPassword');
    }
    if (value != _registerPasswordController.text) {
      return _copy.text('passwordsMismatch');
    }
    return null;
  }

  void _openSecurityStep() {
    if (_registerDetailsFormKey.currentState?.validate() != true) return;
    setState(() => _registerStep = 1);
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
    if (_registerSecurityFormKey.currentState?.validate() != true) return;
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
    if (value == null || value.trim().isEmpty) return _copy.text('required');
    return null;
  }
}

class _RegistrationProgress extends StatelessWidget {
  const _RegistrationProgress({required this.step});

  final int step;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Semantics(
      label: copy.formatText(
        'registrationStep',
        {'current': step, 'total': 2},
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            copy.formatText('stepOf', {'current': step, 'total': 2}),
            style: Theme.of(context).textTheme.labelLarge,
          ),
          const SizedBox(height: AppSpacing.xs),
          LinearProgressIndicator(value: step / 2),
        ],
      ),
    );
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
    final copy = AutoIqLocalizations.of(context);
    return LayoutBuilder(
      builder: (context, constraints) {
        final scaledLabel = MediaQuery.textScalerOf(context).scale(14);
        if (constraints.maxWidth < 360 || scaledLabel > 21) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _modeButton(context, copy.text('signIn'), false),
              const SizedBox(height: AppSpacing.xs),
              _modeButton(context, copy.text('register'), true),
            ],
          );
        }
        return SizedBox(
          width: double.infinity,
          child: SegmentedButton<bool>(
            expandedInsets: EdgeInsets.zero,
            segments: [
              ButtonSegment<bool>(
                value: false,
                label: Text(copy.text('signIn')),
              ),
              ButtonSegment<bool>(
                value: true,
                label: Text(copy.text('register')),
              ),
            ],
            selected: {isRegisterMode},
            onSelectionChanged: (selection) => onChanged(selection.first),
          ),
        );
      },
    );
  }

  Widget _modeButton(BuildContext context, String label, bool value) {
    final selected = value == isRegisterMode;
    return Semantics(
      selected: selected,
      button: true,
      child: OutlinedButton(
        style: OutlinedButton.styleFrom(
          backgroundColor: selected
              ? Theme.of(context).colorScheme.secondaryContainer
              : null,
        ),
        onPressed: () => onChanged(value),
        child: Text(label),
      ),
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
    final copy = AutoIqLocalizations.of(context);
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.amberSoft,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.amber, width: 1),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.warning_amber_rounded,
            color: AppColors.pendingText,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              copy.text('insecureEndpoint'),
              style: const TextStyle(
                color: AppColors.pendingText,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
