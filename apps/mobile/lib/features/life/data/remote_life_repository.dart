import '../../member_auth/data/member_session_repository.dart';
import '../domain/life_post.dart';
import '../domain/life_post_list_request.dart';
import 'life_repository_contract.dart';
import 'remote/life_remote_data_source.dart';

class RemoteLifeRepository implements LifeRepository {
  const RemoteLifeRepository({required this.remoteDataSource});

  final LifeRemoteDataSource remoteDataSource;

  @override
  Future<List<LifePost>> getLifePosts({
    MemberSession? session,
    LifePostListRequest request = const LifePostListRequest(),
  }) async {
    final postDtos = await remoteDataSource.fetchLifePosts(
      accessToken: session?.accessToken,
      request: request,
    );
    return postDtos.map((post) => post.toDomain()).toList();
  }

  @override
  Future<LifePost?> getLifePostById(
    String postId, {
    MemberSession? session,
  }) async {
    final postDto = await remoteDataSource.fetchLifePostById(
      postId,
      accessToken: session?.accessToken,
    );
    return postDto?.toDomain();
  }

  @override
  Future<LifePost> markLifePostRead(
    String postId,
    MemberSession session,
  ) async {
    final postDto = await remoteDataSource.markLifePostRead(
      postId,
      session.accessToken,
    );
    return postDto.toDomain();
  }

  @override
  Future<LifePost> registerForEvent(
    String postId,
    MemberSession session, {
    required int partySize,
    String? note,
  }) async {
    final postDto = await remoteDataSource.registerForEvent(
      postId,
      session.accessToken,
      partySize: partySize,
      note: note,
    );
    return postDto.toDomain();
  }

  @override
  Future<LifePost> updateEventRegistration(
    String postId,
    MemberSession session, {
    required int partySize,
    String? note,
  }) async {
    final postDto = await remoteDataSource.updateEventRegistration(
      postId,
      session.accessToken,
      partySize: partySize,
      note: note,
    );
    return postDto.toDomain();
  }

  @override
  Future<LifePost> cancelEventRegistration(
    String postId,
    MemberSession session,
  ) async {
    final postDto = await remoteDataSource.cancelEventRegistration(
      postId,
      session.accessToken,
    );
    return postDto.toDomain();
  }

  @override
  Future<LifePost> checkInEventRegistration(
    String postId,
    MemberSession session,
  ) async {
    final postDto = await remoteDataSource.checkInEventRegistration(
      postId,
      session.accessToken,
    );
    return postDto.toDomain();
  }

  @override
  Future<LifePost> checkInEventRegistrationWithCode(
    String code,
    MemberSession session,
  ) async {
    final postDto = await remoteDataSource.checkInEventRegistrationWithCode(
      code,
      session.accessToken,
    );
    return postDto.toDomain();
  }
}
