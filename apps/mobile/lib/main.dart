import 'package:flutter/services.dart';
import 'package:flutter/material.dart';

import 'src/app.dart';
import 'src/core/network/api_client.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  final apiClient = await ApiClient.create();
  runApp(AutoIqApp(apiClient: apiClient));
}
