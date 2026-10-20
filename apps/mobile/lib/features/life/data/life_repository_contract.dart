import '../../member_auth/data/member_session_repository.dart';
import '../domain/life_post.dart';
import '../domain/life_post_list_request.dart';

abstract class LifeRepository {
  const LifeRepository();

  Future<List<LifePost>> getLifePosts({
    MemberSession? session,
    LifePostListRequest request = const LifePostListRequest(),
  });

  Future<LifePost?> getLifePostById(String postId, {MemberSession? session});

  Future<LifePost?> getLatestBulletin({
    MemberSession? session,
    required LifePostListRequest request,
  }) async {
    final posts = await getLifePosts(session: session, request: request);
    return selectLatestLifeBulletin(posts);
  }

  Future<LifePost> markLifePostRead(String postId, MemberSession session);

  Future<LifePost> registerForEvent(
    String postId,
    MemberSession session, {
    required int partySize,
    String? note,
  });

  Future<LifePost> updateEventRegistration(
    String postId,
    MemberSession session, {
    required int partySize,
    String? note,
  });

  Future<LifePost> cancelEventRegistration(
    String postId,
    MemberSession session,
  );

  Future<LifePost> checkInEventRegistration(
    String postId,
    MemberSession session,
  );

  Future<LifePost> checkInEventRegistrationWithCode(
    String code,
    MemberSession session,
  );
}

LifePost? selectLatestLifeBulletin(Iterable<LifePost> posts) {
  final bulletins =
      posts
          .where(
            (post) => post.type == 'weekly_bulletin' || post.type == 'sunday',
          )
          .toList()
        ..sort(_compareBulletins);
  return bulletins.firstOrNull;
}

int _compareBulletins(LifePost a, LifePost b) {
  final sortResult = b.sort.compareTo(a.sort);
  if (sortResult != 0) return sortResult;
  final startResult = _compareNullableDateDesc(a.startsAt, b.startsAt);
  if (startResult != 0) return startResult;
  return _compareNullableDateDesc(a.updatedAt, b.updatedAt);
}

int _compareNullableDateDesc(DateTime? a, DateTime? b) {
  if (a == b) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return b.compareTo(a);
}
