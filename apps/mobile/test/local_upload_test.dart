import 'dart:typed_data';

import 'package:autoiq_mobile/src/core/files/file_type_sniffer.dart';
import 'package:autoiq_mobile/src/core/files/local_upload.dart';
import 'package:autoiq_mobile/src/core/network/api_client.dart';
import 'package:autoiq_mobile/src/repositories/seller_repository.dart';
import 'package:cross_file/cross_file.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('file inspection is bounded and the upload stream is replayable',
      () async {
    final bytes = Uint8List.fromList([
      0xFF,
      0xD8,
      0xFF,
      ...List<int>.generate(128, (index) => index % 255),
    ]);
    final file = _RecordingXFile(bytes);

    final upload = await LocalUpload.fromXFile(file);

    expect(upload, isNotNull);
    expect(upload!.length, bytes.length);
    expect(file.ranges.single, (0, 32));
    expect(await _collect(upload.openRead()), bytes);
    expect(await _collect(upload.openRead()), bytes);
    expect(file.ranges, [(0, 32), (null, null), (null, null)]);
  });

  test('unsupported signatures are rejected before upload', () async {
    final upload = await LocalUpload.fromXFile(
      _RecordingXFile(Uint8List.fromList(List.filled(64, 0x01))),
    );

    expect(upload, isNull);
  });

  test('seller upload streams bytes, reports progress, and registers media',
      () async {
    final api = _UploadApiClient();
    final bytes = Uint8List.fromList([0xFF, 0xD8, 0xFF, 0x01, 0x02]);
    final upload = LocalUpload(
      bytes: bytes,
      fileType: const SniffedFileType(
        contentType: 'image/jpeg',
        extension: 'jpg',
        isImage: true,
      ),
      name: 'front.jpg',
    );
    var progress = 0;

    await SellerRepository(api).uploadImage(
      listingId: 'listing-1',
      file: upload,
      slot: 'FRONT_THREE_QUARTER',
      isCover: true,
      onProgress: (sent, total) => progress = sent,
    );

    expect(api.uploadedBytes, bytes);
    expect(progress, bytes.length);
    expect(api.postPaths, [
      '/api/v1/storage/images/presign',
      '/api/v1/listings/listing-1/images',
    ]);
    expect(api.registrationBody['isCover'], isTrue);
    expect(api.registrationBody['contentLength'], bytes.length);
  });
}

class _RecordingXFile extends XFile {
  _RecordingXFile(this.bytes)
      : super.fromData(bytes, name: 'vehicle.jpg', mimeType: 'image/jpeg');

  final Uint8List bytes;
  final List<(int?, int?)> ranges = [];

  @override
  Future<int> length() async => bytes.length;

  @override
  Stream<Uint8List> openRead([int? start, int? end]) {
    ranges.add((start, end));
    return Stream.value(bytes.sublist(start ?? 0, end ?? bytes.length));
  }
}

class _UploadApiClient extends Fake implements ApiClient {
  final List<String> postPaths = [];
  Map<String, dynamic> registrationBody = {};
  Uint8List? uploadedBytes;

  @override
  Future<T> postJson<T>(
    String path,
    dynamic body,
    T Function(dynamic json) parser, {
    bool includeCsrf = false,
  }) async {
    postPaths.add(path);
    if (path.endsWith('/presign')) {
      return parser({
        'uploadUrl': 'https://uploads.example/front',
        'storageKey': 'listings/listing-1/front.jpg',
      });
    }
    registrationBody = (body as Map).cast<String, dynamic>();
    return parser(const {});
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
    uploadedBytes = Uint8List.fromList(await _collect(openRead()));
    onSendProgress?.call(contentLength, contentLength);
  }
}

Future<List<int>> _collect(Stream<List<int>> stream) {
  return stream.expand((chunk) => chunk).toList();
}
