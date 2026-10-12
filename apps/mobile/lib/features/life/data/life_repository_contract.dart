import '../../member_auth/data/member_session_repository.dart';
import '../domain/life_post.dart';
import '../domain/life_post_list_request.dart';

abstract class LifeRepository {
  Future<List<LifePost>> getLifePosts({
    MemberSession? session,
    LifePostListRequest request = const LifePostListRequest(),
  });

  Future<LifePost?> getLifePostById(String postId, {MemberSession? session});

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
