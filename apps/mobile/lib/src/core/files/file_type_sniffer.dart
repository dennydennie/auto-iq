import 'dart:typed_data';

class SniffedFileType {
  const SniffedFileType({
    required this.contentType,
    required this.extension,
    required this.isImage,
  });

  final String contentType;
  final String extension;
  final bool isImage;
}

class FileTypeSniffer {
  static SniffedFileType? sniff(Uint8List bytes) {
    if (_startsWith(bytes, const [0xFF, 0xD8, 0xFF])) {
      return const SniffedFileType(
        contentType: 'image/jpeg',
        extension: 'jpg',
        isImage: true,
      );
    }
    if (_startsWith(bytes, const [0x89, 0x50, 0x4E, 0x47])) {
      return const SniffedFileType(
        contentType: 'image/png',
        extension: 'png',
        isImage: true,
      );
    }
    if (_startsWith(bytes, const [0x52, 0x49, 0x46, 0x46]) &&
        bytes.length >= 12 &&
        bytes[8] == 0x57 &&
        bytes[9] == 0x45 &&
        bytes[10] == 0x42 &&
        bytes[11] == 0x50) {
      return const SniffedFileType(
        contentType: 'image/webp',
        extension: 'webp',
        isImage: true,
      );
    }
    if (_startsWith(bytes, const [0x25, 0x50, 0x44, 0x46])) {
      return const SniffedFileType(
        contentType: 'application/pdf',
        extension: 'pdf',
        isImage: false,
      );
    }
    return null;
  }

  static bool _startsWith(Uint8List bytes, List<int> prefix) {
    if (bytes.length < prefix.length) {
      return false;
    }
    for (var index = 0; index < prefix.length; index += 1) {
      if (bytes[index] != prefix[index]) {
        return false;
      }
    }
    return true;
  }
}
