import 'package:flutter/material.dart';

import '../../../../shared/utils/app_formatters.dart';
import '../../domain/sermon.dart';

class SermonOutlineList extends StatelessWidget {
  const SermonOutlineList({super.key, required this.sermon});

  final Sermon sermon;

  @override
  Widget build(BuildContext context) {
    if (sermon.outline.isEmpty) {
      return const SizedBox.shrink();
    }
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Column(
            children: [
              for (var i = 0; i < sermon.outline.length; i++) ...[
                _OutlineTile(item: sermon.outline[i]),
                if (i != sermon.outline.length - 1) const Divider(indent: 24),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _OutlineTile extends StatelessWidget {
  const _OutlineTile({required this.item});

  final SermonOutlineItem item;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          DecoratedBox(
            decoration: ShapeDecoration(
              color: colorScheme.secondaryContainer,
              shape: const StadiumBorder(),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              child: Text(
                formatDurationClock(item.startTime),
                style: textTheme.labelMedium?.copyWith(
                  color: colorScheme.onSecondaryContainer,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                if (item.summary.trim().isNotEmpty) ...[
                  const SizedBox(height: 5),
                  Text(
                    item.summary,
                    style: textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                      height: 1.35,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
