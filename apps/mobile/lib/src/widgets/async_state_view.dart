import 'package:flutter/material.dart';

import '../../theme/app_colors.dart';
import '../../theme/app_tokens.dart';
import '../core/i18n/app_localizations.dart';
import 'empty_state.dart';

class AsyncStateView extends StatelessWidget {
  const AsyncStateView({
    super.key,
    required this.child,
    required this.isLoading,
    required this.isEmpty,
    required this.emptyTitle,
    required this.emptyMessage,
    this.error,
    this.errorTitle,
    this.onRetry,
    this.loadingLabel,
    this.emptyAction,
  });

  final Widget child;
  final bool isLoading;
  final bool isEmpty;
  final String emptyTitle;
  final String emptyMessage;
  final Object? error;
  final String? errorTitle;
  final VoidCallback? onRetry;
  final String? loadingLabel;
  final Widget? emptyAction;

  @override
  Widget build(BuildContext context) {
    if (isLoading) return AppLoadingView(label: loadingLabel);
    if (error != null) return _errorView(context);
    if (isEmpty) {
      return EmptyState(
        title: emptyTitle,
        message: emptyMessage,
        action: emptyAction,
      );
    }
    return child;
  }

  Widget _errorView(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return EmptyState(
      icon: Icons.cloud_off_outlined,
      title: errorTitle ?? copy.text('somethingWentWrong'),
      message: error.toString(),
      action: onRetry == null
          ? null
          : ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: Text(copy.text('tryAgain')),
            ),
    );
  }
}

class AppLoadingView extends StatelessWidget {
  const AppLoadingView({super.key, this.label});

  final String? label;

  @override
  Widget build(BuildContext context) {
    final resolvedLabel =
        label ?? AutoIqLocalizations.of(context).text('loading');
    return Semantics(
      container: true,
      liveRegion: true,
      label: resolvedLabel,
      excludeSemantics: true,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(
                width: 32,
                height: 32,
                child: CircularProgressIndicator(strokeWidth: 3),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                resolvedLabel,
                style: const TextStyle(color: AppColors.ink700),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
