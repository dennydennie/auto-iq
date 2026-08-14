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
  String get deleteAccount => _read('deleteAccount');
  String get deleteAccountDescription => _read('deleteAccountDescription');
  String get deleteAccountConfirmation => _read('deleteAccountConfirmation');
  String get requestAccountDeletion => _read('requestAccountDeletion');
  String get cancel => _read('cancel');
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
  String get yearFrom => _read('yearFrom');
  String get yearTo => _read('yearTo');
  String get anyYear => _read('anyYear');
  String get priceUsd => _read('priceUsd');
  String get mileage => _read('mileage');
  String get minimum => _read('minimum');
  String get maximum => _read('maximum');
  String get anyMinimum => _read('anyMinimum');
  String get anyMaximum => _read('anyMaximum');
  String get transmission => _read('transmission');
  String get anyTransmission => _read('anyTransmission');
  String get fuelType => _read('fuelType');
  String get anyFuelType => _read('anyFuelType');
  String get location => _read('location');
  String get allLocations => _read('allLocations');
  String get bodyType => _read('bodyType');
  String get allBodyTypes => _read('allBodyTypes');
  String get verified => _read('verified');
  String get clear => _read('clear');
  String get search => _read('search');
  String get chooseWorkspace => _read('chooseWorkspace');
  String get chooseWorkspaceDescription => _read('chooseWorkspaceDescription');
  String get buyerWorkspace => _read('buyerWorkspace');
  String get sellerWorkspace => _read('sellerWorkspace');
  String get inspectorWorkspace => _read('inspectorWorkspace');
  String get switchWorkspace => _read('switchWorkspace');
  String get dashboard => _read('dashboard');
  String get tasks => _read('tasks');
  String get fullName => _read('fullName');
  String get city => _read('city');
  String get businessName => _read('businessName');
  String get verifiedStatus => _read('verifiedStatus');
  String get notVerifiedStatus => _read('notVerifiedStatus');
  String get saveProfile => _read('saveProfile');
  String get profileUpdated => _read('profileUpdated');
  String get logout => _read('logout');
  String get fullNameRequired => _read('fullNameRequired');
  String get cityRequired => _read('cityRequired');
  String get assignedInspections => _read('assignedInspections');
  String get allStatuses => _read('allStatuses');
  String get inspectionsUnavailable => _read('inspectionsUnavailable');
  String get noInspectionTasks => _read('noInspectionTasks');
  String get noInspectionTasksMessage => _read('noInspectionTasksMessage');
  String get openTask => _read('openTask');
  String get notScheduled => _read('notScheduled');
  String get inspectionReport => _read('inspectionReport');
  String get computedScore => _read('computedScore');
  String get observationNote => _read('observationNote');
  String get addEvidencePhoto => _read('addEvidencePhoto');
  String get uploadingEvidence => _read('uploadingEvidence');
  String get inspectorSummary => _read('inspectorSummary');
  String get roadworthy => _read('roadworthy');
  String get submitInspectionReport => _read('submitInspectionReport');
  String get reportSubmitted => _read('reportSubmitted');
  String get awaitingAdminReview => _read('awaitingAdminReview');
  String get summaryApproved => _read('summaryApproved');
  String get viewingRequests => _read('viewingRequests');
  String get viewingRequestsUnavailable => _read('viewingRequestsUnavailable');
  String get noViewingRequests => _read('noViewingRequests');
  String get buyer => _read('buyer');
  String get acknowledgeRequest => _read('acknowledgeRequest');
  String get viewingAcknowledged => _read('viewingAcknowledged');

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
        'This mobile build supports buyer, seller, and inspector workflows.',
    'greeting': 'Hello, {name}',
    'refreshProfile': 'Refresh profile',
    'browse': 'Browse',
    'saved': 'Saved',
    'requests': 'Requests',
    'viewings': 'Viewings',
    'account': 'Account',
    'deleteAccount': 'Delete account',
    'deleteAccountDescription':
        'Request deletion of your AutoIQ account and associated personal data.',
    'deleteAccountConfirmation':
        'This sends a deletion request and signs you out. The team may contact you to verify account ownership.',
    'requestAccountDeletion': 'Send deletion request',
    'cancel': 'Cancel',
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
    'yearFrom': 'From',
    'yearTo': 'To',
    'anyYear': 'Any year',
    'priceUsd': 'Price (USD)',
    'mileage': 'Mileage',
    'minimum': 'Min',
    'maximum': 'Max',
    'anyMinimum': 'Any min',
    'anyMaximum': 'Any max',
    'transmission': 'Transmission',
    'anyTransmission': 'Any transmission',
    'fuelType': 'Fuel type',
    'anyFuelType': 'Any fuel type',
    'location': 'Location',
    'allLocations': 'All locations',
    'bodyType': 'Body type',
    'allBodyTypes': 'All body types',
    'verified': 'Verified',
    'clear': 'Clear',
    'search': 'Search',
    'vehicleCountOne': '1 vehicle',
    'vehicleCountOther': '{count} vehicles',
    'chooseWorkspace': 'Choose your workspace',
    'chooseWorkspaceDescription':
        'Open the tools for the role you are using right now.',
    'buyerWorkspace': 'Buyer',
    'sellerWorkspace': 'Seller',
    'inspectorWorkspace': 'Inspector',
    'switchWorkspace': 'Switch workspace',
    'dashboard': 'Dashboard',
    'tasks': 'Tasks',
    'fullName': 'Full name',
    'city': 'City',
    'businessName': 'Business name',
    'verifiedStatus': 'Verified',
    'notVerifiedStatus': 'Not verified',
    'saveProfile': 'Save profile',
    'profileUpdated': 'Profile updated.',
    'logout': 'Logout',
    'fullNameRequired': 'Full name is required.',
    'cityRequired': 'City is required.',
    'assignedInspections': 'Assigned inspections',
    'allStatuses': 'All statuses',
    'inspectionsUnavailable': 'Inspections unavailable',
    'noInspectionTasks': 'No inspection tasks',
    'noInspectionTasksMessage': 'No assigned tasks match the selected status.',
    'openTask': 'Open task',
    'notScheduled': 'Not scheduled',
    'inspectionReport': 'Inspection report',
    'computedScore': 'Computed score',
    'observationNote': 'Observation note',
    'addEvidencePhoto': 'Add evidence photo',
    'uploadingEvidence': 'Uploading evidence…',
    'inspectorSummary': 'Inspector summary',
    'roadworthy': 'Vehicle is roadworthy',
    'submitInspectionReport': 'Submit inspection report',
    'reportSubmitted': 'Inspection report submitted.',
    'awaitingAdminReview': 'Awaiting admin review',
    'summaryApproved': 'Summary approved',
    'viewingRequests': 'Viewing requests',
    'viewingRequestsUnavailable': 'Viewing requests unavailable',
    'noViewingRequests': 'No viewing requests',
    'buyer': 'Buyer',
    'acknowledgeRequest': 'Acknowledge request',
    'viewingAcknowledged': 'Viewing acknowledged.',
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
    'deleteAccount': 'Dzima akaundi',
    'deleteAccountDescription':
        'Kumbira kudzima akaundi yako yeAutoIQ nedata rako.',
    'deleteAccountConfirmation':
        'Izvi zvinotumira chikumbiro chekudzima uye zvinokuburitsa muakaundi. Chikwata chinogona kukubata kuti chisimbise kuti akaundi ndeyako.',
    'requestAccountDeletion': 'Tumira chikumbiro',
    'cancel': 'Kanzura',
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
    'yearFrom': 'Kubva',
    'yearTo': 'Kusvika',
    'anyYear': 'Gore ripi zvaro',
    'priceUsd': 'Mutengo (USD)',
    'mileage': 'Makiromita',
    'minimum': 'Pasi',
    'maximum': 'Pamusoro',
    'anyMinimum': 'Pasi pese',
    'anyMaximum': 'Pamusoro pese',
    'transmission': 'Magiyabhokisi',
    'anyTransmission': 'Magiyabhokisi ese',
    'fuelType': 'Rudzi rwemafuta',
    'anyFuelType': 'Mafuta ese',
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
    'deleteAccount': 'حذف الحساب',
    'deleteAccountDescription':
        'اطلب حذف حساب AutoIQ والبيانات الشخصية المرتبطة به.',
    'deleteAccountConfirmation':
        'سيؤدي هذا إلى إرسال طلب حذف وتسجيل خروجك. قد يتواصل معك الفريق للتحقق من ملكية الحساب.',
    'requestAccountDeletion': 'إرسال طلب الحذف',
    'cancel': 'إلغاء',
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
    'yearFrom': 'من',
    'yearTo': 'إلى',
    'anyYear': 'أي سنة',
    'priceUsd': 'السعر (دولار)',
    'mileage': 'المسافة المقطوعة',
    'minimum': 'الحد الأدنى',
    'maximum': 'الحد الأقصى',
    'anyMinimum': 'أي حد أدنى',
    'anyMaximum': 'أي حد أقصى',
    'transmission': 'ناقل الحركة',
    'anyTransmission': 'أي ناقل حركة',
    'fuelType': 'نوع الوقود',
    'anyFuelType': 'أي نوع وقود',
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
