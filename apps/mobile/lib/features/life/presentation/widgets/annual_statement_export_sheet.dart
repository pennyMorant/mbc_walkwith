import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/api/api_error.dart';
import '../../../../l10n/app_localizations.dart';
import '../../data/annual_statement_export_service.dart';
import '../../domain/giving_record.dart';

class AnnualStatementExportSheet extends ConsumerWidget {
  const AnnualStatementExportSheet({super.key, required this.export});

  final GivingStatementExport export;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    return SafeArea(
      top: false,
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          8,
          20,
          MediaQuery.paddingOf(context).bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.annualStatementExportTitle,
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              export.filename,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: MediaQuery.sizeOf(context).height * 0.4,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: SingleChildScrollView(
                  child: SelectableText(
                    export.csv,
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(fontFamily: 'monospace'),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 14),
            if (export.pdfBase64 != null && export.pdfBase64!.isNotEmpty) ...[
              FilledButton.icon(
                onPressed: () => _savePdf(context, ref, export),
                icon: const Icon(Icons.picture_as_pdf_outlined),
                label: Text(l10n.annualStatementSavePdfAction),
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () => _sharePdf(context, ref, export),
                icon: const Icon(Icons.ios_share_outlined),
                label: Text(l10n.annualStatementSharePdfAction),
              ),
              const SizedBox(height: 8),
            ],
            FilledButton.icon(
              onPressed: () async {
                await Clipboard.setData(ClipboardData(text: export.csv));
                if (context.mounted) {
                  Navigator.of(context).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(l10n.annualStatementCopiedMessage)),
                  );
                }
              },
              icon: const Icon(Icons.copy_all_outlined),
              label: Text(l10n.annualStatementCopyCsvAction),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _savePdf(
    BuildContext context,
    WidgetRef ref,
    GivingStatementExport export,
  ) async {
    final l10n = AppLocalizations.of(context)!;
    final messenger = ScaffoldMessenger.of(context);
    try {
      final result = await ref
          .read(annualStatementExportServiceProvider)
          .openPdf(export);
      if (!context.mounted) {
        return;
      }
      messenger.showSnackBar(
        SnackBar(
          content: Text(
            result.opened
                ? l10n.annualStatementPdfOpenedMessage
                : l10n.annualStatementPdfSavedMessage(result.file.path),
          ),
          action: SnackBarAction(
            label: l10n.copyPathAction,
            onPressed: () {
              Clipboard.setData(ClipboardData(text: result.file.path));
            },
          ),
        ),
      );
    } catch (error) {
      if (context.mounted) {
        messenger.showSnackBar(
          SnackBar(content: Text(formatApiErrorMessage(error))),
        );
      }
    }
  }

  Future<void> _sharePdf(
    BuildContext context,
    WidgetRef ref,
    GivingStatementExport export,
  ) async {
    final l10n = AppLocalizations.of(context)!;
    final messenger = ScaffoldMessenger.of(context);
    try {
      final result = await ref
          .read(annualStatementExportServiceProvider)
          .sharePdf(
            export,
            title: l10n.annualStatementExportTitle,
            text: l10n.annualStatementSharePdfText,
          );
      if (!context.mounted || !result.completed) {
        return;
      }
      messenger.showSnackBar(
        SnackBar(content: Text(l10n.annualStatementPdfSharedMessage)),
      );
    } catch (error) {
      if (context.mounted) {
        messenger.showSnackBar(
          SnackBar(content: Text(formatApiErrorMessage(error))),
        );
      }
    }
  }
}
