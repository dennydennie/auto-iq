import 'dart:async';
import 'dart:typed_data';

import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:path_provider/path_provider.dart';

import '../config/app_config.dart';
import '../config/api_routes.dart';
import 'api_exception.dart';

class ApiClient {
  ApiClient._(this._dio, this._cookieJar);

  final Dio _dio;
  final PersistCookieJar _cookieJar;
  String? _csrfToken;

  static Future<ApiClient> create() async {
    final directory = await getApplicationSupportDirectory();
    final cookieJar = PersistCookieJar(
      ignoreExpires: false,
      storage: FileStorage('${directory.path}/cookies'),
    );
    final dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 30),
        headers: const {'Accept': 'application/json'},
        validateStatus: (status) => status != null && status < 500,
      ),
    );
    dio.interceptors.add(CookieManager(cookieJar));
    dio.interceptors.add(
      InterceptorsWrapper(
        onError: (error, handler) {
          if (error.type == DioExceptionType.badResponse) {
            handler.reject(
              DioException(
                requestOptions: error.requestOptions,
                response: error.response,
                error: _toApiException(error.response),
                type: error.type,
              ),
            );
            return;
          }
          handler.reject(
            DioException(
              requestOptions: error.requestOptions,
              error: ApiException(
                message:
                    'Network request failed. Check that the API is running.',
                statusCode: 0,
              ),
              type: error.type,
            ),
          );
        },
      ),
    );
    return ApiClient._(dio, cookieJar);
  }

  Future<T> getJson<T>(
    String path,
    T Function(dynamic json) parser, {
    Map<String, dynamic>? queryParameters,
  }) async {
    final response = await _dio.get<dynamic>(
      path,
      queryParameters: _clean(queryParameters),
    );
    _ensureSuccess(response);
    return parser(response.data);
  }

  Future<T> postJson<T>(
    String path,
    dynamic body,
    T Function(dynamic json) parser, {
    bool includeCsrf = false,
  }) async {
    final response = await _sendWithBody(
      'POST',
      path,
      body,
      includeCsrf: includeCsrf,
    );
    return parser(response.data);
  }

  Future<T> patchJson<T>(
    String path,
    dynamic body,
    T Function(dynamic json) parser, {
    bool includeCsrf = false,
  }) async {
    final response = await _sendWithBody(
      'PATCH',
      path,
      body,
      includeCsrf: includeCsrf,
    );
    return parser(response.data);
  }

  Future<T> putJson<T>(
    String path,
    dynamic body,
    T Function(dynamic json) parser, {
    bool includeCsrf = false,
  }) async {
    final response = await _sendWithBody(
      'PUT',
      path,
      body,
      includeCsrf: includeCsrf,
    );
    return parser(response.data);
  }

  Future<void> delete(String path, {bool includeCsrf = false}) async {
    final headers = await _headers(includeCsrf: includeCsrf);
    var response = await _dio.delete<dynamic>(
      path,
      options: Options(headers: headers),
    );
    if (includeCsrf && _shouldRetryWithFreshCsrf(response)) {
      _csrfToken = null;
      response = await _dio.delete<dynamic>(
        path,
        options: Options(headers: await _headers(includeCsrf: true)),
      );
    }
    _ensureSuccess(response);
  }

  Future<void> uploadBinary({
    required String url,
    required Uint8List bytes,
    required String contentType,
  }) async {
    final client = Dio(
      BaseOptions(
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 60),
      ),
    );
    final response = await client.put<dynamic>(
      url,
      data: Stream.fromIterable([bytes]),
      options: Options(
        headers: {'Content-Type': contentType, 'Content-Length': bytes.length},
        validateStatus: (status) => status != null && status < 500,
      ),
    );
    if ((response.statusCode ?? 500) >= 400) {
      throw ApiException(
        message: 'Upload failed with status ${response.statusCode}.',
        statusCode: response.statusCode ?? 500,
      );
    }
  }

  Future<void> ensureCsrfToken() async {
    if (_csrfToken != null) {
      return;
    }
    final response = await _dio.get<dynamic>(ApiRoutes.authCsrf);
    _ensureSuccess(response);
    final data = response.data;
    if (data is Map<String, dynamic>) {
      _csrfToken = data['token']?.toString();
    }
  }

  Future<void> clearSession() async {
    _csrfToken = null;
    await _cookieJar.deleteAll();
  }

  Future<Response<dynamic>> _sendWithBody(
    String method,
    String path,
    dynamic body, {
    required bool includeCsrf,
  }) async {
    final headers = await _headers(includeCsrf: includeCsrf);
    var response = await _dio.request<dynamic>(
      path,
      data: _cleanPayload(body),
      options: Options(method: method, headers: headers),
    );
    if (includeCsrf && _shouldRetryWithFreshCsrf(response)) {
      _csrfToken = null;
      response = await _dio.request<dynamic>(
        path,
        data: _cleanPayload(body),
        options: Options(
          method: method,
          headers: await _headers(includeCsrf: true),
        ),
      );
    }
    _ensureSuccess(response);
    return response;
  }

  Future<Map<String, dynamic>> _headers({required bool includeCsrf}) async {
    if (!includeCsrf) {
      return const {'Content-Type': 'application/json'};
    }
    await ensureCsrfToken();
    return {'Content-Type': 'application/json', 'X-CSRF-Token': _csrfToken};
  }

  void _ensureSuccess(Response<dynamic> response) {
    if ((response.statusCode ?? 500) >= 400) {
      throw _toApiException(response);
    }
  }

  bool _shouldRetryWithFreshCsrf(Response<dynamic> response) {
    if (response.statusCode != 403) {
      return false;
    }
    final data = response.data;
    if (data is! Map<String, dynamic>) {
      return false;
    }
    final code = data['code']?.toString().toUpperCase() ?? '';
    final message = data['message']?.toString().toLowerCase() ?? '';
    return code.contains('CSRF') || message.contains('csrf');
  }

  static ApiException _toApiException(Response<dynamic>? response) {
    final statusCode = response?.statusCode ?? 500;
    final data = response?.data;
    if (data is Map<String, dynamic>) {
      final message =
          data['message']?.toString() ??
          data['error']?.toString() ??
          'Request failed.';
      return ApiException(
        message: message,
        statusCode: statusCode,
        code: data['code']?.toString(),
      );
    }
    return ApiException(
      message: 'Request failed with status $statusCode.',
      statusCode: statusCode,
    );
  }

  static Map<String, dynamic>? _clean(Map<String, dynamic>? queryParameters) {
    if (queryParameters == null) {
      return null;
    }
    final clean = <String, dynamic>{};
    for (final entry in queryParameters.entries) {
      final value = entry.value;
      if (value == null) {
        continue;
      }
      if (value is String && value.trim().isEmpty) {
        continue;
      }
      clean[entry.key] = value;
    }
    return clean;
  }

  static dynamic _cleanPayload(dynamic value) {
    if (value is Map) {
      final clean = <String, dynamic>{};
      for (final entry in value.entries) {
        final key = entry.key?.toString();
        if (key == null || key.isEmpty) {
          continue;
        }
        final child = _cleanPayload(entry.value);
        if (child == null) {
          continue;
        }
        if (child is String && child.trim().isEmpty) {
          continue;
        }
        clean[key] = child;
      }
      return clean;
    }
    if (value is List) {
      return value.map(_cleanPayload).where((item) => item != null).toList();
    }
    return value;
  }
}
