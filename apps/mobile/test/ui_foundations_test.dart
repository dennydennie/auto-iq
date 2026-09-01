import 'package:autoiq_mobile/src/widgets/async_state_view.dart';
import 'package:autoiq_mobile/src/widgets/status_chip.dart';
import 'package:autoiq_mobile/theme/app_colors.dart';
import 'package:autoiq_mobile/theme/app_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('async state distinguishes loading, error, empty, and content',
      (tester) async {
    await tester.pumpWidget(_harness(const _StateHost()));

    expect(find.text('Loading vehicles'), findsOneWidget);
    await tester.tap(find.byKey(const Key('show-error')));
    await tester.pump();
    expect(find.text('Catalogue unavailable'), findsOneWidget);
    expect(find.text('network unavailable'), findsOneWidget);

    await tester.tap(find.text('Try again'));
    await tester.pump();
    expect(find.text('Nothing here'), findsOneWidget);

    await tester.tap(find.byKey(const Key('show-content')));
    await tester.pump();
    expect(find.text('Vehicle content'), findsOneWidget);
  });

  testWidgets('loading and status components expose useful semantics',
      (tester) async {
    final semantics = tester.ensureSemantics();
    await tester.pumpWidget(
      _harness(
        const Column(
          children: [
            Expanded(child: AppLoadingView(label: 'Loading listings')),
            StatusChip(label: 'UNDER_REVIEW'),
          ],
        ),
      ),
    );

    expect(
      tester.getSemantics(find.byType(AppLoadingView)),
      matchesSemantics(label: 'Loading listings', isLiveRegion: true),
    );
    expect(find.text('Under review'), findsOneWidget);
    expect(
      tester.getSemantics(find.byType(StatusChip)),
      matchesSemantics(label: 'Status: Under review'),
    );
    expect(tester.getSize(find.byType(StatusChip)).height,
        greaterThanOrEqualTo(48));
    semantics.dispose();
  });

  testWidgets('generic async state copy uses localized fallbacks',
      (tester) async {
    await tester.pumpWidget(
      _harness(
        const AsyncStateView(
          isLoading: true,
          isEmpty: false,
          emptyTitle: 'Empty',
          emptyMessage: 'No content',
          child: SizedBox.shrink(),
        ),
      ),
    );

    expect(find.text('Loading'), findsOneWidget);
  });

  test('status palettes use accessible foreground colors', () {
    expect(AppColors.verifiedText, isNot(AppColors.verified));
    expect(AppColors.pendingText, isNot(AppColors.pending));
    expect(humanizeStatus('CHANGES_REQUESTED'), 'Changes requested');
  });
}

Widget _harness(Widget child) {
  return MaterialApp(theme: AppTheme.theme, home: Scaffold(body: child));
}

enum _ViewState { loading, error, empty, content }

class _StateHost extends StatefulWidget {
  const _StateHost();

  @override
  State<_StateHost> createState() => _StateHostState();
}

class _StateHostState extends State<_StateHost> {
  var _state = _ViewState.loading;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        AsyncStateView(
          isLoading: _state == _ViewState.loading,
          error: _state == _ViewState.error ? 'network unavailable' : null,
          errorTitle: 'Catalogue unavailable',
          isEmpty: _state == _ViewState.empty,
          emptyTitle: 'Nothing here',
          emptyMessage: 'Try another filter.',
          loadingLabel: 'Loading vehicles',
          onRetry: () => setState(() => _state = _ViewState.empty),
          child: const Center(child: Text('Vehicle content')),
        ),
        Align(
          alignment: Alignment.bottomLeft,
          child: TextButton(
            key: const Key('show-error'),
            onPressed: () => setState(() => _state = _ViewState.error),
            child: const Text('Error'),
          ),
        ),
        Align(
          alignment: Alignment.bottomRight,
          child: TextButton(
            key: const Key('show-content'),
            onPressed: () => setState(() => _state = _ViewState.content),
            child: const Text('Content'),
          ),
        ),
      ],
    );
  }
}
