import 'dart:typed_data';

import 'package:cross_file/cross_file.dart';

import 'file_type_sniffer.dart';

typedef UploadStreamFactory = Stream<List<int>> Function();

class LocalUpload {
  factory LocalUpload({
    required Uint8List bytes,
    required SniffedFileType fileType,
    required String name,
  }) {
    return LocalUpload.stream(
      length: bytes.length,
      openRead: () => Stream.value(bytes),
      fileType: fileType,
      name: name,
    );
  }

  const LocalUpload.stream({
    required this.length,
    required this.openRead,
    required this.fileType,
    required this.name,
  });

  final int length;
  final UploadStreamFactory openRead;
  final SniffedFileType fileType;
  final String name;

  static Future<LocalUpload?> fromXFile(XFile file) async {
    final length = await file.length();
    if (length <= 0) return null;
    final signature = await _readSignature(file);
    final fileType = FileTypeSniffer.sniff(signature);
    if (fileType == null) return null;
    return LocalUpload.stream(
      length: length,
      openRead: file.openRead,
      fileType: fileType,
      name: file.name,
    );
  }
}

Future<Uint8List> _readSignature(XFile file) async {
  final bytes = BytesBuilder(copy: false);
  await for (final chunk in file.openRead(0, 32)) {
    bytes.add(chunk);
  }
  return bytes.takeBytes();
}
