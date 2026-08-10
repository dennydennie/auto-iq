import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class AutoIqLocalizations {
  const AutoIqLocalizations(this.locale);

  final Locale locale;

  static const delegate = _AutoIqLocalizationsDelegate();
  static const supportedLocales = [
    Locale('en', 'ZW'),
    Locale('sn', 'ZW'),
    Locale('ar'),
  ];

  static AutoIqLocalizations of(BuildContext context) {
    return Localizations.of<AutoIqLocalizations>(
            context, AutoIqLocalizations) ??
        const AutoIqLocalizations(Locale('en', 'ZW'));
  }

  static AutoIqLocalizations lookup(Locale locale) {
    final language =
        _messages.containsKey(locale.languageCode) ? locale.languageCode : 'en';
    return AutoIqLocalizations(Locale(language, locale.countryCode));
  }

  String get appName => _read('appName');
  String get unsupportedRole => _read('unsupportedRole');
  String greeting(String name) => _read('greeting').replaceAll('{name}', name);
  String get refreshProfile => _read('refreshProfile');
  String get browse => _read('browse');
  String get saved => _read('saved');
  String get requests => _read('requests');
  String get viewings => _read('viewings');
  String get account => _read('account');
  String get catalogueUnavailable => _read('catalogueUnavailable');
  String get catalogueUnavailableMessage =>
      _read('catalogueUnavailableMessage');
  String get retry => _read('retry');
  String get noPublishedVehicles => _read('noPublishedVehicles');
  String get noPublishedVehiclesMessage => _read('noPublishedVehiclesMessage');
  String get clearFilters => _read('clearFilters');
  String get searchHint => _read('searchHint');
  String get make => _read('make');
  String get allMakes => _read('allMakes');
  String get model => _read('model');
  String get allModels => _read('allModels');
  String get year => _read('year');
  String get anyYear => _read('anyYear');
  String get location => _read('location');
  String get allLocations => _read('allLocations');
  String get bodyType => _read('bodyType');
  String get allBodyTypes => _read('allBodyTypes');
  String get verified => _read('verified');
  String get clear => _read('clear');
  String get search => _read('search');

  String vehicleCount(int count) {
    return Intl.plural(
      count,
      one: _read('vehicleCountOne'),
      other: _read('vehicleCountOther').replaceAll('{count}', '$count'),
      locale: locale.toLanguageTag(),
      name: 'vehicleCount',
      args: [count],
    );
  }

  String _read(String key) {
    final languageMessages = _messages[locale.languageCode] ?? _messages['en']!;
    return languageMessages[key] ?? _messages['en']![key]!;
  }
}

class _AutoIqLocalizationsDelegate
    extends LocalizationsDelegate<AutoIqLocalizations> {
  const _AutoIqLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => AutoIqLocalizations.supportedLocales.any(
        (supported) => supported.languageCode == locale.languageCode,
      );

  @override
  Future<AutoIqLocalizations> load(Locale locale) =>
      SynchronousFuture(AutoIqLocalizations.lookup(locale));

  @override
  bool shouldReload(_AutoIqLocalizationsDelegate old) => false;
}

const _messages = <String, Map<String, String>>{
  'en': {
    'appName': 'BiSell AutoIQ',
    'unsupportedRole':
        'This mobile build is wired for buyer and seller workflows.',
    'greeting': 'Hello, {name}',
    'refreshProfile': 'Refresh profile',
    'browse': 'Browse',
    'saved': 'Saved',
    'requests': 'Requests',
    'viewings': 'Viewings',
    'account': 'Account',
    'catalogueUnavailable': 'Catalogue unavailable',
    'catalogueUnavailableMessage': 'Check the local API and refresh the app.',
    'retry': 'Retry',
    'noPublishedVehicles': 'No published vehicles',
    'noPublishedVehiclesMessage':
        'Seed a published listing or widen the current filters.',
    'clearFilters': 'Clear filters',
    'searchHint': 'Search by make, model, or city',
    'make': 'Make',
    'allMakes': 'All makes',
    'model': 'Model',
    'allModels': 'All models',
    'year': 'Year',
    'anyYear': 'Any year',
    'location': 'Location',
    'allLocations': 'All locations',
    'bodyType': 'Body type',
    'allBodyTypes': 'All body types',
    'verified': 'Verified',
    'clear': 'Clear',
    'search': 'Search',
    'vehicleCountOne': '1 vehicle',
    'vehicleCountOther': '{count} vehicles',
  },
  'sn': {
    'appName': 'BiSell AutoIQ',
    'unsupportedRole': 'App iyi yakagadzirirwa vatengi nevatengesi.',
    'greeting': 'Mhoro, {name}',
    'refreshProfile': 'Vandudza nhoroondo',
    'browse': 'Tsvaga',
    'saved': 'Zvakachengetwa',
    'requests': 'Zvikumbiro',
    'viewings': 'Kuona mota',
    'account': 'Akaundi',
    'catalogueUnavailable': 'Mota hadzisi kuwanikwa',
    'catalogueUnavailableMessage': 'Tarisa API wozovandudza app.',
    'retry': 'Edza zvakare',
    'noPublishedVehicles': 'Hapana mota dzakaburitswa',
    'noPublishedVehiclesMessage': 'Wedzera mota kana kuderedza mafirita.',
    'clearFilters': 'Bvisa mafirita',
    'searchHint': 'Tsvaga nemugadziri, mhando, kana guta',
    'make': 'Mugadziri',
    'allMakes': 'Vagadziri vese',
    'model': 'Mhando',
    'allModels': 'Mhando dzese',
    'year': 'Gore',
    'anyYear': 'Gore ripi zvaro',
    'location': 'Nzvimbo',
    'allLocations': 'Nzvimbo dzese',
    'bodyType': 'Rudzi rwemota',
    'allBodyTypes': 'Mhando dzese dzemiviri',
    'verified': 'Yakasimbiswa',
    'clear': 'Bvisa',
    'search': 'Tsvaga',
    'vehicleCountOne': 'Mota 1',
    'vehicleCountOther': 'Mota {count}',
  },
  'ar': {
    'appName': 'BiSell AutoIQ',
    'unsupportedRole': 'هذا التطبيق مخصص لمسارات المشترين والبائعين.',
    'greeting': 'مرحباً، {name}',
    'refreshProfile': 'تحديث الملف الشخصي',
    'browse': 'تصفح',
    'saved': 'المحفوظات',
    'requests': 'الطلبات',
    'viewings': 'المعاينات',
    'account': 'الحساب',
    'catalogueUnavailable': 'الكتالوج غير متاح',
    'catalogueUnavailableMessage': 'تحقق من واجهة API ثم حدّث التطبيق.',
    'retry': 'إعادة المحاولة',
    'noPublishedVehicles': 'لا توجد مركبات منشورة',
    'noPublishedVehiclesMessage': 'وسّع عوامل التصفية الحالية.',
    'clearFilters': 'مسح عوامل التصفية',
    'searchHint': 'ابحث حسب الصانع أو الطراز أو المدينة',
    'make': 'الصانع',
    'allMakes': 'كل الشركات',
    'model': 'الطراز',
    'allModels': 'كل الطرازات',
    'year': 'السنة',
    'anyYear': 'أي سنة',
    'location': 'الموقع',
    'allLocations': 'كل المواقع',
    'bodyType': 'نوع الهيكل',
    'allBodyTypes': 'كل أنواع الهيكل',
    'verified': 'موثقة',
    'clear': 'مسح',
    'search': 'بحث',
    'vehicleCountOne': 'مركبة واحدة',
    'vehicleCountOther': '{count} مركبات',
  },
};
