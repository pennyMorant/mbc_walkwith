import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/life/data/annual_statement_file_service.dart';
import 'package:mbc_walkwith/features/life/domain/giving_record.dart';

void main() {
  test(
    'writes annual statement PDFs into a temporary statement file',
    () async {
      final tempDirectory = await Directory.systemTemp.createTemp(
        'annual_statement_file_service_test_',
      );
      addTearDown(() => tempDirectory.delete(recursive: true));
      final service = AnnualStatementFileService(
        temporaryDirectoryProvider: () async => tempDirectory,
      );
      final export = GivingStatementExport(
        filename: 'giving statement 2025.csv',
        contentType: 'text/csv',
        csv: 'statementId,mock',
        pdfBase64: base64Encode([37, 80, 68, 70]),
      );

      final file = await service.writePdf(export);

      expect(file.filename, 'mbc-giving-statement-giving_statement_2025.pdf');
      expect(file.path, contains(tempDirectory.path));
      expect(await File(file.path).readAsBytes(), [37, 80, 68, 70]);
    },
  );

  test('deletes only stale annual statement PDF files', () async {
    final tempDirectory = await Directory.systemTemp.createTemp(
      'annual_statement_cleanup_test_',
    );
    addTearDown(() => tempDirectory.delete(recursive: true));
    final now = DateTime(2026, 1, 10, 12);
    final service = AnnualStatementFileService(
      temporaryDirectoryProvider: () async => tempDirectory,
      clock: () => now,
    );
    final stale = File('${tempDirectory.path}/mbc-giving-statement-old.pdf')
      ..writeAsBytesSync([1]);
    final fresh = File('${tempDirectory.path}/mbc-giving-statement-new.pdf')
      ..writeAsBytesSync([2]);
    final unrelated = File('${tempDirectory.path}/other.pdf')
      ..writeAsBytesSync([3]);
    stale.setLastModifiedSync(now.subtract(const Duration(days: 2)));
    fresh.setLastModifiedSync(now.subtract(const Duration(hours: 2)));
    unrelated.setLastModifiedSync(now.subtract(const Duration(days: 2)));

    await service.deleteStaleFiles(directory: tempDirectory);

    expect(stale.existsSync(), isFalse);
    expect(fresh.existsSync(), isTrue);
    expect(unrelated.existsSync(), isTrue);
  });

  test(
    'deletes a generated statement PDF without touching unrelated files',
    () async {
      final tempDirectory = await Directory.systemTemp.createTemp(
        'annual_statement_delete_test_',
      );
      addTearDown(() => tempDirectory.delete(recursive: true));
      final service = AnnualStatementFileService(
        temporaryDirectoryProvider: () async => tempDirectory,
      );
      final export = GivingStatementExport(
        filename: 'giving-statement-2025.csv',
        contentType: 'text/csv',
        csv: 'statementId,mock',
        pdfBase64: base64Encode([37, 80, 68, 70]),
      );
      final unrelated = File('${tempDirectory.path}/other.pdf')
        ..writeAsBytesSync([7]);

      final file = await service.writePdf(export);
      await service.deletePdfFile(file);

      expect(File(file.path).existsSync(), isFalse);
      expect(unrelated.existsSync(), isTrue);
    },
  );
}
