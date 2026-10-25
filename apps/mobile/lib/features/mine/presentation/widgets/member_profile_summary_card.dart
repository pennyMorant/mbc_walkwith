import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../member_auth/data/member_session_repository.dart';
import '../member_profile_labels.dart';

class MemberProfileSummaryCard extends StatelessWidget {
  const MemberProfileSummaryCard({super.key, required this.member});

  final MemberProfile member;

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
              l10n.memberProfileEditTitle,
              style: Theme.of(context).textTheme.titleMedium
                  ?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 14),
            _SummaryRow(label: l10n.memberEmailLabel, value: member.email),
            _SummaryRow(
              label: l10n.memberStatusLabel,
              value: memberStatusLabel(l10n, member.status),
            ),
            _SummaryRow(
              label: l10n.memberGroupLabel,
              value: member.fellowshipGroupId ?? l10n.memberNoGroupLabel,
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textScale = MediaQuery.textScalerOf(context).scale(1);
    final labelStyle = Theme.of(context).textTheme.labelMedium
        ?.copyWith(color: colorScheme.onSurfaceVariant);
    final valueStyle = Theme.of(context).textTheme.bodyMedium
        ?.copyWith(fontWeight: FontWeight.w700);

    return LayoutBuilder(
      builder: (context, constraints) {
        final stackContent = constraints.maxWidth < 280 || textScale > 1.15;
        if (stackContent) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: labelStyle),
                const SizedBox(height: 2),
                Text(value, style: valueStyle),
              ],
            ),
          );
        }

        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(width: 112, child: Text(label, style: labelStyle)),
              Expanded(child: Text(value, style: valueStyle)),
            ],
          ),
        );
      },
    );
  }
}
