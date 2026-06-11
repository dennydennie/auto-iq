import 'dart:typed_data';

import 'package:autoiq_mobile/src/core/files/file_type_sniffer.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('detects jpeg files', () {
    final type = FileTypeSniffer.sniff(
      Uint8List.fromList(const [0xff, 0xd8, 0xff, 0xe0]),
    );

    expect(type?.contentType, 'image/jpeg');
    expect(type?.isImage, isTrue);
  });

  test('detects pdf files', () {
    final type = FileTypeSniffer.sniff(
      Uint8List.fromList('%PDF-1.4'.codeUnits),
    );

    expect(type?.contentType, 'application/pdf');
    expect(type?.isImage, isFalse);
  });

  test('returns null for unsupported bytes', () {
    final type = FileTypeSniffer.sniff(
      Uint8List.fromList(const [0x01, 0x02, 0x03, 0x04]),
    );

    expect(type, isNull);
  });
}
