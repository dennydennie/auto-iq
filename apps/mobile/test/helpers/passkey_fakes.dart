import 'package:autoiq_mobile/src/repositories/passkey_repository.dart';
import 'package:flutter_test/flutter_test.dart';

class UnavailablePasskeys extends Fake implements PasskeyRepository {
  @override
  Future<bool> supported() async => false;
}
