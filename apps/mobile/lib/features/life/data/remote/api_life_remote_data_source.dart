import '../../../../core/api/api_client.dart';
import '../../domain/life_post_list_request.dart';
import '../dto/life_post_dto.dart';
import '../dto/life_post_json_reader.dart';
import 'life_remote_data_source.dart';

class ApiLifeRemoteDataSource implements LifeRemoteDataSource {
  const ApiLifeRemoteDataSource({required this.apiClient});

  final ApiClient apiClient;

  @override
  Future<List<LifePostDto>> fetchLifePosts({
    String? accessToken,
    LifePostListRequest request = const LifePostListRequest(),
  }) async {
    final query = Uri(queryParameters: request.toQueryParameters()).query;
    final querySuffix = query.isEmpty ? '' : '?$query';
    final path = accessToken == null
        ? '/life/posts$querySuffix'
        : '/member/life/posts$querySuffix';
    final response = accessToken == null
        ? await apiClient.getJsonMap(path)
        : await apiClient.getJsonMapWithBearer(path, accessToken);
    final data = response['data'];
    return readLifePostObjectList(data).map(LifePostDto.fromJson).toList();
  }

  @override
  Future<LifePostDto?> fetchLifePostById(
    String postId, {
    String? accessToken,
  }) async {
    final encodedPostId = _lifePostPathSegment(postId);
    final response = accessToken == null
        ? await apiClient.getJsonMap('/life/posts/$encodedPostId')
        : await apiClient.getJsonMapWithBearer(
            '/member/life/posts/$encodedPostId',
            accessToken,
          );
    final data = response['data'];
    if (data is! Map<String, Object?>) {
      throw const FormatException('Life post response data must be an object.');
    }
    return LifePostDto.fromJson(data);
  }

  @override
  Future<LifePostDto> markLifePostRead(
    String postId,
    String accessToken,
  ) async {
    final encodedPostId = _lifePostPathSegment(postId);
    final response = await apiClient.postJsonMapWithBearer(
      '/member/life/posts/$encodedPostId/read',
      const {},
      accessToken,
    );
    final data = response['data'];
    if (data is! Map<String, Object?>) {
      throw const FormatException('Life post response data must be an object.');
    }
    return LifePostDto.fromJson(data);
  }

  @override
  Future<LifePostDto> registerForEvent(
    String postId,
    String accessToken, {
    required int partySize,
    String? note,
  }) async {
    final encodedPostId = _lifePostPathSegment(postId);
    final response = await apiClient
        .postJsonMapWithBearer('/member/life/posts/$encodedPostId/register', {
          'partySize': partySize,
          if (note != null && note.trim().isNotEmpty) 'note': note.trim(),
        }, accessToken);
    final data = response['data'];
    if (data is! Map<String, Object?>) {
      throw const FormatException('Life post response data must be an object.');
    }
    return LifePostDto.fromJson(data);
  }

  @override
  Future<LifePostDto> updateEventRegistration(
    String postId,
    String accessToken, {
    required int partySize,
    String? note,
  }) async {
    final encodedPostId = _lifePostPathSegment(postId);
    final response = await apiClient.patchJsonMapWithBearer(
      '/member/life/posts/$encodedPostId/registration',
      {
        'partySize': partySize,
        if (note != null && note.trim().isNotEmpty) 'note': note.trim(),
      },
      accessToken,
    );
    final data = response['data'];
    if (data is! Map<String, Object?>) {
      throw const FormatException('Life post response data must be an object.');
    }
    return LifePostDto.fromJson(data);
  }

  @override
  Future<LifePostDto> cancelEventRegistration(
    String postId,
    String accessToken,
  ) async {
    final encodedPostId = _lifePostPathSegment(postId);
    final response = await apiClient.postJsonMapWithBearer(
      '/member/life/posts/$encodedPostId/registration/cancel',
      const {},
      accessToken,
    );
    final data = response['data'];
    if (data is! Map<String, Object?>) {
      throw const FormatException('Life post response data must be an object.');
    }
    return LifePostDto.fromJson(data);
  }

  @override
  Future<LifePostDto> checkInEventRegistration(
    String postId,
    String accessToken,
  ) async {
    final encodedPostId = _lifePostPathSegment(postId);
    final response = await apiClient.postJsonMapWithBearer(
      '/member/life/posts/$encodedPostId/registration/check-in',
      const {},
      accessToken,
    );
    final data = response['data'];
    if (data is! Map<String, Object?>) {
      throw const FormatException('Life post response data must be an object.');
    }
    return LifePostDto.fromJson(data);
  }

  @override
  Future<LifePostDto> checkInEventRegistrationWithCode(
    String code,
    String accessToken,
  ) async {
    final response = await apiClient.postJsonMapWithBearer(
      '/member/life/check-in-code',
      {'code': code},
      accessToken,
    );
    final data = response['data'];
    final post = data is Map<String, Object?> ? data['post'] : null;
    if (post is! Map<String, Object?>) {
      throw const FormatException(
        'Event check-in response post must be an object.',
      );
    }
    return LifePostDto.fromJson(post);
  }
}

String _lifePostPathSegment(String postId) => Uri.encodeComponent(postId);
