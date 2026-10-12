import 'package:flutter/material.dart';

import '../../../../shared/widgets/app_chip.dart';

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
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
