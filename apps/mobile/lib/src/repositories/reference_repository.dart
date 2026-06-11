import '../core/config/api_routes.dart';
import '../core/network/api_client.dart';
import '../models/reference_data.dart';

class ReferenceRepository {
  ReferenceRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<ReferenceDataSet> load() {
    return _apiClient.getJson<ReferenceDataSet>(
      ApiRoutes.referenceData,
      (json) =>
          ReferenceDataSet.fromJson((json as Map).cast<String, dynamic>()),
    );
  }
}
