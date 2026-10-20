import '../../domain/life_post_list_request.dart';
import '../dto/life_post_dto.dart';

abstract class LifeRemoteDataSource {
  const LifeRemoteDataSource();

  Future<List<LifePostDto>> fetchLifePosts({
    String? accessToken,
    LifePostListRequest request = const LifePostListRequest(),
  });
  Future<LifePostDto?> fetchLifePostById(String postId, {String? accessToken});
  Future<LifePostDto?> fetchLatestBulletin({
    String? accessToken,
    required LifePostListRequest request,
  }) async {
    final posts = await fetchLifePosts(
      accessToken: accessToken,
      request: request,
    );
    final bulletins =
        posts
            .where(
              (post) => post.type == 'weekly_bulletin' || post.type == 'sunday',
            )
            .toList()
          ..sort(_compareBulletinDtos);
    return bulletins.firstOrNull;
  }

  Future<LifePostDto> markLifePostRead(String postId, String accessToken);
  Future<LifePostDto> registerForEvent(
    String postId,
    String accessToken, {
    required int partySize,
    String? note,
  });
  Future<LifePostDto> updateEventRegistration(
    String postId,
    String accessToken, {
    required int partySize,
    String? note,
  });
  Future<LifePostDto> cancelEventRegistration(
    String postId,
    String accessToken,
  );
  Future<LifePostDto> checkInEventRegistration(
    String postId,
    String accessToken,
  );
  Future<LifePostDto> checkInEventRegistrationWithCode(
    String code,
    String accessToken,
  );
}

int _compareBulletinDtos(LifePostDto a, LifePostDto b) {
  final sortResult = b.sort.compareTo(a.sort);
  if (sortResult != 0) return sortResult;
  final startResult = _compareNullableDateDesc(a.startsAt, b.startsAt);
  if (startResult != 0) return startResult;
  return _compareNullableDateDesc(a.updatedAt, b.updatedAt);
}

int _compareNullableDateDesc(String? a, String? b) {
  if (a == b) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return b.compareTo(a);
}
