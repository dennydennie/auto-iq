import '../core/config/api_routes.dart';
import '../core/network/api_client.dart';
import '../models/app_user.dart';

class RegisterInput {
  RegisterInput({
    required this.fullName,
    required this.email,
    required this.phone,
    required this.password,
    required this.role,
    required this.city,
  });

  final String fullName;
  final String email;
  final String phone;
  final String password;
  final String role;
  final String city;
}

class RegisterResult {
  RegisterResult({
    required this.userId,
    required this.otpRequired,
  });

  final String userId;
  final bool otpRequired;

  factory RegisterResult.fromJson(dynamic json) {
    final map = (json as Map).cast<String, dynamic>();
    return RegisterResult(
      userId: map['userId']?.toString() ?? '',
      otpRequired: map['otpRequired'] == true,
    );
  }
}

class AuthRepository {
  AuthRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<RegisterResult> register(RegisterInput input) {
    return _apiClient.postJson<RegisterResult>(
      ApiRoutes.authRegister,
      {
        'fullName': input.fullName.trim(),
        'email': input.email.trim().toLowerCase(),
        'phone': input.phone.trim(),
        'password': input.password,
        'role': input.role,
        'city': input.city.trim(),
      },
      RegisterResult.fromJson,
    );
  }

  Future<void> login({
    required String identifier,
    required String password,
  }) async {
    await _apiClient.postJson<void>(
      ApiRoutes.authLogin,
      {
        'identifier': identifier.trim(),
        'password': password,
      },
      (_) {},
    );
  }

  Future<AppUser> me() {
    return _apiClient.getJson<AppUser>(
      ApiRoutes.meProfile,
      (json) => AppUser.fromJson((json as Map).cast<String, dynamic>()),
    );
  }

  Future<void> logout() async {
    await _apiClient.postJson<void>(
      ApiRoutes.authLogout,
      const {},
      (_) {},
      includeCsrf: true,
    );
    await _apiClient.clearSession();
  }

  Future<void> sendOtp({required String identifier, String? phone}) async {
    await _apiClient.postJson<void>(
      ApiRoutes.authSendOtp,
      {
        'identifier': identifier.trim(),
        if (phone != null && phone.trim().isNotEmpty) 'phone': phone.trim(),
      },
      (_) {},
    );
  }

  Future<void> verifyOtp({
    required String identifier,
    required String code,
    String? phone,
  }) async {
    await _apiClient.postJson<void>(
      ApiRoutes.authVerifyOtp,
      {
        'identifier': identifier.trim(),
        if (phone != null && phone.trim().isNotEmpty) 'phone': phone.trim(),
        'code': code.trim(),
      },
      (_) {},
    );
  }

  Future<AppUser> updateProfile(Map<String, dynamic> payload) {
    return _apiClient.patchJson<AppUser>(
      ApiRoutes.meProfile,
      payload,
      (json) => AppUser.fromJson((json as Map).cast<String, dynamic>()),
      includeCsrf: true,
    );
  }

  Future<void> recordConsent(String consentType) async {
    await _apiClient.postJson<void>(
      ApiRoutes.meConsents,
      {
        'consentType': consentType,
        'version': '1.0.0',
        'accepted': true,
      },
      (_) {},
      includeCsrf: true,
    );
  }
}
