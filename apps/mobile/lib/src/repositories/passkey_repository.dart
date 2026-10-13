import '../core/auth/passkey_device.dart';
import '../core/network/api_client.dart';
import '../core/network/api_exception.dart';

const _base = '/api/v1/auth/passkeys';

class PasskeyRepository {
  PasskeyRepository(this._api, {PasskeyDevice? device})
      : _device = device ?? PlatformPasskeyDevice();
  final ApiClient _api;
  final PasskeyDevice _device;

  Future<bool> supported() async {
    if (!await _device.isSupported()) return false;
    try {
      return await _api.getJson<bool>(
          '$_base/config', (data) => (data as Map)['android'] == true);
    } on ApiException {
      return false;
    }
  }

  Future<bool> signIn() async {
    final offered = await _options('login');
    final answer = await _answer(() => _device.signIn(offered['options']));
    if (answer == null) return false;
    await _verify('login', offered['challengeId'], answer);
    return true;
  }

  Future<bool> create({String? label}) async {
    final offered = await _options('registration', csrf: true);
    final answer = await _answer(() => _device.create(offered['options']));
    if (answer == null) return false;
    await _verify('registration', offered['challengeId'], answer,
        label: label, csrf: true);
    return true;
  }

  Future<List<Map<String, dynamic>>> list() => _api.getJson(
      _base,
      (value) => ((value as Map)['data'] as List)
          .map((item) => Map<String, dynamic>.from(item as Map))
          .toList());

  Future<void> remove(String id) =>
      _api.delete('$_base/$id', includeCsrf: true);

  Future<Map<String, dynamic>> _options(String kind, {bool csrf = false}) =>
      _api.postJson('$_base/$kind/options', const {},
          (data) => Map<String, dynamic>.from(data as Map),
          includeCsrf: csrf);

  Future<void> _verify(String kind, dynamic id, Map<String, dynamic> answer,
          {String? label, bool csrf = false}) =>
      _api.postJson<void>(
          '$_base/$kind/verify',
          {
            'challengeId': id,
            'response': answer,
            if (label != null) 'label': label
          },
          (_) {},
          includeCsrf: csrf);

  Future<Map<String, dynamic>?> _answer(
      Future<Map<String, dynamic>> Function() run) async {
    try {
      return await run();
    } on PasskeyDeviceException catch (error) {
      if (error.problem == PasskeyProblem.cancelled) return null;
      throw ApiException(
          message: '',
          statusCode: 0,
          code: error.problem == PasskeyProblem.notReady
              ? 'PASSKEY_DEVICE_NOT_READY'
              : 'PASSKEY_NOT_RECOGNISED');
    }
  }
}
