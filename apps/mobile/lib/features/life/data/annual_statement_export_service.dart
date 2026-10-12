import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/platform/external_link_service.dart';
import '../domain/giving_record.dart';
import 'annual_statement_file_service.dart';

final annualStatementExportServiceProvider =
    Provider<AnnualStatementExportService>((ref) {
      return AnnualStatementExportService(
        fileService: ref.watch(annualStatementFileServiceProvider),
        linkService: ref.watch(externalLinkServiceProvider),
      );
    });

class AnnualStatementExportService {
  AnnualStatementExportService({
    required AnnualStatementFileService fileService,
    required ExternalLinkService linkService,
    SharePlus? share,
  }) : _fileService = fileService,
       _linkService = linkService,
       _share = share ?? SharePlus.instance;

  final AnnualStatementFileService _fileService;
  final ExternalLinkService _linkService;
  final SharePlus _share;

  Future<AnnualStatementPdfOpenResult> openPdf(
    GivingStatementExport export,
  ) async {
    final file = await _fileService.writePdf(export);
    final opened = await _linkService.openExternalUri(file.uri);
    return AnnualStatementPdfOpenResult(file: file, opened: opened);
  }

  Future<AnnualStatementPdfShareResult> sharePdf(
    GivingStatementExport export, {
    required String title,
    required String text,
  }) async {
    final file = await _fileService.writePdf(export);
    try {
      final result = await _share.share(
        ShareParams(
          title: title,
          text: text,
          files: [
            XFile(file.path, mimeType: 'application/pdf', name: file.filename),
          ],
        ),
      );
      return AnnualStatementPdfShareResult(
        completed: result.status != ShareResultStatus.dismissed,
      );
    } finally {
      await _fileService.deletePdfFile(file);
    }
  }
}

class AnnualStatementPdfOpenResult {
  const AnnualStatementPdfOpenResult({
    required this.file,
    required this.opened,
  });

  final AnnualStatementPdfFile file;
  final bool opened;
}

class AnnualStatementPdfShareResult {
  const AnnualStatementPdfShareResult({required this.completed});

  final bool completed;
}
