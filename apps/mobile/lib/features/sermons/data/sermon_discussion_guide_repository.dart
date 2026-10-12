import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/api/api_error.dart';
import '../../../core/config/app_config.dart';
import '../../../core/identity/external_user_identity_repository.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../domain/sermon_discussion_guide.dart';
import 'dto/sermon_discussion_guide_dto.dart';
import 'dto/sermon_discussion_json_reader.dart';

final sermonDiscussionGuideRepositoryProvider =
    Provider<SermonDiscussionGuideRepository>((ref) {
      final config = ref.watch(appConfigProvider);
      if (config.useMockRemoteData) {
        return MockSermonDiscussionGuideRepository();
      }
      return ApiSermonDiscussionGuideRepository(
        apiClient: ref.watch(apiClientProvider),
      );
    });

final sermonDiscussionGuideProvider = FutureProvider.autoDispose
    .family<SermonDiscussionGuide?, String>((ref, sermonId) {
      return ref
          .watch(sermonDiscussionGuideRepositoryProvider)
          .getGuideForSermon(sermonId);
    });

abstract class SermonDiscussionGuideRepository {
  Future<SermonDiscussionGuide?> getGuideForSermon(String sermonId);

  Future<SermonDiscussionResponse> createResponse({
    required String guideId,
    required SermonDiscussionIdentity identity,
    required String content,
    String? questionId,
  });
}

class SermonDiscussionIdentity {
  const SermonDiscussionIdentity({
    required this.externalUserId,
    required this.session,
  });

  final String externalUserId;
  final MemberSession? session;

  String? get accessToken => session?.accessToken;
}

class ApiSermonDiscussionGuideRepository
    implements SermonDiscussionGuideRepository {
  const ApiSermonDiscussionGuideRepository({required this.apiClient});

  final ApiClient apiClient;

  @override
  Future<SermonDiscussionGuide?> getGuideForSermon(String sermonId) async {
    try {
      final encodedSermonId = Uri.encodeComponent(sermonId);
      final response = await apiClient.getJsonMap(
        '/sermons/$encodedSermonId/discussion-guide',
      );
      return SermonDiscussionGuideDto.fromJson(_data(response)).toDomain();
    } on ApiError catch (error) {
      if (error.isNotFound) {
        return null;
      }
      rethrow;
    }
  }

  @override
  Future<SermonDiscussionResponse> createResponse({
    required String guideId,
    required SermonDiscussionIdentity identity,
    required String content,
    String? questionId,
  }) async {
    final encodedGuideId = Uri.encodeComponent(guideId);
    final response = await apiClient.postJsonMapWithIdentity(
      '/sermon-discussion-guides/$encodedGuideId/responses',
      {
        'content': content.trim(),
        'status': 'private',
        if (questionId != null && questionId.trim().isNotEmpty)
          'questionId': questionId.trim(),
      },
      accessToken: identity.accessToken,
      externalUserId: identity.externalUserId,
    );
    return SermonDiscussionResponseDto.fromJson(_data(response)).toDomain();
  }
}

class MockSermonDiscussionGuideRepository
    implements SermonDiscussionGuideRepository {
  @override
  Future<SermonDiscussionGuide?> getGuideForSermon(String sermonId) async {
    return null;
  }

  @override
  Future<SermonDiscussionResponse> createResponse({
    required String guideId,
    required SermonDiscussionIdentity identity,
    required String content,
    String? questionId,
  }) async {
    return SermonDiscussionResponse(
      id: 'mock_discussion_response',
      guideId: guideId,
      questionId: questionId,
      userType: identity.session == null ? 'external' : 'member',
      userId: identity.session?.member.id ?? identity.externalUserId,
      status: 'private',
      content: content.trim(),
      createdAt: DateTime.now().toUtc(),
      updatedAt: DateTime.now().toUtc(),
    );
  }
}

Future<SermonDiscussionIdentity> readSermonDiscussionIdentity(
  WidgetRef ref,
) async {
  final session = await ref.read(memberSessionProvider.future);
  final externalUserId = await ref.read(externalUserIdProvider.future);
  return SermonDiscussionIdentity(
    session: session,
    externalUserId: externalUserId,
  );
}

Map<String, Object?> _data(Map<String, Object?> envelope) {
  return sermonDiscussionMap(envelope['data'], 'data');
}
