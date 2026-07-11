import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';

import '../../screens/auth/reset_password_screen.dart';

String? passwordResetToken(Uri uri) {
  if (uri.scheme != 'autoiq' || uri.host != 'reset-password') {
    return null;
  }
  try {
    final token = Uri.splitQueryString(uri.fragment)['token']?.trim();
    return token == null || token.isEmpty ? null : token;
  } on FormatException {
    return null;
  }
}

abstract interface class PasswordResetLinkSource {
  Future<Uri?> getInitialLink();

  Stream<Uri> get uriLinkStream;
}

class AppLinksPasswordResetLinkSource implements PasswordResetLinkSource {
  AppLinksPasswordResetLinkSource() : _appLinks = AppLinks();

  final AppLinks _appLinks;

  @override
  Future<Uri?> getInitialLink() => _appLinks.getInitialLink();

  @override
  Stream<Uri> get uriLinkStream => _appLinks.uriLinkStream;
}

class PasswordResetLinkListener extends StatefulWidget {
  const PasswordResetLinkListener({
    super.key,
    required this.source,
    required this.navigatorKey,
    required this.child,
  });

  final PasswordResetLinkSource source;
  final GlobalKey<NavigatorState> navigatorKey;
  final Widget child;

  @override
  State<PasswordResetLinkListener> createState() =>
      _PasswordResetLinkListenerState();
}

class _PasswordResetLinkListenerState extends State<PasswordResetLinkListener> {
  StreamSubscription<Uri>? _subscription;
  String? _lastToken;

  @override
  void initState() {
    super.initState();
    _subscription = widget.source.uriLinkStream.listen(_openReset);
    WidgetsBinding.instance.addPostFrameCallback((_) => _openInitialLink());
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }

  Future<void> _openInitialLink() async {
    final uri = await widget.source.getInitialLink();
    if (mounted && uri != null) _openReset(uri);
  }

  void _openReset(Uri uri) {
    final token = passwordResetToken(uri);
    if (token == null || token == _lastToken) return;
    _lastToken = token;
    widget.navigatorKey.currentState?.push(
      MaterialPageRoute<void>(
        builder: (_) => ResetPasswordScreen(token: token),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
