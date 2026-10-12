import '../../../core/api/api_error.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../domain/life_post.dart';
import '../domain/life_post_list_request.dart';
import 'dto/life_post_dto.dart';
import 'life_repository_contract.dart';
import 'local/life_local_data_source.dart';
import 'remote/life_remote_data_source.dart';

class CachedLifeRepository implements LifeRepository {
  CachedLifeRepository({
    required this.remoteDataSource,
    required this.localDataSource,
  });

  final LifeRemoteDataSource remoteDataSource;
  final LifeLocalDataSource localDataSource;
  final Map<String, LifePostDto> _memberPostCache = {};

  @override
  Future<List<LifePost>> getLifePosts({
    MemberSession? session,
    LifePostListRequest request = const LifePostListRequest(),
  }) async {
    try {
      final postDtos = await remoteDataSource.fetchLifePosts(
        accessToken: session?.accessToken,
        request: request,
      );
      _rememberMemberPosts(session, postDtos);
      if (request.canRefreshCache) {
        await _replaceContentCacheBestEffort(postDtos);
      }
      return postDtos.map((post) => post.toDomain()).toList();
    } on FormatException {
      rethrow;
    } catch (_) {
      final cachedDtos = await localDataSource.fetchLifePosts(request: request);
      final visibleCachedDtos = cachedDtos
          .where((post) => _isVisibleForSession(post, session))
          .map((post) => _memberPostFor(session, post.id) ?? post)
          .toList(growable: false);
      if (visibleCachedDtos.isNotEmpty) {
        return visibleCachedDtos.map((post) => post.toDomain()).toList();
      }
      rethrow;
    }
  }

  @override
  Future<LifePost?> getLifePostById(
    String postId, {
    MemberSession? session,
  }) async {
    try {
      final postDto = await remoteDataSource.fetchLifePostById(
        postId,
        accessToken: session?.accessToken,
      );
      if (postDto == null) {
        _forgetMemberPost(session, postId);
        await localDataSource.deleteLifePost(postId);
        return null;
      }
      _rememberMemberPost(session, postDto);
      await _cacheContentBestEffort(postDto);
      return postDto.toDomain();
    } on FormatException {
      rethrow;
    } on ApiError catch (error) {
      if (_isAuthoritativeLifePostMiss(error)) {
        _forgetMemberPost(session, postId);
        await localDataSource.deleteLifePost(postId);
        return null;
      }
      final memberPost = _memberPostFor(session, postId);
      if (memberPost != null) {
        return memberPost.toDomain();
      }
      final cachedDto = await localDataSource.fetchLifePostById(postId);
      if (!_isVisibleForSession(cachedDto, session)) {
        return null;
      }
      return cachedDto?.toDomain();
    } catch (_) {
      final memberPost = _memberPostFor(session, postId);
      if (memberPost != null) {
        return memberPost.toDomain();
      }
      final cachedDto = await localDataSource.fetchLifePostById(postId);
      if (!_isVisibleForSession(cachedDto, session)) {
        return null;
      }
      return cachedDto?.toDomain();
    }
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
    _rememberMemberPost(session, postDto);
    await _cacheContentBestEffort(postDto);
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
    _rememberMemberPost(session, postDto);
    await _cacheContentBestEffort(postDto);
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
    _rememberMemberPost(session, postDto);
    await _cacheContentBestEffort(postDto);
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
    _rememberMemberPost(session, postDto);
    await _cacheContentBestEffort(postDto);
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
    _rememberMemberPost(session, postDto);
    await _cacheContentBestEffort(postDto);
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
    _rememberMemberPost(session, postDto);
    await _cacheContentBestEffort(postDto);
    return postDto.toDomain();
  }

  void _rememberMemberPosts(
    MemberSession? session,
    Iterable<LifePostDto> posts,
  ) {
    if (session == null) {
      return;
    }
    for (final post in posts) {
      _rememberMemberPost(session, post);
    }
  }

  void _rememberMemberPost(MemberSession? session, LifePostDto post) {
    if (session == null) {
      return;
    }
    _memberPostCache[_memberPostKey(session, post.id)] = post;
  }

  LifePostDto? _memberPostFor(MemberSession? session, String postId) {
    if (session == null) {
      return null;
    }
    return _memberPostCache[_memberPostKey(session, postId)];
  }

  void _forgetMemberPost(MemberSession? session, String postId) {
    if (session == null) {
      return;
    }
    _memberPostCache.remove(_memberPostKey(session, postId));
  }

  String _memberPostKey(MemberSession session, String postId) =>
      '${session.member.id}:$postId';

  Future<void> _replaceContentCacheBestEffort(List<LifePostDto> posts) async {
    try {
      await localDataSource.replaceLifePosts(posts);
    } catch (_) {
      // A content-cache write cannot turn a valid server response into failure.
    }
  }

  Future<void> _cacheContentBestEffort(LifePostDto post) async {
    try {
      await localDataSource.upsertLifePost(post);
    } catch (_) {
      // Member state stays in the partitioned memory cache for this session.
    }
  }
}

bool _isAuthoritativeLifePostMiss(ApiError error) {
  return error.isNotFound ||
      error.hasCode(const {'event_not_found', 'life_post_not_found'});
}

bool _isVisibleForSession(LifePostDto? post, MemberSession? session) {
  if (post == null || post.status != 'published') {
    return false;
  }
  final visibility = post.visibility;
  if (visibility == null || visibility == 'public') {
    return true;
  }
  return session != null && visibility == 'members';
}
