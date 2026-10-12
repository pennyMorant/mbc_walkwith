import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/config/app_config.dart';
import '../../member_auth/data/member_session_repository.dart';
import 'dto/prayer_request_dto.dart';
import '../domain/prayer_request.dart';

final prayerRepositoryProvider = Provider<PrayerRepository>((ref) {
  final config = ref.watch(appConfigProvider);
  if (config.useMockRemoteData) {
    return const MockPrayerRepository();
  }
  return ApiPrayerRepository(apiClient: ref.watch(apiClientProvider));
});

final publicPrayerRequestsProvider = FutureProvider<List<PrayerRequest>>((ref) {
  return ref.watch(prayerRepositoryProvider).fetchPublicRequests();
});

final memberPrayerRequestsProvider = FutureProvider<List<PrayerRequest>>((ref) {
  final session = ref
      .watch(memberSessionProvider)
      .maybeWhen(data: (session) => session, orElse: () => null);
  if (session == null) {
    return Future.value(const []);
  }
  return ref.watch(prayerRepositoryProvider).fetchMemberRequests(session);
});

abstract class PrayerRepository {
  Future<List<PrayerRequest>> fetchPublicRequests();

  Future<List<PrayerRequest>> fetchMemberRequests(MemberSession session);

  Future<PrayerRequest> submitRequest({
    required String title,
    required String body,
    required String visibility,
    String? submitterName,
    MemberSession? session,
  });
}

class ApiPrayerRepository implements PrayerRepository {
  const ApiPrayerRepository({required this.apiClient});

  final ApiClient apiClient;

  @override
  Future<List<PrayerRequest>> fetchPublicRequests() async {
    final response = await apiClient.getJsonMap('/prayer-requests?limit=20');
    return _requestsFromEnvelope(response);
  }

  @override
  Future<List<PrayerRequest>> fetchMemberRequests(MemberSession session) async {
    final ownResponse = await apiClient.getJsonMapWithBearer(
      '/member/prayer-requests?limit=20',
      session.accessToken,
    );
    final sharedResponse = await apiClient.getJsonMapWithBearer(
      '/member/prayer-requests/shared?limit=20',
      session.accessToken,
    );
    return _dedupeRequests([
      ..._requestsFromEnvelope(ownResponse),
      ..._requestsFromEnvelope(sharedResponse),
    ]);
  }

  @override
  Future<PrayerRequest> submitRequest({
    required String title,
    required String body,
    required String visibility,
    String? submitterName,
    MemberSession? session,
  }) async {
    final payload = {
      'title': title,
      'body': body,
      'visibility': visibility,
      if (submitterName != null && submitterName.trim().isNotEmpty)
        'submitterName': submitterName.trim(),
    };
    final response = session == null
        ? await apiClient.postJsonMap('/prayer-requests', payload)
        : await apiClient.postJsonMapWithBearer(
            '/prayer-requests',
            payload,
            session.accessToken,
          );
    return readPrayerResponse(response);
  }
}

class MockPrayerRepository implements PrayerRepository {
  const MockPrayerRepository();

  static final List<PrayerRequest> _requests = [
    PrayerRequest(
      id: 'mock-prayer-care',
      title: 'Small group care',
      body: 'Please pray for a member recovering this week.',
      visibility: 'members',
      groupId: null,
      status: 'approved',
      submitterName: 'Care Team',
      createdAt: DateTime(2026, 5, 9, 18),
      updatedAt: DateTime(2026, 5, 9, 18),
    ),
    PrayerRequest(
      id: 'mock-prayer-public',
      title: 'Sunday thanksgiving',
      body: 'Give thanks for answered prayer this week.',
      visibility: 'public',
      groupId: null,
      status: 'approved',
      submitterName: 'Prayer Team',
      createdAt: DateTime(2026, 5, 10, 18),
      updatedAt: DateTime(2026, 5, 10, 18),
    ),
  ];

  @override
  Future<List<PrayerRequest>> fetchPublicRequests() async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
    return _requests
        .where(
          (request) =>
              request.status == 'approved' && request.visibility == 'public',
        )
        .toList(growable: false);
  }

  @override
  Future<List<PrayerRequest>> fetchMemberRequests(MemberSession session) async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
    return _requests
        .where(
          (request) =>
              request.status == 'approved' || request.visibility == 'private',
        )
        .toList(growable: false);
  }

  @override
  Future<PrayerRequest> submitRequest({
    required String title,
    required String body,
    required String visibility,
    String? submitterName,
    MemberSession? session,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    return PrayerRequest(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      title: title,
      body: body,
      visibility: visibility,
      groupId: null,
      status: 'pending',
      submitterName: submitterName ?? '',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
  }
}

List<PrayerRequest> _requestsFromEnvelope(Map<String, Object?> response) {
  return readPrayerItems(response);
}

List<PrayerRequest> _dedupeRequests(List<PrayerRequest> requests) {
  final deduped = <String, PrayerRequest>{};
  for (final request in requests) {
    final current = deduped[request.id];
    if (current == null || request.updatedAt.isAfter(current.updatedAt)) {
      deduped[request.id] = request;
    }
  }
  return deduped.values.toList(growable: false)
    ..sort((left, right) => right.createdAt.compareTo(left.createdAt));
}
