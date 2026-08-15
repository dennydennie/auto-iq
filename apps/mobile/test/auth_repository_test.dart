import 'dart:typed_data';

import 'package:autoiq_mobile/src/core/network/api_client.dart';
import 'package:autoiq_mobile/src/repositories/auth_repository.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('forgot password identifies the mobile client', () async {
    final apiClient = _RecordingApiClient();
    final repository = AuthRepository(apiClient);

    await repository.forgotPassword(' Buyer@Example.com ');

    expect(apiClient.path, '/api/v1/auth/forgot-password');
    expect(apiClient.body, {
      'email': 'buyer@example.com',
      'client': 'MOBILE',
    });
  });

  test('reset password submits the native token and password', () async {
    final apiClient = _RecordingApiClient();
    final repository = AuthRepository(apiClient);

    await repository.resetPassword(
      token: 'reset-token',
      newPassword: 'Secure123',
    );

    expect(apiClient.path, '/api/v1/auth/reset-password');
    expect(apiClient.body, {
      'token': 'reset-token',
      'newPassword': 'Secure123',
    });
  });

  test('reset password submits the mobile email code and password', () async {
    final apiClient = _RecordingApiClient();
    final repository = AuthRepository(apiClient);

    await repository.resetPasswordWithCode(
      email: ' Buyer@Example.com ',
      code: '123456',
      newPassword: 'Secure123',
    );

    expect(apiClient.path, '/api/v1/auth/reset-password');
    expect(apiClient.body, {
      'email': 'buyer@example.com',
      'code': '123456',
      'newPassword': 'Secure123',
    });
  });

  test('returns an on-screen OTP supplied for a configured test account',
      () async {
    final apiClient = _RecordingApiClient(
      postResponse: {
        'expiresIn': 300,
        'attemptsRemaining': 2,
        'testOtpCode': '654321',
      },
    );
    final repository = AuthRepository(apiClient);

    final code = await repository.sendOtp(
      identifier: ' HenryGowas@Gmail.com ',
    );

    expect(code, '654321');
    expect(apiClient.path, '/api/v1/auth/otp/send');
    expect(apiClient.body, {'identifier': 'HenryGowas@Gmail.com'});
  });

  test('account deletion uses CSRF and clears the local session', () async {
    final apiClient = _RecordingApiClient();
    final repository = AuthRepository(apiClient);

    await repository.requestAccountDeletion();

    expect(apiClient.path, '/api/v1/me/account-deletion-requests');
    expect(apiClient.body, {'client': 'MOBILE'});
    expect(apiClient.includeCsrf, isTrue);
    expect(apiClient.sessionCleared, isTrue);
  });

  test('profile updates use PATCH with CSRF and preserve nullable clears',
      () async {
    final apiClient = _RecordingApiClient();
    final repository = AuthRepository(apiClient);
    final payload = {
      'fullName': 'Tariro Moyo',
      'city': 'Harare',
      'vehiclePurpose': null,
      'searchRadiusKm': null,
      'preferredFuelTypes': <String>[],
      'preferredTransmissions': <String>[],
      'budgetMin': null,
      'budgetMax': null,
    };

    await repository.updateProfile(payload);

    expect(apiClient.method, 'PATCH');
    expect(apiClient.path, '/api/v1/me');
    expect(apiClient.body, payload);
    expect(apiClient.includeCsrf, isTrue);
  });
}

class _RecordingApiClient implements ApiClient {
  _RecordingApiClient({this.postResponse});

  final dynamic postResponse;
  String? path;
  dynamic body;
  bool includeCsrf = false;
  bool sessionCleared = false;
  String? method;

  @override
  Future<T> postJson<T>(
    String path,
    dynamic body,
    T Function(dynamic json) parser, {
    bool includeCsrf = false,
  }) async {
    method = 'POST';
    this.path = path;
    this.body = body;
    this.includeCsrf = includeCsrf;
    return parser(postResponse);
  }

  @override
  Future<void> clearSession() async {
    sessionCleared = true;
  }

  @override
  Future<void> delete(String path, {bool includeCsrf = false}) =>
      throw UnimplementedError();

  @override
  Future<void> ensureCsrfToken() => throw UnimplementedError();

  @override
  Future<T> getJson<T>(
    String path,
    T Function(dynamic json) parser, {
    Map<String, dynamic>? queryParameters,
  }) =>
      throw UnimplementedError();

  @override
  Future<T> patchJson<T>(
    String path,
    dynamic body,
    T Function(dynamic json) parser, {
    bool includeCsrf = false,
  }) async {
    method = 'PATCH';
    this.path = path;
    this.body = body;
    this.includeCsrf = includeCsrf;
    return parser(_userResponse);
  }

  @override
  Future<T> putJson<T>(
    String path,
    dynamic body,
    T Function(dynamic json) parser, {
    bool includeCsrf = false,
  }) =>
      throw UnimplementedError();

  @override
  Future<void> uploadBinary({
    required String url,
    required Uint8List bytes,
    required String contentType,
  }) =>
      throw UnimplementedError();
}

const _userResponse = {
  'id': 'buyer-1',
  'fullName': 'Tariro Moyo',
  'email': 'buyer@example.com',
  'phone': '+263771234567',
  'city': 'Harare',
  'status': 'ACTIVE',
  'roles': ['BUYER'],
  'phoneVerified': true,
  'emailVerified': true,
  'buyerProfile': null,
  'sellerProfile': null,
};
