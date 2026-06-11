class ApiRoutes {
  static const _base = '/api/v1';

  static const authRegister = '$_base/auth/register';
  static const authCsrf = '$_base/auth/csrf';
  static const authLogin = '$_base/auth/login';
  static const authLogout = '$_base/auth/logout';
  static const authSendOtp = '$_base/auth/otp/send';
  static const authVerifyOtp = '$_base/auth/otp/verify';

  static const meProfile = '$_base/me';
  static const meConsents = '$_base/me/consents';
  static const meSavedVehicles = '$_base/me/saved-vehicles';
  static const meQuotes = '$_base/me/quotes';
  static const meVehicleRequests = '$_base/me/vehicle-requests';
  static const meViewings = '$_base/me/viewings';
  static const meListings = '$_base/me/listings';

  static const referenceData = '$_base/reference-data';
  static const catalogue = '$_base/listings';
  static const vehicleRequests = '$_base/vehicle-requests';
  static const storageImagePresign = '$_base/storage/images/presign';
  static const storageDocumentPresign = '$_base/storage/documents/presign';

  static String savedVehicle(String listingId) =>
      '$_base/me/saved-vehicles/$listingId';

  static String catalogueDetail(String listingId) =>
      '$_base/listings/$listingId';

  static String inspectionSummary(String listingId) =>
      '$_base/listings/$listingId/inspection-summary';

  static String createQuote(String listingId) =>
      '$_base/listings/$listingId/quotes';

  static String createViewing(String listingId) =>
      '$_base/listings/$listingId/viewings';

  static String listingDetail(String listingId) => '$_base/listings/$listingId';

  static String listingSpecs(String listingId) =>
      '$_base/listings/$listingId/specs';

  static String listingPricing(String listingId) =>
      '$_base/listings/$listingId/pricing';

  static String listingImages(String listingId) =>
      '$_base/listings/$listingId/images';

  static String listingDocuments(String listingId) =>
      '$_base/listings/$listingId/documents';

  static String listingSubmit(String listingId) =>
      '$_base/listings/$listingId/submit';

  static String listingTimeline(String listingId) =>
      '$_base/listings/$listingId/timeline';
}
