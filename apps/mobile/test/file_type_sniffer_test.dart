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

  test('detects png files with the full magic signature', () {
    final type = FileTypeSniffer.sniff(
      Uint8List.fromList(const [
        0x89,
        0x50,
        0x4e,
        0x47,
        0x0d,
        0x0a,
        0x1a,
        0x0a,
        0x00,
      ]),
    );

    expect(type?.contentType, 'image/png');
    expect(type?.isImage, isTrue);
  });

  test('rejects partial png signatures', () {
    final type = FileTypeSniffer.sniff(
      Uint8List.fromList(const [0x89, 0x50, 0x4e, 0x47, 0x00]),
    );

    expect(type, isNull);
  });

  test('rejects partial pdf signatures', () {
    final type = FileTypeSniffer.sniff(Uint8List.fromList('%PDF'.codeUnits));

    expect(type, isNull);
  });

  test('returns null for unsupported bytes', () {
    final type = FileTypeSniffer.sniff(
      Uint8List.fromList(const [0x01, 0x02, 0x03, 0x04]),
    );

    expect(type, isNull);
  });
}
