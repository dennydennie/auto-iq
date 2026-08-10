import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import '../theme/app_theme.dart';
import 'core/i18n/app_localizations.dart';
import 'core/navigation/password_reset_link.dart';
import 'core/network/api_client.dart';
import 'repositories/auth_repository.dart';
import 'repositories/buyer_repository.dart';
import 'repositories/reference_repository.dart';
import 'repositories/seller_repository.dart';
import 'screens/auth/auth_screen.dart';
import 'screens/buyer/buyer_home_screen.dart';
import 'screens/seller/seller_home_screen.dart';
import 'state/session_controller.dart';

class AutoIqApp extends StatefulWidget {
  const AutoIqApp({
    super.key,
    required this.apiClient,
    this.locale,
  });

  final ApiClient apiClient;
  final Locale? locale;

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
        home: const _SessionGate(),
      ),
    );
  }
}

class _SessionGate extends StatelessWidget {
  const _SessionGate();

  @override
  Widget build(BuildContext context) {
    final copy = AutoIqLocalizations.of(context);
    return Consumer<SessionController>(
      builder: (context, session, _) {
        if (session.isBooting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        if (!session.isAuthenticated) {
          return const AuthScreen();
        }
        final user = session.user!;
        if (user.isSeller) {
          return const SellerHomeScreen();
        }
        if (user.isBuyer) {
          return const BuyerHomeScreen();
        }
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
      },
    );
  }
}
