import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/config/app_config.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../domain/ministry_group.dart';
import 'dto/ministry_group_dto.dart';

final groupRepositoryProvider = Provider<GroupRepository>((ref) {
  final config = ref.watch(appConfigProvider);
  if (config.useMockRemoteData) {
    return MockGroupRepository();
  }
  return ApiGroupRepository(apiClient: ref.watch(apiClientProvider));
});

final ministryGroupsProvider = FutureProvider<List<MinistryGroup>>((ref) async {
  final session = ref
      .watch(memberSessionProvider)
      .maybeWhen(data: (session) => session, orElse: () => null);
  return ref.watch(groupRepositoryProvider).getGroups(session);
});

final ministryGroupByIdProvider = FutureProvider.family<MinistryGroup, String>((
  ref,
  groupId,
) async {
  final session = await ref.watch(memberSessionProvider.future);
  return ref.watch(groupRepositoryProvider).getGroup(groupId, session);
});

final myMinistryGroupsProvider = FutureProvider<List<MinistryGroup>>((
  ref,
) async {
  final session = await ref.watch(memberSessionProvider.future);
  if (session == null) {
    return const [];
  }
  return ref.watch(groupRepositoryProvider).getMyGroups(session);
});

abstract class GroupRepository {
  Future<List<MinistryGroup>> getGroups(MemberSession? session);
  Future<MinistryGroup> getGroup(String groupId, MemberSession? session);
  Future<List<MinistryGroup>> getMyGroups(MemberSession session);
  Future<void> applyToGroup(
    String groupId,
    MemberSession session, {
    String? note,
  });
  Future<void> withdrawApplication(MinistryGroup group, MemberSession session);
}

class ApiGroupRepository implements GroupRepository {
  const ApiGroupRepository({required this.apiClient});

  final ApiClient apiClient;

  @override
  Future<List<MinistryGroup>> getGroups(MemberSession? session) async {
    final response = session == null
        ? await apiClient.getJsonMap('/groups?limit=20')
        : await apiClient.getJsonMapWithBearer(
            '/groups?limit=20',
            session.accessToken,
          );
    return _groupListFromEnvelope(response);
  }

  @override
  Future<MinistryGroup> getGroup(String groupId, MemberSession? session) async {
    final encodedGroupId = Uri.encodeComponent(groupId);
    final response = session == null
        ? await apiClient.getJsonMap('/groups/$encodedGroupId')
        : await apiClient.getJsonMapWithBearer(
            '/groups/$encodedGroupId',
            session.accessToken,
          );
    return _groupFromEnvelope(response);
  }

  @override
  Future<List<MinistryGroup>> getMyGroups(MemberSession session) async {
    final response = await apiClient.getJsonMapWithBearer(
      '/me/groups',
      session.accessToken,
    );
    return _groupListFromEnvelope(response);
  }

  @override
  Future<void> applyToGroup(
    String groupId,
    MemberSession session, {
    String? note,
  }) async {
    final encodedGroupId = Uri.encodeComponent(groupId);
    await apiClient.postJsonMapWithBearer(
      '/groups/$encodedGroupId/applications',
      {if (note != null && note.trim().isNotEmpty) 'note': note.trim()},
      session.accessToken,
    );
  }

  @override
  Future<void> withdrawApplication(
    MinistryGroup group,
    MemberSession session,
  ) async {
    final applicationId = group.myApplicationId;
    if (!group.hasSubmittedApplication || applicationId == null) {
      throw StateError('A submitted group application is required.');
    }
    await apiClient.patchJsonMapWithBearer(
      '/groups/${Uri.encodeComponent(group.id)}/applications/'
      '${Uri.encodeComponent(applicationId)}',
      const {'status': 'withdrawn'},
      session.accessToken,
    );
  }
}

class MockGroupRepository implements GroupRepository {
  final Set<String> _submittedGroups = <String>{};

  @override
  Future<List<MinistryGroup>> getGroups(MemberSession? session) async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
    return [
      MinistryGroup(
        id: 'friday-fellowship',
        name: 'Friday Fellowship',
        description: 'Weekly Bible sharing and dinner fellowship.',
        meetingTime: 'Friday 7:30 PM',
        location: 'Fellowship Hall',
        leaderName: 'Daniel Chan',
        visibility: 'members',
        status: 'active',
        capacity: null,
        memberCount: 12,
        myApplicationId: _submittedGroups.contains('friday-fellowship')
            ? 'mock-group-application'
            : null,
        myApplicationStatus: _submittedGroups.contains('friday-fellowship')
            ? 'submitted'
            : null,
        myMembershipStatus:
            session?.member.fellowshipGroupId == 'friday-fellowship'
            ? 'active'
            : null,
      ),
    ];
  }

  @override
  Future<MinistryGroup> getGroup(String groupId, MemberSession? session) async {
    final groups = await getGroups(session);
    return groups.firstWhere((group) => group.id == groupId);
  }

  @override
  Future<List<MinistryGroup>> getMyGroups(MemberSession session) async {
    final groups = await getGroups(session);
    return groups.where((group) => group.isMember).toList(growable: false);
  }

  @override
  Future<void> applyToGroup(
    String groupId,
    MemberSession session, {
    String? note,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    _submittedGroups.add(groupId);
  }

  @override
  Future<void> withdrawApplication(
    MinistryGroup group,
    MemberSession session,
  ) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    _submittedGroups.remove(group.id);
  }
}

List<MinistryGroup> _groupListFromEnvelope(Map<String, Object?> response) {
  final data = _groupDataFromEnvelope(response);
  final items = data['items'];
  if (items is! List<Object?> ||
      items.any((item) => item is! Map<String, Object?>)) {
    throw const FormatException('Group response items must be an object list.');
  }
  return items
      .cast<Map<String, Object?>>()
      .map(MinistryGroupDto.fromJson)
      .map((group) => group.toDomain())
      .toList(growable: false);
}

MinistryGroup _groupFromEnvelope(Map<String, Object?> response) {
  return MinistryGroupDto.fromJson(_groupDataFromEnvelope(response)).toDomain();
}

Map<String, Object?> _groupDataFromEnvelope(Map<String, Object?> response) {
  final data = response['data'];
  if (data is! Map<String, Object?>) {
    throw const FormatException('Group response data must be an object.');
  }
  return data;
}
