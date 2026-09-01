import 'package:dio/dio.dart';

import '../core/files/local_upload.dart';

enum SellerUploadState { queued, uploading, failed, cancelled, completed }

enum SellerUploadKind { image, document }

class SellerUploadTask {
  SellerUploadTask({
    required this.id,
    required this.file,
    required this.kind,
    this.slot,
    this.documentType,
  });

  final String id;
  final LocalUpload file;
  final SellerUploadKind kind;
  final String? slot;
  final String? documentType;
  SellerUploadState state = SellerUploadState.queued;
  double progress = 0;
  String? error;
  CancelToken cancelToken = CancelToken();

  bool get canCancel => state == SellerUploadState.uploading;
  bool get canRetry =>
      state == SellerUploadState.failed || state == SellerUploadState.cancelled;

  void prepareRetry() {
    cancelToken = CancelToken();
    state = SellerUploadState.queued;
    progress = 0;
    error = null;
  }
}
