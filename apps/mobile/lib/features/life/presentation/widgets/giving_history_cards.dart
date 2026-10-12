import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/utils/app_formatters.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../domain/giving_record.dart';

class GivingSummaryCard extends StatelessWidget {
  const GivingSummaryCard({super.key, required this.overview});

  final GivingOverview overview;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.givingTitle,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                AppChip(label: l10n.givingSummaryYear(overview.summary.year)),
                AppChip(
                  label: l10n.givingSummaryAmount(
                    formatMoneyAmount(
                      context: context,
                      currency: overview.summary.currency,
                      amountCents: overview.summary.totalAmountCents,
                    ),
                  ),
                ),
                AppChip(
                  label: l10n.givingSummaryCount(
                    overview.summary.transactionCount,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class GivingTransactionCard extends StatelessWidget {
  const GivingTransactionCard({super.key, required this.transaction});

  final GivingTransaction transaction;

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
                    _displayCategory(l10n, transaction.category),
                    style: textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                Text(
                  formatMoneyAmount(
                    context: context,
                    currency: transaction.currency,
                    amountCents: transaction.amountCents,
                  ),
                  style: textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              formatDateOnly(context, transaction.givenAt),
              style: textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 10),
            AppChip(
              label: _givingTransactionStatusLabel(l10n, transaction.status),
            ),
          ],
        ),
      ),
    );
  }
}

class GivingMessageCard extends StatelessWidget {
  const GivingMessageCard({
    super.key,
    required this.title,
    required this.body,
    this.action,
  });

  final String title;
  final String body;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              body,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            if (action != null) ...[const SizedBox(height: 14), action!],
          ],
        ),
      ),
    );
  }
}

String _displayCategory(AppLocalizations l10n, String category) {
  if (category.trim().isEmpty) {
    return l10n.givingTitle;
  }
  return category
      .split(RegExp(r'[_\s-]+'))
      .where((part) => part.isNotEmpty)
      .map((part) => '${part[0].toUpperCase()}${part.substring(1)}')
      .join(' ');
}

String _givingTransactionStatusLabel(AppLocalizations l10n, String status) {
  return switch (status) {
    'pending' => l10n.givingStatusPendingLabel,
    'succeeded' => l10n.givingStatusSucceededLabel,
    'failed' => l10n.givingStatusFailedLabel,
    'refunded' => l10n.givingStatusRefundedLabel,
    _ => l10n.commonStatusUnknownLabel,
  };
}
