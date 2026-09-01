import 'dart:async';

import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';

import '../config/app_config.dart';
import '../config/api_routes.dart';
import 'api_exception.dart';

class ApiClient {
  ApiClient._(this._dio, this._cookieJar);

  final Dio _dio;
  final CookieJar _cookieJar;
  String? _csrfToken;
  Future<void>? _csrfInFlight;

  static Future<ApiClient> create() async {
    final cookieJar = await _createCookieJar();
    final dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 30),
        extra: const {'withCredentials': true},
        headers: const {
          'Accept': 'application/json',
        },
        validateStatus: (status) => status != null && status < 500,
      ),
    );
    if (!kIsWeb) dio.interceptors.add(CookieManager(cookieJar));
    // Unwrap Dio errors to raw ApiException so call sites can do
    //   try { … } on ApiException catch (e) { … }
    // without also handling DioException. Without this the network-error and
    // 5xx paths silently fall through to unhandled DioException in the UI.
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
                message: _networkErrorMessage(error),
                statusCode: 0,
                code: 'NETWORK_ERROR',
              ),
              type: error.type,
            ),
          );
        },
      ),
    );
    return ApiClient._(dio, cookieJar);
  }

  static Future<CookieJar> _createCookieJar() async {
    if (kIsWeb) return CookieJar();
    final directory = await getApplicationSupportDirectory();
    return PersistCookieJar(
      ignoreExpires: false,
      storage: FileStorage('${directory.path}/cookies'),
    );
  }

  /// Wraps a Dio call and re-throws the underlying ApiException so UI code
  /// only has to `catch on ApiException`. Without this shim, network errors
  /// and 5xx responses surface as DioException whose `.error` is the real
  /// ApiException — which no callsite currently handles.
  Future<Response<dynamic>> _dioCall(
    Future<Response<dynamic>> Function() call,
  ) async {
    try {
      return await call();
    } on DioException catch (error) {
      final wrapped = error.error;
      if (wrapped is ApiException) throw wrapped;
      throw ApiException(
        message: _networkErrorMessage(error),
        statusCode: 0,
        code: 'NETWORK_ERROR',
      );
    }
  }

  static String _networkErrorMessage(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return "The server took too long to respond. Check your connection and try again.";
      case DioExceptionType.connectionError:
        return "Can't reach the server. Check your internet connection.";
      case DioExceptionType.cancel:
        return "The request was cancelled.";
      case DioExceptionType.badCertificate:
        return "The server's security certificate isn't trusted. Update the app.";
      case DioExceptionType.badResponse:
      case DioExceptionType.unknown:
        return "Something went wrong reaching the server. Please try again.";
    }
  }

  Future<T> getJson<T>(
    String path,
    T Function(dynamic json) parser, {
    Map<String, dynamic>? queryParameters,
  }) async {
    final response = await _dioCall(() => _dio.get<dynamic>(
          path,
          queryParameters: _clean(queryParameters),
        ));
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
    final response = await _dioCall(() => _dio.delete<dynamic>(
          path,
          options: Options(headers: headers),
        ));
    _ensureSuccess(response);
  }

  Future<void> uploadBinary({
    required String url,
    required Uint8List bytes,
    required String contentType,
  }) async {
    return uploadStream(
      url: url,
      openRead: () => Stream.value(bytes),
      contentLength: bytes.length,
      contentType: contentType,
    );
  }

  Future<void> uploadStream({
    required String url,
    required Stream<List<int>> Function() openRead,
    required int contentLength,
    required String contentType,
    ProgressCallback? onSendProgress,
    CancelToken? cancelToken,
  }) async {
    final client = Dio(
      BaseOptions(
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 60),
      ),
    );
    final response = await _uploadRequest(
      client,
      url: url,
      openRead: openRead,
      contentLength: contentLength,
      contentType: contentType,
      onSendProgress: onSendProgress,
      cancelToken: cancelToken,
    );
    if ((response.statusCode ?? 500) >= 400) {
      throw ApiException(
        message: 'Upload failed with status ${response.statusCode}.',
        statusCode: response.statusCode ?? 500,
      );
    }
  }

  Future<Response<dynamic>> _uploadRequest(
    Dio client, {
    required String url,
    required Stream<List<int>> Function() openRead,
    required int contentLength,
    required String contentType,
    ProgressCallback? onSendProgress,
    CancelToken? cancelToken,
  }) async {
    try {
      return await client.put<dynamic>(
        url,
        data: openRead(),
        onSendProgress: onSendProgress,
        cancelToken: cancelToken,
        options: Options(
          headers: {
            'Content-Type': contentType,
            'Content-Length': contentLength,
          },
          validateStatus: (status) => status != null && status < 500,
        ),
      );
    } on DioException catch (error) {
      throw ApiException(
        message: _networkErrorMessage(error),
        statusCode: error.response?.statusCode ?? 0,
        code: error.type == DioExceptionType.cancel
            ? 'UPLOAD_CANCELLED'
            : 'UPLOAD_FAILED',
      );
    }
  }

  Future<void> ensureCsrfToken() async {
    if (_csrfToken != null) return;
    // Coalesce concurrent bootstraps so parallel mutations only fire one
    // /auth/csrf round-trip.
    _csrfInFlight ??= _fetchCsrfToken().whenComplete(() {
      _csrfInFlight = null;
    });
    await _csrfInFlight;
  }

  Future<void> _fetchCsrfToken() async {
    final response =
        await _dioCall(() => _dio.get<dynamic>(ApiRoutes.authCsrf));
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
    Response<dynamic> response = await _dioCall(() => _dio.request<dynamic>(
          path,
          data: body,
          options: Options(method: method, headers: headers),
        ));

    // Retry once on CSRF token rotation. Backend rotates the token on session
    // refresh; without this, every mutation after a rotation blows up 403.
    if (includeCsrf && response.statusCode == 403 && _csrfToken != null) {
      _csrfToken = null;
      final refreshedHeaders = await _headers(includeCsrf: includeCsrf);
      response = await _dioCall(() => _dio.request<dynamic>(
            path,
            data: body,
            options: Options(method: method, headers: refreshedHeaders),
          ));
    }

    _ensureSuccess(response);
    return response;
  }

  Future<Map<String, dynamic>> _headers({required bool includeCsrf}) async {
    if (!includeCsrf) {
      return const {'Content-Type': 'application/json'};
    }
    await ensureCsrfToken();
    return {
      'Content-Type': 'application/json',
      'X-CSRF-Token': _csrfToken,
    };
  }

  void _ensureSuccess(Response<dynamic> response) {
    if ((response.statusCode ?? 500) >= 400) {
      throw _toApiException(response);
    }
  }

  static ApiException _toApiException(Response<dynamic>? response) {
    final statusCode = response?.statusCode ?? 500;
    return ApiException.fromResponse(response?.data, statusCode);
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
}
