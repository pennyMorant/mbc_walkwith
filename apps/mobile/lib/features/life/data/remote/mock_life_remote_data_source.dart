import '../../domain/life_post.dart';
import '../../domain/life_post_list_request.dart';
import '../dto/life_post_dto.dart';
import '../mock_life_data.dart' as mock;
import 'life_remote_data_source.dart';

class MockLifeRemoteDataSource implements LifeRemoteDataSource {
  final Map<String, _MockRegistration> _registrations =
      <String, _MockRegistration>{};
  final Map<String, DateTime> _readAtByPostId = <String, DateTime>{};

  @override
  Future<List<LifePostDto>> fetchLifePosts({
    String? accessToken,
    LifePostListRequest request = const LifePostListRequest(),
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
    return mock.lifePosts
        .where((post) => _isVisibleForAccessToken(post, accessToken))
        .where((post) => _matchesRequest(post, request))
        .take(request.limit)
        .map(
          (post) => _toDto(
            post,
            registration: _registrations[post.id],
            readAt: _readAtByPostId[post.id],
          ),
        )
        .toList();
  }

  @override
  Future<LifePostDto?> fetchLifePostById(
    String postId, {
    String? accessToken,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
    final post = mock.lifePosts
        .where((post) => post.id == postId)
        .where((post) => _isVisibleForAccessToken(post, accessToken))
        .firstOrNull;
    return post == null
        ? null
        : _toDto(
            post,
            registration: _registrations[post.id],
            readAt: _readAtByPostId[post.id],
          );
  }

  @override
  Future<LifePostDto> markLifePostRead(
    String postId,
    String accessToken,
  ) async {
    await Future<void>.delayed(const Duration(milliseconds: 80));
    _readAtByPostId[postId] = DateTime.now().toUtc();
    final post = await fetchLifePostById(postId, accessToken: accessToken);
    if (post == null) {
      throw StateError('Life post not found');
    }
    return post;
  }

  @override
  Future<LifePostDto> registerForEvent(
    String postId,
    String accessToken, {
    required int partySize,
    String? note,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    _registrations[postId] = _MockRegistration(
      partySize: partySize,
      note: note,
      status: 'confirmed',
    );
    final post = await fetchLifePostById(postId, accessToken: accessToken);
    if (post == null) {
      throw StateError('Life post not found');
    }
    return post;
  }

  @override
  Future<LifePostDto> updateEventRegistration(
    String postId,
    String accessToken, {
    required int partySize,
    String? note,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    if (!_registrations.containsKey(postId)) {
      throw StateError('Life post registration not found');
    }
    _registrations[postId] = _MockRegistration(
      partySize: partySize,
      note: note,
      status: 'confirmed',
    );
    final post = await fetchLifePostById(postId, accessToken: accessToken);
    if (post == null) {
      throw StateError('Life post not found');
    }
    return post;
  }

  @override
  Future<LifePostDto> cancelEventRegistration(
    String postId,
    String accessToken,
  ) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    _registrations.remove(postId);
    final post = await fetchLifePostById(postId, accessToken: accessToken);
    if (post == null) {
      throw StateError('Life post not found');
    }
    return post;
  }

  @override
  Future<LifePostDto> checkInEventRegistration(
    String postId,
    String accessToken,
  ) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    final registration = _registrations[postId];
    if (registration == null) {
      throw StateError('Life post registration not found');
    }
    _registrations[postId] = _MockRegistration(
      partySize: registration.partySize,
      note: registration.note,
      status: 'checked_in',
      checkedInAt: DateTime.now(),
      checkInMethod: 'member_self',
    );
    final post = await fetchLifePostById(postId, accessToken: accessToken);
    if (post == null) {
      throw StateError('Life post not found');
    }
    return post;
  }

  @override
  Future<LifePostDto> checkInEventRegistrationWithCode(
    String code,
    String accessToken,
  ) async {
    await Future<void>.delayed(const Duration(milliseconds: 120));
    final postId = _registrations.keys.firstOrNull;
    if (postId == null) {
      throw StateError('Life post registration not found');
    }
    final registration = _registrations[postId]!;
    _registrations[postId] = _MockRegistration(
      partySize: registration.partySize,
      note: registration.note,
      status: 'checked_in',
      checkedInAt: DateTime.now(),
      checkInMethod: 'onsite_qr',
    );
    final post = await fetchLifePostById(postId, accessToken: accessToken);
    if (post == null) {
      throw StateError('Life post not found');
    }
    return post;
  }
}

bool _matchesRequest(LifePost post, LifePostListRequest request) {
  final query = request.query?.trim().toLowerCase();
  if (query != null && query.isNotEmpty) {
    final haystack = [
      post.title,
      post.body,
      post.meta,
      post.type,
    ].join(' ').toLowerCase();
    if (!haystack.contains(query)) {
      return false;
    }
  }
  final type = request.type?.trim();
  if (type != null && type.isNotEmpty && post.type != type) {
    return false;
  }
  return _touchesRange(post.startsAt ?? post.updatedAt, post.endsAt, request);
}

bool _isVisibleForAccessToken(LifePost post, String? accessToken) {
  if (post.status != 'published') {
    return false;
  }
  if (post.visibility == 'public') {
    return true;
  }
  return accessToken != null && post.visibility == 'members';
}

bool _touchesRange(
  DateTime? startsAt,
  DateTime? endsAt,
  LifePostListRequest request,
) {
  if (request.from == null && request.to == null) {
    return true;
  }
  final start = startsAt;
  if (start == null) {
    return false;
  }
  final end = endsAt ?? start;
  if (request.from != null && !end.isAfter(request.from!)) {
    return false;
  }
  if (request.to != null && !start.isBefore(request.to!)) {
    return false;
  }
  return true;
}

class _MockRegistration {
  const _MockRegistration({
    required this.partySize,
    required this.status,
    this.note,
    this.checkedInAt,
    this.checkInMethod,
  });

  final int partySize;
  final String status;
  final String? note;
  final DateTime? checkedInAt;
  final String? checkInMethod;
}

LifePostDto _toDto(
  LifePost post, {
  _MockRegistration? registration,
  DateTime? readAt,
}) {
  final partySize = registration?.partySize ?? 0;
  final baseRegisteredCount = post.registrationSummary?.registeredCount ?? 0;
  final registeredCount = baseRegisteredCount + partySize;
  final updatedAt =
      post.updatedAt ?? post.startsAt ?? DateTime.utc(2026, 5, 1, 17);
  return LifePostDto.fromJson({
    'id': post.id,
    'type': post.type,
    'title': post.title,
    'body': post.body,
    'meta': post.meta,
    'iconName': post.iconName,
    'startsAt': post.startsAt?.toIso8601String(),
    'endsAt': post.endsAt?.toIso8601String(),
    'visibility': post.visibility,
    'status': post.status,
    'imageUrl': post.imageUrl,
    'displayWeight': post.displayWeight,
    'ctaLabel': post.ctaLabel,
    'ctaUrl': post.ctaUrl,
    'registrationEnabled': post.registrationEnabled,
    'registrationCapacity': post.registrationCapacity,
    'registrationDeadline': post.registrationDeadline?.toIso8601String(),
    'registrationAllowCancellation': post.registrationAllowCancellation,
    'registrationMaxPartySize': post.registrationMaxPartySize,
    'updatedAt': updatedAt.toIso8601String(),
    'isRead': readAt != null && !readAt.isBefore(updatedAt),
    'readAt': readAt?.toIso8601String(),
    'registrationSummary': {
      'enabled': post.registrationEnabled,
      'capacity': post.registrationCapacity,
      'registeredCount': registeredCount,
      'remainingCount': post.registrationCapacity == null
          ? null
          : post.registrationCapacity! - registeredCount,
      'myRegistrationStatus': registration?.status,
      'myPartySize': registration?.partySize,
      'myNote': registration?.note,
      'myCheckedInAt': registration?.checkedInAt?.toIso8601String(),
      'myCheckInMethod': registration?.checkInMethod,
    },
  });
}
