import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class AutoIqLocalizations {
  const AutoIqLocalizations(this.locale);

  final Locale locale;

  static const delegate = _AutoIqLocalizationsDelegate();
  static const _previewLocalesEnabled = bool.fromEnvironment(
    'AUTO_IQ_ENABLE_PREVIEW_LOCALES',
  );
  static const productionLocales = [Locale('en', 'ZW')];
  static const previewLocales = [
    Locale('en', 'ZW'),
    Locale('sn', 'ZW'),
    Locale('ar'),
  ];

  static List<Locale> get supportedLocales => localesFor(
        isReleaseMode: kReleaseMode,
        previewEnabled: _previewLocalesEnabled,
      );

  static List<Locale> localesFor({
    required bool isReleaseMode,
    required bool previewEnabled,
  }) {
    return !isReleaseMode || previewEnabled
        ? previewLocales
        : productionLocales;
  }

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
  String get filters => _read('filters');
  String get clearSearch => _read('clearSearch');
  String get closeFilters => _read('closeFilters');
  String get applyFilters => _read('applyFilters');
  String get back => _read('back');
  String get next => _read('next');
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
  String get verifiedOnly => _read('verifiedOnly');
  String get vehicleFilterStep => _read('vehicleFilterStep');
  String get vehicleFilterStepDescription =>
      _read('vehicleFilterStepDescription');
  String get budgetFilterStep => _read('budgetFilterStep');
  String get budgetFilterStepDescription =>
      _read('budgetFilterStepDescription');
  String get usageFilterStep => _read('usageFilterStep');
  String get usageFilterStepDescription => _read('usageFilterStepDescription');
  String get locationFilterStep => _read('locationFilterStep');
  String get locationFilterStepDescription =>
      _read('locationFilterStepDescription');
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
  String get sessionUnavailable => _read('sessionUnavailable');
  String get sessionUnavailableMessage => _read('sessionUnavailableMessage');
  String get agreementsTitle => _read('agreementsTitle');
  String get agreementsDescription => _read('agreementsDescription');
  String get acceptAndContinue => _read('acceptAndContinue');
  String get savingAgreements => _read('savingAgreements');
  String get reviewAgreement => _read('reviewAgreement');
  String get agreementVersion => _read('agreementVersion');
  String get termsConsent => _read('termsConsent');
  String get privacyConsent => _read('privacyConsent');
  String get buyerRulesConsent => _read('buyerRulesConsent');
  String get sellerRulesConsent => _read('sellerRulesConsent');
  String get noSideDealConsent => _read('noSideDealConsent');
  String get consentReviewNotice => _read('consentReviewNotice');
  String get scoreIncomplete => _read('scoreIncomplete');
  String get findingUnrated => _read('findingUnrated');
  String get pass => _read('pass');
  String get watch => _read('watch');
  String get fail => _read('fail');
  String get confirmReportTitle => _read('confirmReportTitle');
  String get confirmReportMessage => _read('confirmReportMessage');
  String get confirmSubmit => _read('confirmSubmit');
  String get discardReportTitle => _read('discardReportTitle');
  String get discardReportMessage => _read('discardReportMessage');
  String get discardChanges => _read('discardChanges');
  String get notRoadworthy => _read('notRoadworthy');

  String text(String key) => _read(key);

  String formatText(String key, Map<String, Object> values) {
    return values.entries.fold(
      _read(key),
      (message, entry) =>
          message.replaceAll('{${entry.key}}', '${entry.value}'),
    );
  }

  String consentLabel(String type) {
    switch (type) {
      case 'TERMS':
        return termsConsent;
      case 'PRIVACY':
        return privacyConsent;
      case 'BUYER_RULES':
        return buyerRulesConsent;
      case 'SELLER_RULES':
        return sellerRulesConsent;
      default:
        return noSideDealConsent;
    }
  }

  String filterStep(int current, int total) {
    return _read('filterStep')
        .replaceAll('{current}', '$current')
        .replaceAll('{total}', '$total');
  }

  String filtersApplied(int count) {
    return Intl.plural(
      count,
      one: _read('filterCountOne'),
      other: _read('filterCountOther').replaceAll('{count}', '$count'),
      locale: locale.toLanguageTag(),
      name: 'filtersApplied',
      args: [count],
    );
  }

  String removeFilter(String label) {
    return _read('removeFilter').replaceAll('{label}', label);
  }

  String filterValue(String label, String value) {
    return _read('filterValue')
        .replaceAll('{label}', label)
        .replaceAll('{value}', value);
  }

  String minimumFilterValue(String value) {
    return _read('minimumFilterValue').replaceAll('{value}', value);
  }

  String maximumFilterValue(String value) {
    return _read('maximumFilterValue').replaceAll('{value}', value);
  }

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
    final fallback = _messages['en']![key] ?? _polishMessages[key];
    assert(fallback != null, 'Missing localization key: $key');
    return languageMessages[key] ?? fallback ?? key;
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
    'filters': 'Filters',
    'clearSearch': 'Clear search',
    'closeFilters': 'Close filters',
    'applyFilters': 'Apply filters',
    'back': 'Back',
    'next': 'Next',
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
    'verifiedOnly': 'Verified vehicles only',
    'vehicleFilterStep': 'Choose the vehicle',
    'vehicleFilterStepDescription':
        'Start with a make, then narrow the model and body type.',
    'budgetFilterStep': 'Set budget and year',
    'budgetFilterStepDescription': 'Choose only the limits that matter to you.',
    'usageFilterStep': 'Refine usage and specs',
    'usageFilterStepDescription':
        'Narrow mileage, transmission, and fuel type.',
    'locationFilterStep': 'Choose location and trust',
    'locationFilterStepDescription':
        'Finish with a location and optional verified-only results.',
    'filterStep': 'Step {current} of {total}',
    'filterCountOne': '1 filter applied',
    'filterCountOther': '{count} filters applied',
    'removeFilter': 'Remove {label}',
    'filterValue': '{label}: {value}',
    'minimumFilterValue': 'From {value}',
    'maximumFilterValue': 'Up to {value}',
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
    'sessionUnavailable': 'We could not check your session',
    'sessionUnavailableMessage':
        'Your account has not been signed out. Check your connection and try again.',
    'agreementsTitle': 'Review your agreements',
    'agreementsDescription':
        'Review and accept each agreement required for your marketplace role.',
    'acceptAndContinue': 'Accept and continue',
    'savingAgreements': 'Saving agreements…',
    'reviewAgreement': 'Review',
    'agreementVersion': 'Agreement version 1.0.0',
    'termsConsent': 'I accept the platform terms of use.',
    'privacyConsent':
        'I accept the privacy notice and account data handling terms.',
    'buyerRulesConsent':
        'I accept the buyer quote, viewing, and marketplace rules.',
    'sellerRulesConsent':
        'I accept the seller listing, inspection, and moderation rules.',
    'noSideDealConsent': 'I agree not to bypass the platform for side deals.',
    'consentReviewNotice':
        'This summary identifies the agreement being recorded. The approved terms and privacy notice remain the controlling documents.',
    'scoreIncomplete': 'Complete all findings to calculate the score',
    'findingUnrated': 'Not rated',
    'pass': 'Pass',
    'watch': 'Watch',
    'fail': 'Fail',
    'confirmReportTitle': 'Submit this inspection report?',
    'confirmReportMessage':
        'The ratings, evidence, roadworthiness decision, and summary will be sent for review.',
    'confirmSubmit': 'Submit report',
    'discardReportTitle': 'Discard inspection changes?',
    'discardReportMessage':
        'Your ratings, notes, and unsubmitted evidence selections will be lost.',
    'discardChanges': 'Discard changes',
    'notRoadworthy': 'Vehicle is not roadworthy',
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
    'filters': 'Mafirita',
    'clearSearch': 'Bvisa zvatsvagwa',
    'closeFilters': 'Vhara mafirita',
    'applyFilters': 'Shandisa mafirita',
    'back': 'Kudzoka',
    'next': 'Enderera',
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
    'verifiedOnly': 'Mota dzakasimbiswa chete',
    'vehicleFilterStep': 'Sarudza mota',
    'vehicleFilterStepDescription':
        'Tanga nemugadziri, wozosarudza mhando nerudzi rwemota.',
    'budgetFilterStep': 'Sarudza bhajeti negore',
    'budgetFilterStepDescription': 'Sarudza miganhu ine basa kwauri chete.',
    'usageFilterStep': 'Sarudza makiromita nezvimiro',
    'usageFilterStepDescription':
        'Sarudza makiromita, magiyabhokisi, nerudzi rwemafuta.',
    'locationFilterStep': 'Sarudza nzvimbo nekusimbiswa',
    'locationFilterStepDescription':
        'Pedzisa nenzvimbo uye mota dzakasimbiswa chete kana uchida.',
    'filterStep': 'Danho {current} pa{total}',
    'filterCountOne': 'Firita 1 yashandiswa',
    'filterCountOther': 'Mafirita {count} ashandiswa',
    'removeFilter': 'Bvisa {label}',
    'filterValue': '{label}: {value}',
    'minimumFilterValue': 'Kubva {value}',
    'maximumFilterValue': 'Kusvika {value}',
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
    'filters': 'عوامل التصفية',
    'clearSearch': 'مسح البحث',
    'closeFilters': 'إغلاق عوامل التصفية',
    'applyFilters': 'تطبيق عوامل التصفية',
    'back': 'رجوع',
    'next': 'التالي',
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
    'verifiedOnly': 'المركبات الموثقة فقط',
    'vehicleFilterStep': 'اختر المركبة',
    'vehicleFilterStepDescription': 'ابدأ بالصانع، ثم حدّد الطراز ونوع الهيكل.',
    'budgetFilterStep': 'حدّد الميزانية والسنة',
    'budgetFilterStepDescription': 'اختر الحدود المهمة لك فقط.',
    'usageFilterStep': 'حدّد الاستخدام والمواصفات',
    'usageFilterStepDescription': 'حدّد المسافة وناقل الحركة ونوع الوقود.',
    'locationFilterStep': 'اختر الموقع والتوثيق',
    'locationFilterStepDescription':
        'اختم بالموقع، واختر المركبات الموثقة فقط إن رغبت.',
    'filterStep': 'الخطوة {current} من {total}',
    'filterCountOne': 'تم تطبيق عامل تصفية واحد',
    'filterCountOther': 'تم تطبيق {count} عوامل تصفية',
    'removeFilter': 'إزالة {label}',
    'filterValue': '{label}: {value}',
    'minimumFilterValue': 'من {value}',
    'maximumFilterValue': 'حتى {value}',
    'clear': 'مسح',
    'search': 'بحث',
    'vehicleCountOne': 'مركبة واحدة',
    'vehicleCountOther': '{count} مركبات',
  },
};

const _polishMessages = <String, String>{
  'close': 'Close',
  'refresh': 'Refresh',
  'loading': 'Loading',
  'checkingSession': 'Checking session',
  'loadingInspection': 'Loading inspection',
  'somethingWentWrong': 'Something went wrong',
  'continueAction': 'Continue',
  'submit': 'Submit',
  'tryAgain': 'Try again',
  'vehicleRequestTitle': 'Request a vehicle',
  'vehicleRequestDescription': 'Only the maximum budget is required.',
  'maxBudgetUsd': 'Max budget (USD)',
  'modelOptional': 'Model (optional)',
  'noMakePreference': 'No make preference',
  'noPreference': 'No preference',
  'yearMin': 'Year min',
  'yearMax': 'Year max',
  'yearRangeError': 'Minimum year cannot exceed maximum.',
  'maxOdometerKm': 'Max odometer (km)',
  'urgency': 'Urgency',
  'asap': 'ASAP',
  'withinOneMonth': 'Within one month',
  'stillBrowsing': 'Still browsing',
  'notesOptional': 'Notes (optional)',
  'createRequest': 'Create request',
  'quoteRequestTitle': 'Request a quote',
  'sendQuoteRequest': 'Send quote request',
  'offerPriceUsd': 'Offer price (USD)',
  'paymentPlan': 'Payment plan',
  'fullCash': 'Full cash',
  'bankTransfer': 'Bank transfer',
  'other': 'Other',
  'messageOptional': 'Message (optional)',
  'viewingRequestTitle': 'Request a viewing',
  'preferredDate': 'Preferred date',
  'preferredTime': 'Preferred time',
  'viewingLocation': 'Viewing location',
  'chooseViewingLocation': 'Choose a viewing location.',
  'noteOptional': 'Note (optional)',
  'vehicleDetail': 'Vehicle detail',
  'saveVehicle': 'Save vehicle',
  'removeSavedVehicle': 'Remove saved vehicle',
  'vehicleUnavailable': 'Vehicle unavailable',
  'pleaseTryAgain': 'Please try again.',
  'loadingVehicleDetails': 'Loading vehicle details',
  'vehicleSaved': 'Vehicle saved.',
  'vehicleRemovedSaved': 'Vehicle removed from Saved.',
  'quoteSent': 'Quote request sent.',
  'viewingRequested': 'Viewing requested.',
  'openFullScreenGallery': 'Open full-screen gallery.',
  'vehiclePhotos': '{count} vehicle photos',
  'photoOf': '{title} photo {current} of {total}',
  'imagePosition': '{current} / {total}',
  'imagePositionOf': '{current} of {total}',
  'negotiable': 'Negotiable',
  'fixedAskingPrice': 'Fixed asking price',
  'daysListed': '{count} days listed',
  'inspectionSummary': 'Buyer-safe inspection summary',
  'needsAttention': 'Needs attention',
  'inspectionCompleted': 'Inspection completed.',
  'allFindings': 'All findings ({count})',
  'fuel': 'Fuel',
  'drive': 'Drive',
  'colour': 'Colour',
  'sellerDisclosure': 'Seller disclosure',
  'quote': 'Quote',
  'viewing': 'Viewing',
  'newListing': 'New listing',
  'editListing': 'Edit listing',
  'vehicleOptionsUnavailable': 'Vehicle options unavailable',
  'vehicleOptionsUnavailableMessage':
      'Refresh your profile before editing a listing.',
  'listingUnavailable': 'Listing unavailable',
  'loadingListingDraft': 'Loading listing draft',
  'specifications': 'Vehicle specifications',
  'specificationsDescription': 'Describe the vehicle buyers will inspect.',
  'accidentHistory': 'Accident history',
  'accidentNote': 'Accident note',
  'pricing': 'Pricing',
  'pricingDescription': 'Set a clear asking price before adding media.',
  'askPriceUsd': 'Ask price (USD)',
  'priceNegotiable': 'Price is negotiable',
  'photos': 'Photos',
  'photosDescription':
      'Upload at least three photos, choose a cover, and drag to reorder.',
  'noPhotos': 'No photos yet',
  'noPhotosMessage': 'Add clear exterior and interior vehicle photos.',
  'addPhotos': 'Add photos',
  'documents': 'Documents',
  'documentsDescription':
      'Required ownership files remain private and are reviewed by the team.',
  'documentType': 'Document type',
  'addDocument': 'Add document',
  'noDocuments': 'No documents yet',
  'noDocumentsMessage': 'Upload the three required ownership documents.',
  'reviewAndSubmit': 'Review and submit',
  'reviewDescription': 'Resolve every checklist item before review.',
  'disclosurePrompt': 'Ownership, service history, and known issues',
  'noTimeline': 'No timeline history',
  'noTimelineMessage': 'Status changes will appear after the draft is saved.',
  'timelineUnavailable': 'Timeline unavailable',
  'loadingTimeline': 'Loading timeline',
  'saveAndExit': 'Save & Exit',
  'stepSpecs': 'Specs',
  'stepReview': 'Review',
  'submitForReview': 'Submit for review',
  'draftSaved': 'Draft saved.',
  'completeBeforeUpload':
      'Complete specifications and pricing before uploading.',
  'photoLimit': 'Only 12 vehicle photos are allowed.',
  'photoTypeError': 'Use JPEG, PNG, or WebP photos.',
  'documentTypeError': 'Use a PDF, JPEG, or PNG document.',
  'readyToSubmit': 'Ready to submit',
  'readyToSubmitMessage': 'All listing requirements are complete.',
  'publishingReadiness': 'Publishing readiness',
  'timeline': 'Timeline',
  'submitListingTitle': 'Submit listing?',
  'submitListingMessage':
      'The listing will be locked while the team reviews it.',
  'leaveWithoutSaving': 'Leave without saving?',
  'leaveWithoutSavingMessage': 'Unsaved listing changes will be discarded.',
  'keepEditing': 'Keep editing',
  'discard': 'Discard',
  'cancelUploadsBeforeLeaving': 'Cancel active uploads before leaving.',
  'coverPhoto': 'Cover photo',
  'photoNumber': 'Photo {count}',
  'currentCoverPhoto': 'Current cover photo',
  'makeCoverPhoto': 'Make cover photo',
  'deletePhoto': 'Delete photo',
  'cancelUpload': 'Cancel upload',
  'retryUpload': 'Retry upload',
  'removeUploadItem': 'Remove upload item',
  'queued': 'Queued',
  'uploadingPercent': 'Uploading {percent} percent',
  'uploadFailed': 'Upload failed',
  'uploadCancelled': 'Upload cancelled',
  'uploadComplete': 'Upload complete',
  'makeLabel': 'Make',
  'modelLabel': 'Model',
  'yearLabel': 'Year',
  'colourLabel': 'Colour',
  'bodyTypeLabel': 'Body type',
  'fuelTypeLabel': 'Fuel type',
  'transmissionLabel': 'Transmission',
  'driveTypeLabel': 'Drive type',
  'conditionLabel': 'Condition',
  'engineOptional': 'Engine (optional)',
  'mileageKm': 'Mileage (km)',
  'askPriceLabel': 'Ask price',
  'useAtLeastCharacters': 'Use at least {count} characters.',
  'checkConnection': 'Check your connection and try again.',
  'deleteDocument': 'Delete {document}',
  'requiredSuffix': 'Required',
  'listingSubmitted': 'Listing submitted for review.',
  'listingStepOf': 'Listing step {current} of {total}',
  'listingPhoto': 'Listing photo {count}',
  'photoSizeLimit': '{name} exceeds the 10 MB photo limit.',
  'documentSizeLimit': '{name} exceeds the 15 MB document limit.',
  'readinessSaveSpecs': 'Save the vehicle specifications and pricing.',
  'readinessDisclosure': 'Add a seller disclosure of at least 20 characters.',
  'readinessPhotos': 'Upload at least 3 vehicle photos.',
  'readinessCover': 'Choose a cover photo.',
  'readinessDocuments': 'Upload required documents: {documents}.',
  'statusLabel': 'Status: {status}',
  'inspectionScoreLabel': 'Inspection score {score} out of 100',
  'loadingSellerDashboard': 'Loading seller dashboard',
  'listingsUnavailable': 'Listings unavailable',
  'listingsUnavailableMessage':
      'Refresh the dashboard after the API comes back.',
  'statsListings': 'Listings',
  'statsViews': 'Views',
  'statsQuotes': 'Quotes',
  'statsViewings': 'Viewings',
  'noListings': 'No listings yet',
  'noListingsMessage':
      'Create a draft, upload media, then submit it for review.',
  'editVehicle': 'Edit {title}',
  'vehicleCoverPhoto': '{title} cover photo',
  'updatedOn': 'Updated {date}',
  'loadingViewingRequests': 'Loading viewing requests',
  'maximumBudget': 'Maximum budget',
  'minimumYear': 'Minimum year',
  'maximumYear': 'Maximum year',
  'maximumOdometer': 'Maximum odometer',
  'offerPrice': 'Offer price',
  'searchingCatalogue': 'Searching the catalogue',
  'loadMoreVehicles': 'Load more vehicles',
  'loadingSavedVehicles': 'Loading saved vehicles',
  'savedVehiclesUnavailable': 'Saved vehicles unavailable',
  'noSavedVehicles': 'No saved vehicles',
  'noSavedVehiclesMessage': 'Bookmark listings from Browse to keep them here.',
  'needDifferentVehicle': 'Need a different vehicle?',
  'sourcingPitch':
      'Create a sourcing request and let the team look for a match.',
  'newAction': 'New',
  'quotesTitle': 'Quotes',
  'loadingQuoteRequests': 'Loading quote requests',
  'noQuoteRequests': 'No quote requests',
  'noQuoteRequestsMessage':
      'Quotes you send from listing detail will show here.',
  'offerUsd': 'Offer USD {amount}',
  'askUsdPlan': 'Ask USD {amount} · {plan}',
  'sourcingRequestsTitle': 'Sourcing requests',
  'loadingSourcingRequests': 'Loading sourcing requests',
  'noSourcingRequests': 'No sourcing requests',
  'noSourcingRequestsMessage':
      'Create one when you want the team to source a vehicle.',
  'anyMake': 'Any make',
  'budgetUsdUrgency': 'Budget USD {amount} · {urgency}',
  'loadingViewings': 'Loading viewings',
  'viewingsUnavailable': 'Viewings unavailable',
  'noViewingsScheduled': 'No viewings scheduled',
  'noViewingsScheduledMessage':
      'Confirmed and requested viewings will appear here.',
  'unableToLoadSection': 'Unable to load this section',
  'listingCardLabel': '{title}, {city}, USD {price}',
  'vehiclePhoto': '{title} vehicle photo',
  'welcomeBack': 'Welcome back',
  'createAccountTitle': 'Create your account',
  'registrationSubtitle':
      'Sign up to browse verified vehicles or list your own.',
  'signInSubtitle': 'Sign in to continue where you left off.',
  'signIn': 'Sign in',
  'register': 'Register',
  'emailOrPhone': 'Email or phone',
  'emailOrPhoneHint': 'you@example.com or +263...',
  'password': 'Password',
  'hidePassword': 'Hide password',
  'showPassword': 'Show password',
  'forgotPassword': 'Forgot password?',
  'email': 'Email',
  'phone': 'Phone',
  'phoneHelper': 'E.164 format, e.g. +263771234567',
  'rolePrompt': 'I want to',
  'buyerRoleOption': 'Browse and buy vehicles',
  'sellerRoleOption': 'List and sell a vehicle',
  'agreementsAfterVerification':
      'After verification, you will review each marketplace agreement before using your account.',
  'passwordHelper': 'Min 8 characters, mix of letters and numbers.',
  'confirmPassword': 'Confirm password',
  'passwordsMismatch': "Passwords don't match.",
  'createAccount': 'Create account',
  'confirmYourPassword': 'Confirm your password.',
  'required': 'Required',
  'registrationStep': 'Registration step {current} of {total}',
  'stepOf': 'Step {current} of {total}',
  'insecureEndpoint':
      'Talking to an insecure HTTP endpoint. Release builds require HTTPS.',
  'verifyAccount': 'Verify account',
  'enterOtp': 'Enter the 6-digit code',
  'otpSentDescription':
      'We sent an SMS to the phone tied to {identifier}. The code arrives in a few seconds — your keyboard may fill it in automatically.',
  'testOtpDescription':
      'This configured buyer test account uses an on-screen code. It expires after 5 minutes and works only once.',
  'otpCode': 'OTP code',
  'resendIn': 'Resend in {seconds}s',
  'sendCode': 'Send code',
  'verifyAndSignIn': 'Verify and sign in',
  'otpHelp':
      "Didn't receive it? Check your SMS after a minute, then tap Resend. Codes expire 5 minutes after they arrive.",
  'testOtpHelp':
      'Tap Use code to fill the field, then verify and sign in. Resend creates a new code.',
  'codeSent': 'Code sent. Check your SMS.',
  'testCodeGenerated': 'Test code generated. No SMS credit was used.',
  'testingCode': 'Testing code',
  'testingCodeLabel': 'Testing verification code {code}',
  'useCode': 'Use code',
  'bisellVerifiedLabel': 'BiSell Verified',
  'priceSemanticLabel': 'USD {amount}',
};
