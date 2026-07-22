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
}

class _RecordingApiClient implements ApiClient {
  String? path;
  dynamic body;

  @override
  Future<T> postJson<T>(
    String path,
    dynamic body,
    T Function(dynamic json) parser, {
    bool includeCsrf = false,
  }) async {
    this.path = path;
    this.body = body;
    return parser(null);
  }

  @override
  Future<void> clearSession() => throw UnimplementedError();

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
  }) =>
      throw UnimplementedError();

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
