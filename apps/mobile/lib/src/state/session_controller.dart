import 'package:flutter/foundation.dart';

import '../core/network/api_exception.dart';
import '../models/app_user.dart';
import '../models/reference_data.dart';
import '../repositories/auth_repository.dart';
import '../repositories/reference_repository.dart';

class SessionController extends ChangeNotifier {
  SessionController({
    required AuthRepository authRepository,
    required ReferenceRepository referenceRepository,
  })  : _authRepository = authRepository,
        _referenceRepository = referenceRepository;

  final AuthRepository _authRepository;
  final ReferenceRepository _referenceRepository;

  AppUser? _user;
  ReferenceDataSet? _referenceData;
  bool _booting = true;
  bool _busy = false;
  String? _errorMessage;

  AppUser? get user => _user;
  ReferenceDataSet? get referenceData => _referenceData;
  bool get isBooting => _booting;
  bool get isBusy => _busy;
  bool get isAuthenticated => _user != null;
  String? get errorMessage => _errorMessage;

  Future<void> bootstrap() async {
    _booting = true;
    notifyListeners();
    try {
      await _hydrate();
    } on ApiException catch (error) {
      // 401 → not logged in → routed to auth screen with no error banner.
      // Anything else (network, 5xx) is treated as "unknown session, offline"
      // — surface a banner so the user knows why they were bounced back to
      // the auth screen.
      if (!error.isUnauthorized) {
        _errorMessage = error.code == 'NETWORK_ERROR'
            ? "We can't reach the server. Check your connection and try again."
            : error.message;
      }
      _user = null;
      _referenceData = null;
    } finally {
      _booting = false;
      notifyListeners();
    }
  }

  Future<void> login({
    required String identifier,
    required String password,
  }) async {
    await _runBusy(() async {
      await _authRepository.login(identifier: identifier, password: password);
      await _hydrate();
    });
  }

  Future<void> logout() async {
    await _runBusy(() async {
      await _authRepository.logout();
      _user = null;
      _referenceData = null;
    });
  }

  Future<void> refreshProfile() async {
    await _runBusy(_hydrate);
  }

  Future<void> updateProfile(Map<String, dynamic> payload) async {
    await _runBusy(() async {
      _user = await _authRepository.updateProfile(payload);
    });
  }

  Future<void> completeRequiredConsents() async {
    final user = _user;
    if (user == null) {
      return;
    }
    final consents = user.isSeller
        ? const ['TERMS', 'PRIVACY', 'SELLER_RULES', 'NO_SIDE_DEAL']
        : const ['TERMS', 'PRIVACY', 'BUYER_RULES', 'NO_SIDE_DEAL'];
    await _runBusy(() async {
      for (final consent in consents) {
        await _authRepository.recordConsent(consent);
      }
      _user = await _authRepository.me();
      _referenceData ??= await _referenceRepository.load();
    });
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  Future<void> _hydrate() async {
    // /me is authoritative — if it fails the session is dead. Reference data
    // is best-effort; a signed-in user with stale reference data is better
    // than being bounced back to the auth screen because the API blipped.
    final loadedUser = await _authRepository.me();
    _user = loadedUser;
    _errorMessage = null;
    try {
      _referenceData = await _referenceRepository.load();
    } on ApiException {
      // Keep whatever reference data we already have. UI callers should
      // handle a null referenceData gracefully.
    }
  }

  Future<void> _runBusy(Future<void> Function() action) async {
    _busy = true;
    _errorMessage = null;
    notifyListeners();
    try {
      await action();
    } on ApiException catch (error) {
      _errorMessage = error.message;
      rethrow;
    } finally {
      _busy = false;
      notifyListeners();
    }
  }
}
