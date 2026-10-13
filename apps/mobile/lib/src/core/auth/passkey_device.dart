import 'package:flutter/foundation.dart';
import 'package:passkeys/authenticator.dart';
import 'package:passkeys/types.dart';

/// Why the phone did not hand back a passkey answer.
enum PasskeyProblem {
  /// The person closed the phone's passkey sheet.
  cancelled,

  /// The phone has no passkey for this app.
  noPasskey,

  /// The phone cannot store a passkey as it is: no screen lock, no Google
  /// account, or a version of Android without passkeys.
  notReady,

  /// Anything else.
  failed,
}

class PasskeyDeviceException implements Exception {
  const PasskeyDeviceException(this.problem);

  final PasskeyProblem problem;
}

/// The phone's part in passkeys: creating one and signing a challenge with
/// one, behind the screen lock. The requests and answers are the standard
/// WebAuthn JSON the server speaks, passed through untouched.
abstract interface class PasskeyDevice {
  /// Whether this phone can use passkeys at all.
  Future<bool> isSupported();

  Future<Map<String, dynamic>> create(Map<String, dynamic> options);

  Future<Map<String, dynamic>> signIn(Map<String, dynamic> options);
}

/// Passkeys through the phone's own credential manager.
class PlatformPasskeyDevice implements PasskeyDevice {
  PlatformPasskeyDevice({PasskeyAuthenticator? authenticator})
      : _authenticator = authenticator ?? PasskeyAuthenticator();

  final PasskeyAuthenticator _authenticator;

  @override
  Future<bool> isSupported() async {
    // Android only for now: on iPhone a passkey needs the app tied to the
    // website through an Apple developer account, which is not set up.
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) {
      return false;
    }
    try {
      final availability = await _authenticator.getAvailability().android();
      return availability.hasPasskeySupport;
    } catch (_) {
      return false;
    }
  }

  @override
  Future<Map<String, dynamic>> create(Map<String, dynamic> options) {
    return _guard(() async {
      final answer = await _authenticator.register(
        RegisterRequestType.fromJson(options),
      );
      return answer.toJson();
    });
  }

  @override
  Future<Map<String, dynamic>> signIn(Map<String, dynamic> options) {
    return _guard(() async {
      final answer = await _authenticator.authenticate(
        AuthenticateRequestType.fromJson(
          options,
          // Show the phone's own sheet at once, or say there is no passkey;
          // do not fall through to "use another device".
          preferImmediatelyAvailableCredentials: true,
        ),
      );
      return answer.toJson();
    });
  }

  Future<Map<String, dynamic>> _guard(
    Future<Map<String, dynamic>> Function() run,
  ) async {
    try {
      return await run();
    } on PasskeyAuthCancelledException {
      throw const PasskeyDeviceException(PasskeyProblem.cancelled);
    } on NoCredentialsAvailableException {
      throw const PasskeyDeviceException(PasskeyProblem.noPasskey);
    } on MissingGoogleSignInException {
      throw const PasskeyDeviceException(PasskeyProblem.notReady);
    } on SyncAccountNotAvailableException {
      throw const PasskeyDeviceException(PasskeyProblem.notReady);
    } on NoCreateOptionException {
      throw const PasskeyDeviceException(PasskeyProblem.notReady);
    } on DeviceNotSupportedException {
      throw const PasskeyDeviceException(PasskeyProblem.notReady);
    } on PasskeyUnsupportedException {
      throw const PasskeyDeviceException(PasskeyProblem.notReady);
    } catch (_) {
      throw const PasskeyDeviceException(PasskeyProblem.failed);
    }
  }
}
