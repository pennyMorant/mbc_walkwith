import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/utils/app_formatters.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../domain/giving_record.dart';

class AnnualStatementCard extends StatelessWidget {
  const AnnualStatementCard({
    super.key,
    required this.statement,
    required this.isLoading,
    required this.onPreview,
  });

  final GivingStatement statement;
  final bool isLoading;
  final VoidCallback? onPreview;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    l10n.givingStatementLabel(statement.taxYear),
                    style: textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                Text(
                  formatMoneyAmount(
                    context: context,
                    currency: statement.currency,
                    amountCents: statement.totalAmountCents,
                  ),
                  style: textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                AppChip(label: _statementStatusLabel(l10n, statement.status)),
                if (statement.generatedAt != null)
                  AppChip(
                    label: formatDateOnly(context, statement.generatedAt!),
                  ),
              ],
            ),
            if (onPreview != null) ...[
              const SizedBox(height: 14),
              FilledButton.icon(
                onPressed: isLoading ? null : onPreview,
                icon: isLoading
                    ? const SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.visibility_outlined),
                label: Text(l10n.annualStatementPreviewAction),
              ),
            ] else ...[
              const SizedBox(height: 12),
              Text(
                _statementStatusLabel(l10n, statement.status),
                style: textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

String _statementStatusLabel(AppLocalizations l10n, String status) {
  return switch (status) {
    'pending' => l10n.annualStatementStatusPendingLabel,
    'ready' => l10n.annualStatementStatusReadyLabel,
    'sent' => l10n.annualStatementStatusSentLabel,
    'failed' => l10n.annualStatementStatusFailedLabel,
    _ => l10n.commonStatusUnknownLabel,
  };
}
