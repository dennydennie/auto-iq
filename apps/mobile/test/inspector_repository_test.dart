import 'dart:typed_data';

import 'package:autoiq_mobile/src/core/files/file_type_sniffer.dart';
import 'package:autoiq_mobile/src/core/files/local_upload.dart';
import 'package:autoiq_mobile/src/core/network/api_client.dart';
import 'package:autoiq_mobile/src/models/inspector_models.dart';
import 'package:autoiq_mobile/src/repositories/inspector_repository.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('loads the signed-in inspector task queue with status filtering',
      () async {
    final api = _InspectorApiClient();

    final tasks = await InspectorRepository(api).tasks(status: 'SCHEDULED');

    expect(api.path, '/api/v1/inspectors/inspection-tasks');
    expect(api.query, {'page': 1, 'limit': 50, 'status': 'SCHEDULED'});
    expect(tasks.single.listing.title, '2021 Honda Vezel');
  });

  test('uploads evidence and submits the complete report with CSRF', () async {
    final api = _InspectorApiClient();
    final repository = InspectorRepository(api);
    final file = LocalUpload(
      bytes: Uint8List.fromList([0xFF, 0xD8, 0xFF, 0x00]),
      fileType: const SniffedFileType(
        contentType: 'image/jpeg',
        extension: 'jpg',
        isImage: true,
      ),
      name: 'engine.jpg',
    );

    final key =
        await repository.uploadFindingPhoto(taskId: 'task-1', file: file);
    await repository.submitReport(
      taskId: 'task-1',
      findings: requiredInspectionFindings
          .map((finding) => finding.copyWith(rating: 'PASS'))
          .toList(growable: false),
      inspectorNote: 'Safe with minor wear.',
      roadworthy: true,
    );

    expect(key, 'inspection/task-1/engine.jpg');
    expect(api.uploadedUrl, 'https://uploads.example/evidence');
    expect(
        api.lastPostPath, '/api/v1/inspectors/inspection-tasks/task-1/report');
    expect(api.lastPostCsrf, isTrue);
    expect((api.lastBody['findings'] as List), hasLength(6));
  });
}

class _InspectorApiClient extends Fake implements ApiClient {
  String? path;
  Map<String, dynamic>? query;
  String? lastPostPath;
  Map<String, dynamic> lastBody = {};
  bool lastPostCsrf = false;
  String? uploadedUrl;

  @override
  Future<T> getJson<T>(
    String path,
    T Function(dynamic json) parser, {
    Map<String, dynamic>? queryParameters,
  }) async {
    this.path = path;
    query = queryParameters;
    return parser({
      'data': [_taskJson],
      'meta': const {}
    });
  }

  @override
  Future<T> postJson<T>(
    String path,
    dynamic body,
    T Function(dynamic json) parser, {
    bool includeCsrf = false,
  }) async {
    lastPostPath = path;
    lastBody = (body as Map).cast<String, dynamic>();
    lastPostCsrf = includeCsrf;
    if (path.endsWith('/photos/presign')) {
      return parser({
        'uploadUrl': 'https://uploads.example/evidence',
        'storageKey': 'inspection/task-1/engine.jpg',
      });
    }
    return parser(_reportJson);
  }

  @override
  Future<void> uploadStream({
    required String url,
    required Stream<List<int>> Function() openRead,
    required int contentLength,
    required String contentType,
    ProgressCallback? onSendProgress,
    CancelToken? cancelToken,
  }) async {
    final bytes = await openRead().expand((chunk) => chunk).toList();
    expect(bytes, hasLength(contentLength));
    uploadedUrl = url;
  }
}

const _taskJson = {
  'id': 'task-1',
  'listingId': 'listing-1',
  'listingSnapshot': {
    'year': 2021,
    'make': 'Honda',
    'model': 'Vezel',
    'coverImageUrl': null,
    'city': 'Harare',
  },
  'status': 'SCHEDULED',
  'scheduledAt': '2026-08-15T09:00:00.000Z',
  'completedAt': null,
};

const _reportJson = {
  'id': 'report-1',
  'overallScore': 100,
  'roadworthy': true,
  'inspectorNote': 'Safe with minor wear.',
  'findings': <dynamic>[],
  'buyerSummaryApproved': false,
};
