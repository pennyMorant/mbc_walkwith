import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_message_card.dart';

class ReadingPlanCollectionEmptyState extends StatelessWidget {
  const ReadingPlanCollectionEmptyState({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return AppMessageCard(body: message);
  }
}

class ReadingPlanCollectionErrorState extends StatelessWidget {
  const ReadingPlanCollectionErrorState({super.key, required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: AppMessageCard(
          body: l10n.readingPlanLoadErrorBody,
          action: AppButton(
            label: l10n.retryAction,
            icon: Icons.refresh,
            onPressed: onRetry,
          ),
        ),
      ),
    );
  }
}
