import 'dart:convert';
import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path_provider/path_provider.dart';

import '../domain/giving_record.dart';

typedef AnnualStatementDirectoryProvider = Future<Directory> Function();
typedef AnnualStatementClock = DateTime Function();

final annualStatementFileServiceProvider = Provider<AnnualStatementFileService>(
  (ref) => AnnualStatementFileService(),
);

class AnnualStatementFileService {
  AnnualStatementFileService({
    AnnualStatementDirectoryProvider? temporaryDirectoryProvider,
    AnnualStatementClock? clock,
  }) : _temporaryDirectoryProvider =
           temporaryDirectoryProvider ?? getTemporaryDirectory,
       _clock = clock ?? DateTime.now;

  static const _filenamePrefix = 'mbc-giving-statement-';

  final AnnualStatementDirectoryProvider _temporaryDirectoryProvider;
  final AnnualStatementClock _clock;

  Future<AnnualStatementPdfFile> writePdf(GivingStatementExport export) async {
    final pdfBase64 = export.pdfBase64;
    if (pdfBase64 == null || pdfBase64.isEmpty) {
      throw StateError('Annual statement PDF is not available.');
    }

    final directory = await _temporaryDirectoryProvider();
    await directory.create(recursive: true);
    await deleteStaleFiles(directory: directory);

    final filename = _pdfFilename(export.filename);
    final file = File('${directory.path}${Platform.pathSeparator}$filename');
    await file.writeAsBytes(base64Decode(pdfBase64), flush: true);
    return AnnualStatementPdfFile(
      path: file.path,
      uri: file.uri,
      filename: filename,
    );
  }

  Future<void> deleteStaleFiles({
    Directory? directory,
    Duration maxAge = const Duration(days: 1),
  }) async {
    final targetDirectory = directory ?? await _temporaryDirectoryProvider();
    if (!targetDirectory.existsSync()) {
      return;
    }

    final cutoff = _clock().subtract(maxAge);
    await for (final entity in targetDirectory.list(followLinks: false)) {
      if (entity is! File || !_isStatementPdf(entity)) {
        continue;
      }
      final modifiedAt = await entity.lastModified();
      if (modifiedAt.isBefore(cutoff)) {
        await entity.delete();
      }
    }
  }

  Future<void> deletePdfFile(AnnualStatementPdfFile pdfFile) async {
    final file = File(pdfFile.path);
    if (!file.existsSync() || !_isStatementPdf(file)) {
      return;
    }
    await file.delete();
  }

  bool _isStatementPdf(File file) {
    final filename = file.uri.pathSegments.isEmpty
        ? file.path
        : file.uri.pathSegments.last;
    return filename.startsWith(_filenamePrefix) &&
        filename.toLowerCase().endsWith('.pdf');
  }

  String _pdfFilename(String sourceFilename) {
    final withoutCsv = sourceFilename.replaceFirst(
      RegExp(r'\.csv$', caseSensitive: false),
      '',
    );
    final trimmed = withoutCsv.trim().isEmpty ? 'statement' : withoutCsv.trim();
    final normalized = trimmed
        .replaceAll(RegExp(r'[^A-Za-z0-9._-]+'), '_')
        .replaceAll(RegExp(r'_+'), '_')
        .replaceAll(RegExp(r'^_+|_+$'), '');
    final basename = normalized.startsWith(_filenamePrefix)
        ? normalized.substring(_filenamePrefix.length)
        : normalized;
    final safeBasename = basename.isEmpty ? 'statement' : basename;
    return '$_filenamePrefix$safeBasename.pdf';
  }
}

class AnnualStatementPdfFile {
  const AnnualStatementPdfFile({
    required this.path,
    required this.uri,
    required this.filename,
  });

  final String path;
  final Uri uri;
  final String filename;
}
