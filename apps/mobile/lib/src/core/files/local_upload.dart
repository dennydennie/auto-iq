import 'dart:typed_data';

import 'file_type_sniffer.dart';

class LocalUpload {
  const LocalUpload({
    required this.bytes,
    required this.fileType,
    required this.name,
  });

  final Uint8List bytes;
  final SniffedFileType fileType;
  final String name;
}
