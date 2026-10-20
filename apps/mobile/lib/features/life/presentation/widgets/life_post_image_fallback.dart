import 'package:flutter/material.dart';

import '../../domain/life_post.dart';

class LifePostImageFallback extends StatelessWidget {
  const LifePostImageFallback({super.key, required this.post});

  final LifePost post;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return DecoratedBox(
      decoration: BoxDecoration(color: colorScheme.surfaceContainerHighest),
      child: Center(
        child: Icon(
          lifePostFallbackIconFor(post),
          size: 42,
          color: colorScheme.onSurfaceVariant,
        ),
      ),
    );
  }
}

IconData lifePostFallbackIconFor(LifePost post) {
  return switch (post.type) {
    'event' => Icons.event_outlined,
    'fellowship' || 'group' => Icons.groups_outlined,
    'course' => Icons.school_outlined,
    'serving' => Icons.volunteer_activism_outlined,
    'prayer' || 'care' => Icons.favorite_outline,
    'giving' => Icons.volunteer_activism_outlined,
    _ => switch (post.iconName) {
      'meal' => Icons.restaurant_outlined,
      'event' => Icons.event_outlined,
      _ => Icons.church_outlined,
    },
  };
}
