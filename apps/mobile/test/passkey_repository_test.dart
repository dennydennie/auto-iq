import 'package:autoiq_mobile/src/core/auth/passkey_device.dart';
import 'package:autoiq_mobile/src/core/network/api_client.dart';
import 'package:autoiq_mobile/src/repositories/passkey_repository.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('registration binds the answer to its challenge and uses CSRF',
      () async {
    final api = _PasskeyApi();
    final repository = PasskeyRepository(api, device: _Device());
    expect(await repository.create(label: 'My phone'), isTrue);
    expect(api.calls, [
      ('/api/v1/auth/passkeys/registration/options', true),
      ('/api/v1/auth/passkeys/registration/verify', true),
    ]);
    expect(api.lastBody, {
      'challengeId': 'challenge-1',
      'response': {'id': 'credential-1'},
      'label': 'My phone',
    });
  });

  test('cancelled native registration never verifies or creates a credential',
      () async {
    final api = _PasskeyApi();
    final repository = PasskeyRepository(api, device: _Device(cancel: true));
    expect(await repository.create(), isFalse);
    expect(api.calls, [('/api/v1/auth/passkeys/registration/options', true)]);
  });

  test('native login verifies the signed answer before reporting success',
      () async {
    final api = _PasskeyApi();
    expect(await PasskeyRepository(api, device: _Device()).signIn(), isTrue);
    expect(api.calls.last, ('/api/v1/auth/passkeys/login/verify', false));
    expect(api.lastBody['challengeId'], 'challenge-1');
  });

  test('Android passkeys stay unavailable without server association',
      () async {
    final api = _PasskeyApi();
    expect(
        await PasskeyRepository(api, device: _Device()).supported(), isFalse);
  });
}

class _Device implements PasskeyDevice {
  _Device({this.cancel = false});
  final bool cancel;
  @override
  Future<bool> isSupported() async => true;
  @override
  Future<Map<String, dynamic>> create(Map<String, dynamic> options) async {
    if (cancel) throw const PasskeyDeviceException(PasskeyProblem.cancelled);
    return {'id': 'credential-1'};
  }

  @override
  Future<Map<String, dynamic>> signIn(Map<String, dynamic> options) =>
      create(options);
}

class _PasskeyApi implements ApiClient {
  final calls = <(String, bool)>[];
  dynamic lastBody;
  @override
  Future<T> postJson<T>(String path, dynamic body, T Function(dynamic) parser,
      {bool includeCsrf = false}) async {
    calls.add((path, includeCsrf));
    lastBody = body;
    return parser(path.endsWith('/options')
        ? {'challengeId': 'challenge-1', 'options': <String, dynamic>{}}
        : <String, dynamic>{});
  }

  @override
  Future<T> getJson<T>(String path, T Function(dynamic) parser,
          {Map<String, dynamic>? queryParameters}) async =>
      parser({'android': false});
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
