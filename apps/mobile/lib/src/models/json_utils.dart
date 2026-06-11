Map<String, dynamic> asMap(dynamic json) {
  return (json as Map).cast<String, dynamic>();
}

List<Map<String, dynamic>> asMapList(dynamic json) {
  return (json as List)
      .map((value) => (value as Map).cast<String, dynamic>())
      .toList(growable: false);
}

String asString(Map<String, dynamic> json, String key) {
  return json[key]?.toString() ?? '';
}

String? asNullableString(Map<String, dynamic> json, String key) {
  final value = json[key];
  if (value == null) {
    return null;
  }
  final text = value.toString();
  return text.isEmpty ? null : text;
}

int asInt(Map<String, dynamic> json, String key) {
  final value = json[key];
  if (value is int) {
    return value;
  }
  if (value is num) {
    return value.toInt();
  }
  return int.parse(value.toString());
}

double asDouble(Map<String, dynamic> json, String key) {
  final value = json[key];
  if (value is double) {
    return value;
  }
  if (value is num) {
    return value.toDouble();
  }
  return double.parse(value.toString());
}

bool asBool(Map<String, dynamic> json, String key) {
  final value = json[key];
  if (value is bool) {
    return value;
  }
  return value.toString().toLowerCase() == 'true';
}

List<String> asStringList(Map<String, dynamic> json, String key) {
  final value = json[key];
  if (value is! List) {
    return const [];
  }
  return value.map((item) => item.toString()).toList(growable: false);
}
