import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/config/app_config.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../domain/care_request.dart';
import 'dto/care_request_dto.dart';

final careRepositoryProvider = Provider<CareRepository>((ref) {
  final config = ref.watch(appConfigProvider);
  if (config.useMockRemoteData) {
    return MockCareRepository();
  }
  return ApiCareRepository(apiClient: ref.watch(apiClientProvider));
});

final careRequestsProvider = FutureProvider<List<CareRequest>>((ref) {
  final session = ref
      .watch(memberSessionProvider)
      .maybeWhen(data: (session) => session, orElse: () => null);
  if (session == null) {
    return Future.value(const []);
  }
  return ref.watch(careRepositoryProvider).fetchMine(session);
});

abstract class CareRepository {
  Future<List<CareRequest>> fetchMine(MemberSession session);

  Future<CareRequest> submitRequest({
    required MemberSession session,
    required String title,
    required String body,
    required String privacyLevel,
  });
}

class ApiCareRepository implements CareRepository {
  const ApiCareRepository({required this.apiClient});

  final ApiClient apiClient;

  @override
  Future<List<CareRequest>> fetchMine(MemberSession session) async {
    final response = await apiClient.getJsonMapWithBearer(
      '/me/care-requests?limit=20',
      session.accessToken,
    );
    return _requestsFromEnvelope(response);
  }

  @override
  Future<CareRequest> submitRequest({
    required MemberSession session,
    required String title,
    required String body,
    required String privacyLevel,
  }) async {
    final response = await apiClient.postJsonMapWithBearer(
      '/me/care-requests',
      {'title': title, 'body': body, 'privacyLevel': privacyLevel},
      session.accessToken,
    );
    final data = response['data'];
    return CareRequestDto.fromJson(
      data is Map<String, Object?> ? data : const {},
    ).toDomain();
  }
}

class MockCareRepository implements CareRepository {
  final List<CareRequest> _requests = [
    CareRequest(
      id: 'mock-care-request',
      userId: 'mock-member',
      memberDisplayName: 'Grace Member',
      memberEmail: 'grace@example.com',
      title: 'Pastoral check-in',
      body: 'I would appreciate a pastoral call this week.',
      status: 'assigned',
      privacyLevel: 'pastoral_only',
      assigneeName: 'Pastor Lee',
      nextFollowUpAt: DateTime(2026, 7, 10, 18),
      createdAt: DateTime(2026, 6, 20, 9),
      updatedAt: DateTime(2026, 6, 21, 15),
    ),
  ];

  @override
  Future<List<CareRequest>> fetchMine(MemberSession session) async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
    return List.unmodifiable(_requests);
  }

  @override
  Future<CareRequest> submitRequest({
    required MemberSession session,
    required String title,
    required String body,
    required String privacyLevel,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    final request = CareRequest(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      userId: session.member.id,
      memberDisplayName: session.member.displayName,
      memberEmail: session.member.email,
      title: title,
      body: body,
      status: 'submitted',
      privacyLevel: privacyLevel,
      assigneeName: '',
      nextFollowUpAt: null,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
    _requests.insert(0, request);
    return request;
  }
}

List<CareRequest> _requestsFromEnvelope(Map<String, Object?> response) {
  final data = response['data'];
  if (data is! Map<String, Object?>) {
    return const [];
  }
  final items = data['items'];
  if (items is! List<Object?>) {
    return const [];
  }
  return items
      .whereType<Map<String, Object?>>()
      .map(CareRequestDto.fromJson)
      .map((request) => request.toDomain())
      .toList(growable: false);
}
