class ApiException implements Exception {
  ApiException({
    required this.message,
    required this.statusCode,
    this.code,
    this.correlationId,
    this.fieldErrors = const {},
  });

  final String message;
  final int statusCode;
  final String? code;
  final String? correlationId;
  final Map<String, List<String>> fieldErrors;

  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;
  bool get isNotFound => statusCode == 404;

  String? fieldError(String field) => fieldErrors[field]?.join('\n');

  String get supportMessage {
    final reference = correlationId?.trim();
    if (reference == null || reference.isEmpty) return message;
    return '$message\nReference: $reference';
  }

  factory ApiException.fromResponse(dynamic data, int statusCode) {
    if (data is! Map) return _fallback(statusCode);
    final map = data.cast<String, dynamic>();
    return ApiException(
      message: _message(map),
      statusCode: statusCode,
      code: map['code']?.toString(),
      correlationId: map['correlationId']?.toString(),
      fieldErrors: _fieldErrors(map['details']),
    );
  }

  @override
  String toString() => message;
}

ApiException _fallback(int statusCode) => ApiException(
      message: 'Request failed with status $statusCode.',
      statusCode: statusCode,
    );

String _message(Map<String, dynamic> data) {
  return data['message']?.toString() ??
      data['error']?.toString() ??
      'Request failed.';
}

Map<String, List<String>> _fieldErrors(dynamic details) {
  if (details is! List) return const {};
  final errors = <String, List<String>>{};
  for (final detail in details.whereType<Map>()) {
    final field = detail['field']?.toString();
    final message = detail['message']?.toString();
    if (field == null || message == null) continue;
    errors.putIfAbsent(field, () => []).add(message);
  }
  return Map.unmodifiable(errors);
}
