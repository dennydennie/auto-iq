import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import '../theme/app_theme.dart';
import 'core/i18n/app_localizations.dart';
import 'core/navigation/password_reset_link.dart';
import 'core/network/api_client.dart';
import 'core/network/api_exception.dart';
import 'core/observability/mobile_analytics.dart';
import 'repositories/auth_repository.dart';
import 'repositories/buyer_repository.dart';
import 'repositories/inspector_repository.dart';
import 'repositories/reference_repository.dart';
import 'repositories/seller_repository.dart';
import 'screens/auth/auth_screen.dart';
import 'screens/auth/consent_screen.dart';
import 'screens/buyer/buyer_home_screen.dart';
import 'screens/inspector/inspector_home_screen.dart';
import 'screens/seller/seller_home_screen.dart';
import 'models/app_user.dart';
import 'state/session_controller.dart';
import 'widgets/async_state_view.dart';
import 'widgets/empty_state.dart';

class AutoIqApp extends StatefulWidget {
  const AutoIqApp({
    super.key,
    required this.apiClient,
    this.locale,
    this.analytics = const SentryMobileAnalytics(),
  });

  final ApiClient apiClient;
  final Locale? locale;
  final MobileAnalytics analytics;

  @override
  State<AutoIqApp> createState() => _AutoIqAppState();
}

class _AutoIqAppState extends State<AutoIqApp> {
  final _navigatorKey = GlobalKey<NavigatorState>();
  late final PasswordResetLinkSource _resetLinks;

  @override
  void initState() {
    super.initState();
    _resetLinks = AppLinksPasswordResetLinkSource();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: widget.apiClient),
        Provider<MobileAnalytics>.value(value: widget.analytics),
        Provider<AuthRepository>(
          create: (_) => AuthRepository(widget.apiClient),
        ),
        Provider<ReferenceRepository>(
          create: (_) => ReferenceRepository(widget.apiClient),
        ),
        Provider<BuyerRepository>(
          create: (_) => BuyerRepository(widget.apiClient),
        ),
        Provider<SellerRepository>(
          create: (_) => SellerRepository(widget.apiClient),
        ),
        Provider<InspectorRepository>(
          create: (_) => InspectorRepository(widget.apiClient),
        ),
        ChangeNotifierProvider<SessionController>(
          create: (context) => SessionController(
            authRepository: context.read<AuthRepository>(),
            referenceRepository: context.read<ReferenceRepository>(),
          )..bootstrap(),
        ),
      ],
      child: MaterialApp(
        navigatorKey: _navigatorKey,
        locale: widget.locale,
        supportedLocales: AutoIqLocalizations.supportedLocales,
        localizationsDelegates: const [
          AutoIqLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        onGenerateTitle: (context) => AutoIqLocalizations.of(context).appName,
        navigatorObservers: [SentryNavigatorObserver()],
        debugShowCheckedModeBanner: false,
        theme: AppTheme.theme,
        builder: (context, child) => PasswordResetLinkListener(
          source: _resetLinks,
          navigatorKey: _navigatorKey,
          child: child ?? const SizedBox.shrink(),
        ),
        home: const SessionGate(),
      ),
    );
  }
}

class SessionGate extends StatelessWidget {
  const SessionGate({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<SessionController>(
      builder: (context, session, _) {
        if (session.isBooting) {
          return Scaffold(
            body: AppLoadingView(
              label: AutoIqLocalizations.of(context).text('checkingSession'),
            ),
          );
        }
        if (session.isSessionUnavailable) {
          return SessionUnavailableScreen(
            error: session.bootstrapError!,
            onRetry: session.bootstrap,
          );
        }
        if (!session.isAuthenticated) {
          return const AuthScreen();
        }
        final user = session.user!;
        if (!user.consentsComplete) return ConsentScreen(user: user);
        return AuthenticatedWorkspace(user: user);
      },
    );
  }
}

class SessionUnavailableScreen extends StatelessWidget {
  const SessionUnavailableScreen({
    super.key,
    required this.error,
    required this.onRetry,
  });

  final ApiException error;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Scaffold(
      body: EmptyState(
        icon: Icons.wifi_off_outlined,
        title: copy.sessionUnavailable,
        message: '${copy.sessionUnavailableMessage}\n${error.supportMessage}',
        action: ElevatedButton.icon(
          key: const Key('retry-session'),
          onPressed: onRetry,
          icon: const Icon(Icons.refresh),
          label: Text(copy.retry),
        ),
      ),
    );
  }
}

class AuthenticatedWorkspace extends StatefulWidget {
  const AuthenticatedWorkspace({super.key, required this.user});

  final AppUser user;

  @override
  State<AuthenticatedWorkspace> createState() => _AuthenticatedWorkspaceState();
}

class _AuthenticatedWorkspaceState extends State<AuthenticatedWorkspace> {
  String? _activeRole;

  @override
  void initState() {
    super.initState();
    _activeRole = _initialRole(widget.user.mobileRoles);
  }

  @override
  void didUpdateWidget(AuthenticatedWorkspace oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!widget.user.mobileRoles.contains(_activeRole)) {
      _activeRole = _initialRole(widget.user.mobileRoles);
    }
  }

  @override
  Widget build(BuildContext context) {
    final roles = widget.user.mobileRoles;
    if (roles.isEmpty) return _unsupported(context);
    if (_activeRole == null) {
      return _WorkspaceChooser(roles: roles, onSelected: _selectRole);
    }
    final switcher = roles.length > 1 ? _clearRole : null;
    if (_activeRole == 'BUYER') {
      return BuyerHomeScreen(onSwitchWorkspace: switcher);
    }
    if (_activeRole == 'SELLER') {
      return SellerHomeScreen(onSwitchWorkspace: switcher);
    }
    return InspectorHomeScreen(onSwitchWorkspace: switcher);
  }

  Widget _unsupported(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(copy.appName)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(
            copy.unsupportedRole,
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }

  void _selectRole(String role) => setState(() => _activeRole = role);

  void _clearRole() => setState(() => _activeRole = null);

  String? _initialRole(List<String> roles) {
    return roles.length == 1 ? roles.single : null;
  }
}

class _WorkspaceChooser extends StatelessWidget {
  const _WorkspaceChooser({required this.roles, required this.onSelected});

  final List<String> roles;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(copy.appName)),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(copy.chooseWorkspace,
              style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(copy.chooseWorkspaceDescription),
          const SizedBox(height: 24),
          ...roles.map(
            (role) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Card(
                child: ListTile(
                  key: Key('workspace-${role.toLowerCase()}'),
                  minVerticalPadding: 18,
                  leading: Icon(_workspaceIcon(role)),
                  title: Text(_workspaceLabel(copy, role)),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => onSelected(role),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

IconData _workspaceIcon(String role) {
  if (role == 'SELLER') return Icons.sell_outlined;
  if (role == 'INSPECTOR') return Icons.assignment_turned_in_outlined;
  return Icons.directions_car_outlined;
}

String _workspaceLabel(AutoIqLocalizations copy, String role) {
  if (role == 'SELLER') return copy.sellerWorkspace;
  if (role == 'INSPECTOR') return copy.inspectorWorkspace;
  return copy.buyerWorkspace;
}
