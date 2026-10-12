import '../../domain/life_post_list_request.dart';
import '../dto/life_post_dto.dart';

abstract class LifeRemoteDataSource {
  Future<List<LifePostDto>> fetchLifePosts({
    String? accessToken,
    LifePostListRequest request = const LifePostListRequest(),
  });
  Future<LifePostDto?> fetchLifePostById(String postId, {String? accessToken});
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
