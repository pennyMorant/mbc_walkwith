import 'package:flutter/material.dart';

import '../../../../theme/app_colors.dart';
import '../../domain/life_post.dart';

/// Visual policy for the server-owned read state of a Life post.
///
/// This class deliberately has no repository or provider dependency. Reading a
/// post remains a detail-surface intent; cards and badges only render the
/// `isRead` projection returned by the backend.
@immutable
class LifePostReadState {
  const LifePostReadState._({required this.isRead});

  factory LifePostReadState.fromPost(LifePost post) {
    return LifePostReadState._(isRead: post.isRead);
  }

  final bool isRead;

  bool get isUnread => !isRead;

  Color cardColor(ColorScheme colorScheme) {
    if (isRead) {
      return colorScheme.tintedCardColor;
    }
    return Color.alphaBlend(
      colorScheme.primary.withValues(alpha: 0.12),
      colorScheme.tintedCardColor,
    );
  }

  Color heroCardColor(ColorScheme colorScheme) {
    if (isRead) {
      return colorScheme.secondaryContainer;
    }
    return Color.alphaBlend(
      colorScheme.primary.withValues(alpha: 0.12),
      colorScheme.secondaryContainer,
    );
  }

  FontWeight get titleWeight => isUnread ? FontWeight.w800 : FontWeight.w700;

  FontWeight get emphasisWeight => isUnread ? FontWeight.w900 : FontWeight.w800;

  Color bodyColor(ColorScheme colorScheme) {
    return isUnread
        ? colorScheme.onSurfaceVariant
        : colorScheme.onSurfaceVariant.withValues(alpha: 0.82);
  }
}

int lifePostUnreadCount(Iterable<LifePost> posts, {required bool enabled}) {
  if (!enabled) {
    return 0;
  }
  return posts.where((post) => !post.isRead).length;
}
