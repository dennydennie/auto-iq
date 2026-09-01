abstract final class FormValidators {
  static String? requiredText(String? value, {String label = 'This field'}) {
    if (value == null || value.trim().isEmpty) return '$label is required.';
    return null;
  }

  static String? email(String? value) {
    final text = value?.trim() ?? '';
    final valid = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(text);
    return valid ? null : 'Enter a valid email address.';
  }

  static String? zimbabwePhone(String? value) {
    final text = value?.trim() ?? '';
    if (RegExp(r'^\+263\d{9,10}$').hasMatch(text)) return null;
    return 'Use +263 followed by 9 or 10 digits.';
  }

  static String? password(String? value) {
    final text = value ?? '';
    if (text.length < 8) return 'Use at least 8 characters.';
    if (!RegExp(r'[A-Za-z]').hasMatch(text) || !RegExp(r'\d').hasMatch(text)) {
      return 'Include at least one letter and one number.';
    }
    return null;
  }

  static String? integer(
    String? value, {
    required String label,
    int? minimum,
    int? maximum,
    bool optional = false,
  }) {
    final text = value?.trim() ?? '';
    if (optional && text.isEmpty) return null;
    final number = int.tryParse(text);
    if (number == null) return '$label must be a whole number.';
    return _rangeError(number, label, minimum, maximum);
  }

  static String? decimal(
    String? value, {
    required String label,
    double? minimum,
    double? maximum,
    bool optional = false,
  }) {
    final text = value?.trim() ?? '';
    if (optional && text.isEmpty) return null;
    final number = double.tryParse(text);
    if (number == null || !number.isFinite) return '$label must be a number.';
    return _rangeError(number, label, minimum, maximum);
  }

  static String? _rangeError(
    num number,
    String label,
    num? minimum,
    num? maximum,
  ) {
    if (minimum != null && number < minimum) {
      return '$label must be at least $minimum.';
    }
    if (maximum != null && number > maximum) {
      return '$label must be no more than $maximum.';
    }
    return null;
  }
}

int? optionalInt(String value) {
  final text = value.trim();
  return text.isEmpty ? null : int.tryParse(text);
}

double? optionalDouble(String value) {
  final text = value.trim();
  return text.isEmpty ? null : double.tryParse(text);
}
