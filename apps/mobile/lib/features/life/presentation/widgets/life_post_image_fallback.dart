import 'package:flutter/material.dart';

import '../../domain/life_post.dart';

class LifePostImageFallback extends StatelessWidget {
  const LifePostImageFallback({
    super.key,
    required this.post,
    this.showTitle = false,
  });

  final LifePost post;
  final bool showTitle;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return DecoratedBox(
      decoration: BoxDecoration(color: colorScheme.surfaceContainerHighest),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              lifePostFallbackIconFor(post.iconName),
              size: showTitle ? 34 : 42,
              color: colorScheme.onSurfaceVariant,
            ),
            if (showTitle) ...[
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  post.title,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

IconData lifePostFallbackIconFor(String iconName) {
  return switch (iconName) {
    'groups' => Icons.groups_outlined,
    'prayer' => Icons.favorite_outline,
    'giving' => Icons.volunteer_activism_outlined,
    'meal' => Icons.restaurant_outlined,
    'event' => Icons.event_outlined,
    _ => Icons.church_outlined,
  };
}
