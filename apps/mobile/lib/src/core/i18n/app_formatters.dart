import 'package:flutter/widgets.dart';
import 'package:intl/intl.dart';

class AppFormatters {
  AppFormatters._();

  static String decimal(BuildContext context, num value) {
    return NumberFormat.decimalPattern(_locale(context)).format(value);
  }

  static String shortDate(BuildContext context, DateTime value) {
    return DateFormat.yMMMd(_locale(context)).format(value);
  }

  static String dateTime(BuildContext context, DateTime value) {
    return DateFormat.yMMMd(_locale(context)).add_jm().format(value);
  }

  static String _locale(BuildContext context) {
    return Localizations.localeOf(context).toLanguageTag();
  }
}
