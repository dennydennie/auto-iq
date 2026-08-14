import '../core/config/api_routes.dart';
import '../core/files/local_upload.dart';
import '../core/network/api_client.dart';
import '../models/inspector_models.dart';

class InspectorRepository {
  const InspectorRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<List<InspectionTask>> tasks({String? status}) {
    return _apiClient.getJson<List<InspectionTask>>(
      ApiRoutes.inspectorTasks,
      (json) => _parseTasks(json),
      queryParameters: {
        'page': 1,
        'limit': 50,
        if (status != null && status.isNotEmpty) 'status': status,
      },
    );
  }

  Future<InspectionTaskDetail> detail(String taskId) {
    return _apiClient.getJson<InspectionTaskDetail>(
      ApiRoutes.inspectorTask(taskId),
      (json) => InspectionTaskDetail.fromJson(
        (json as Map).cast<String, dynamic>(),
      ),
    );
  }

  Future<String> uploadFindingPhoto({
    required String taskId,
    required LocalUpload file,
  }) async {
    final presign = await _apiClient.postJson<Map<String, dynamic>>(
      ApiRoutes.inspectorPhotoPresign(taskId),
      {
        'contentType': file.fileType.contentType,
        'contentLength': file.bytes.length,
      },
      (json) => (json as Map).cast<String, dynamic>(),
      includeCsrf: true,
    );
    await _upload(file, presign);
    return presign['storageKey']?.toString() ?? '';
  }

  Future<InspectionReport> submitReport({
    required String taskId,
    required List<InspectionFindingDraft> findings,
    required String inspectorNote,
    required bool roadworthy,
  }) {
    return _apiClient.postJson<InspectionReport>(
      ApiRoutes.inspectorReport(taskId),
      {
        'findings': findings.map((finding) => finding.toJson()).toList(),
        'inspectorNote': inspectorNote.trim(),
        'roadworthy': roadworthy,
      },
      (json) => InspectionReport.fromJson(
        (json as Map).cast<String, dynamic>(),
      ),
      includeCsrf: true,
    );
  }

  Future<void> _upload(
    LocalUpload file,
    Map<String, dynamic> presign,
  ) {
    return _apiClient.uploadBinary(
      url: presign['uploadUrl']?.toString() ?? '',
      bytes: file.bytes,
      contentType: file.fileType.contentType,
    );
  }
}

List<InspectionTask> _parseTasks(dynamic json) {
  final data = ((json as Map)['data'] as List).cast<dynamic>();
  return data
      .map(
        (value) => InspectionTask.fromJson(
          (value as Map).cast<String, dynamic>(),
        ),
      )
      .toList(growable: false);
}
