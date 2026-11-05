import 'package:flutter/material.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_chip.dart';

class SermonDiscussionGuideLoadError extends StatelessWidget {
  const SermonDiscussionGuideLoadError({super.key, required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    final message = Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(Icons.error_outline, color: colorScheme.onErrorContainer),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            l10n.sermonDiscussionLoadError,
            style: TextStyle(color: colorScheme.onErrorContainer),
          ),
        ),
      ],
    );
    final retry = AppButton(
      label: l10n.retryAction,
      icon: Icons.refresh,
      variant: AppButtonVariant.tonal,
      onPressed: onRetry,
    );

    return Card(
      color: colorScheme.errorContainer,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: LayoutBuilder(
          builder: (context, constraints) {
            final textScale = MediaQuery.textScalerOf(context).scale(1);
            final stackContent = constraints.maxWidth < 300 || textScale > 1.15;
            if (stackContent) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [message, const SizedBox(height: 12), retry],
              );
            }
            return Row(
              children: [
                Expanded(child: message),
                const SizedBox(width: 8),
                retry,
              ],
            );
          },
        ),
      ),
    );
  }
}

class SermonDiscussionGuideHeader extends StatelessWidget {
  const SermonDiscussionGuideHeader({super.key, required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    return LayoutBuilder(
      builder: (context, constraints) {
        final textScale = MediaQuery.textScalerOf(context).scale(1);
        final stackContent = constraints.maxWidth < 300 || textScale > 1.15;
        final titleText = Text(
          title,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            color: colorScheme.onSecondaryContainer,
            fontWeight: FontWeight.w800,
          ),
        );
        final privacy = AppChip(
          label: l10n.sermonDiscussionPrivateLabel,
          selected: true,
        );

        if (stackContent) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [titleText, const SizedBox(height: 8), privacy],
          );
        }
        return Row(
          children: [
            Expanded(child: titleText),
            const SizedBox(width: 10),
            privacy,
          ],
        );
      },
    );
  }
}

class SermonDiscussionGuideBlock extends StatelessWidget {
  const SermonDiscussionGuideBlock({
    super.key,
    required this.title,
    required this.children,
  });

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: colorScheme.surfaceContainer.withValues(alpha: 0.72),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                color: colorScheme.onSurface,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 10),
            ...children,
          ],
        ),
      ),
    );
  }
}

class SermonDiscussionGuideItem extends StatelessWidget {
  const SermonDiscussionGuideItem({
    super.key,
    required this.chipLabel,
    required this.title,
    this.body,
  });

  final String chipLabel;
  final String title;
  final String? body;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AppChip(label: chipLabel),
          const SizedBox(height: 6),
          Text(title, style: Theme.of(context).textTheme.bodyMedium),
          if (body != null && body!.trim().isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              body!.trim(),
              style: Theme.of(context).textTheme.bodySmall
                  ?.copyWith(color: colorScheme.onSurfaceVariant),
            ),
          ],
        ],
      ),
    );
  }
}
