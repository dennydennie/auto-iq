import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../theme/app_colors.dart';
import '../../core/i18n/app_localizations.dart';
import '../../core/network/api_exception.dart';
import '../../repositories/auth_repository.dart';
import '../../state/session_controller.dart';

const int _codeLength = 6;
const int _resendCooldownSeconds = 30;

class OtpVerificationScreen extends StatefulWidget {
  const OtpVerificationScreen({
    super.key,
    this.phone,
    required this.identifier,
    this.autoSend = true,
  });

  final String? phone;
  final String identifier;

  /// When true (default), fires a code send request on mount. Callers that
  /// know the backend already fired one during the previous step can set this
  /// to false to avoid a doubled SMS.
  final bool autoSend;

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final _codeController = TextEditingController();
  final _codeFocus = FocusNode();
  bool _busy = false;
  String? _message;
  String? _testOtpCode;
  Timer? _tick;
  int _resendIn = 0;
  bool _verificationLocked = false;

  bool get _codeReady => _codeController.text.trim().length == _codeLength;

  @override
  void initState() {
    super.initState();
    if (widget.autoSend) {
      // Delay one frame so the widget is mounted before we call the API.
      WidgetsBinding.instance.addPostFrameCallback((_) => _sendCode());
    }
  }

  @override
  void dispose() {
    _tick?.cancel();
    _codeController.dispose();
    _codeFocus.dispose();
    super.dispose();
  }

  void _startResendCooldown() {
    _tick?.cancel();
    setState(() => _resendIn = _resendCooldownSeconds);
    _tick = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_resendIn <= 1) {
        timer.cancel();
        setState(() => _resendIn = 0);
      } else {
        setState(() => _resendIn -= 1);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(copy.text('verifyAccount'))),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                copy.text('enterOtp'),
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: AppColors.ink900,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                _testOtpCode == null
                    ? copy.formatText(
                        'otpSentDescription',
                        {'identifier': widget.identifier},
                      )
                    : copy.text('testOtpDescription'),
                style: const TextStyle(
                  fontSize: 14,
                  color: AppColors.ink500,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _codeController,
                focusNode: _codeFocus,
                autofocus: true,
                keyboardType: TextInputType.number,
                textInputAction: TextInputAction.done,
                // one-time-code hint: iOS reads the code out of the SMS
                // notification banner; Android surfaces it via SMS Retriever /
                // Autofill.
                autofillHints: const [AutofillHints.oneTimeCode],
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(_codeLength),
                ],
                onChanged: (_) => setState(() {}),
                onSubmitted: (_) {
                  if (_codeReady && !_verificationLocked) _verify();
                },
                enabled: !_verificationLocked,
                style: const TextStyle(
                  fontSize: 24,
                  letterSpacing: 12,
                  fontWeight: FontWeight.w700,
                ),
                textAlign: TextAlign.center,
                decoration: InputDecoration(
                  labelText: copy.text('otpCode'),
                  hintText: '••••••',
                ),
              ),
              const SizedBox(height: 16),
              if (_message != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(
                    _message!,
                    style: const TextStyle(
                      color: AppColors.verified,
                      fontSize: 13,
                    ),
                  ),
                ),
              if (_testOtpCode != null) ...[
                _TestOtpCodeCard(
                  code: _testOtpCode!,
                  onUseCode: _useTestCode,
                ),
                const SizedBox(height: 12),
              ],
              _verificationActions(),
              const SizedBox(height: 12),
              Text(
                _testOtpCode == null
                    ? copy.text('otpHelp')
                    : copy.text('testOtpHelp'),
                style: TextStyle(
                  color: AppColors.ink500.withValues(alpha: 0.9),
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _sendCode() async {
    if (_busy) return;
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      final repository = context.read<AuthRepository>();
      final testOtpCode = await repository.sendOtp(
        identifier: widget.identifier,
        phone: widget.phone,
      );
      if (!mounted) return;
      setState(() {
        _testOtpCode = testOtpCode;
        _message = testOtpCode == null
            ? AutoIqLocalizations.of(context).text('codeSent')
            : AutoIqLocalizations.of(context).text('testCodeGenerated');
        _verificationLocked = false;
      });
      _startResendCooldown();
    } on ApiException catch (error) {
      _showError(error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Widget _verificationActions() {
    final copy = AutoIqLocalizations.of(context);
    return LayoutBuilder(
      builder: (context, constraints) {
        final resend = OutlinedButton.icon(
          onPressed: _busy || _resendIn > 0 ? null : _sendCode,
          icon: const Icon(Icons.sms_outlined),
          label: Text(
            _resendIn > 0
                ? copy.formatText('resendIn', {'seconds': _resendIn})
                : copy.text('sendCode'),
          ),
        );
        final verify = ElevatedButton(
          onPressed:
              _busy || !_codeReady || _verificationLocked ? null : _verify,
          child: _busy
              ? const SizedBox.square(
                  dimension: 18,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : Text(copy.text('verifyAndSignIn')),
        );
        if (constraints.maxWidth < 480) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              resend,
              const SizedBox(height: 12),
              verify,
            ],
          );
        }
        return Row(
          children: [
            resend,
            const SizedBox(width: 12),
            Expanded(child: verify),
          ],
        );
      },
    );
  }

  void _useTestCode() {
    final code = _testOtpCode;
    if (code == null) return;
    _codeController.value = TextEditingValue(
      text: code,
      selection: TextSelection.collapsed(offset: code.length),
    );
    _codeFocus.requestFocus();
    setState(() {});
  }

  Future<void> _verify() async {
    if (!_codeReady) return;
    setState(() {
      _busy = true;
      _message = null;
    });
    try {
      final authRepository = context.read<AuthRepository>();
      final sessionController = context.read<SessionController>();
      await authRepository.verifyOtp(
        identifier: widget.identifier,
        phone: widget.phone,
        code: _codeController.text,
      );
      await sessionController.refreshProfile();
      if (!mounted) return;
      Navigator.of(context).popUntil((route) => route.isFirst);
    } on ApiException catch (error) {
      _showError(error.message);
      if (error.code == 'OTP_MAX_ATTEMPTS' && mounted) {
        _tick?.cancel();
        setState(() {
          _verificationLocked = true;
          _resendIn = 0;
        });
      }
      // Clear the code so the user can retype cleanly. Rate-limit copy from
      // the server carries the important detail.
      if (mounted) {
        _codeController.clear();
        _codeFocus.requestFocus();
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }
}

class _TestOtpCodeCard extends StatelessWidget {
  const _TestOtpCodeCard({required this.code, required this.onUseCode});

  final String code;
  final VoidCallback onUseCode;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Semantics(
      container: true,
      liveRegion: true,
      label: copy.formatText('testingCodeLabel', {'code': code}),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.fromLTRB(16, 12, 8, 12),
        decoration: BoxDecoration(
          color: AppColors.amberSoft,
          border: Border.all(color: AppColors.amberDark),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    copy.text('testingCode'),
                    style: const TextStyle(
                      color: AppColors.ink700,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  SelectableText(
                    code,
                    style: const TextStyle(
                      color: AppColors.ink900,
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 6,
                    ),
                  ),
                ],
              ),
            ),
            TextButton(
              onPressed: onUseCode,
              child: Text(copy.text('useCode')),
            ),
          ],
        ),
      ),
    );
  }
}
