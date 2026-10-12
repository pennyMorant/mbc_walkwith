import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../member_auth/data/member_session_repository.dart';
import '../data/life_repository.dart';
import '../domain/life_post.dart';

/// Coordinates the detail-surface read intent with its server-owned result.
Future<void> markLifePostReadAndRefresh(
  WidgetRef ref, {
  required LifePost post,
  required MemberSession session,
}) async {
  await ref.read(lifeRepositoryProvider).markLifePostRead(post.id, session);
  ref.invalidate(lifePostsProvider);
  ref.invalidate(lifePostListProvider);
  ref.invalidate(lifePostByIdProvider(post.id));
}
