part of 'life_repository_test.dart';

const _cachedLifePostDto = LifePostDto(
  id: 'cached-life-post',
  type: 'fellowship',
  title: 'Cached fellowship',
  body: 'Stored for offline church life.',
  meta: 'Friday 7:30 PM',
  iconName: 'groups',
  startsAt: '2026-05-29T19:30:00.000Z',
  visibility: 'public',
  status: 'published',
  displayWeight: 100,
  ctaLabel: '报名团契',
  ctaUrl: 'https://example.com/fellowship',
);

class _EmptyLifeRemoteDataSource implements LifeRemoteDataSource {
  @override
  Future<List<LifePostDto>> fetchLifePosts({
    String? accessToken,
    LifePostListRequest request = const LifePostListRequest(),
  }) async {
    return const [];
  }

  @override
  Future<LifePostDto?> fetchLifePostById(
    String postId, {
    String? accessToken,
  }) async {
    return null;
  }

  @override
  Future<LifePostDto> markLifePostRead(String postId, String accessToken) {
    throw StateError('life post not found');
  }

  @override
  Future<LifePostDto> registerForEvent(
    String postId,
    String accessToken, {
    required int partySize,
    String? note,
  }) {
    throw StateError('life post not found');
  }

  @override
  Future<LifePostDto> updateEventRegistration(
    String postId,
    String accessToken, {
    required int partySize,
    String? note,
  }) {
    throw StateError('life post not found');
  }

  @override
  Future<LifePostDto> cancelEventRegistration(
    String postId,
    String accessToken,
  ) {
    throw StateError('life post not found');
  }

  @override
  Future<LifePostDto> checkInEventRegistration(
    String postId,
    String accessToken,
  ) {
    throw StateError('life post not found');
  }

  @override
  Future<LifePostDto> checkInEventRegistrationWithCode(
    String code,
    String accessToken,
  ) {
    throw StateError('life post not found');
  }
}

class _FailingLifeRemoteDataSource implements LifeRemoteDataSource {
  @override
  Future<List<LifePostDto>> fetchLifePosts({
    String? accessToken,
    LifePostListRequest request = const LifePostListRequest(),
  }) async {
    throw StateError('backend unavailable');
  }

  @override
  Future<LifePostDto?> fetchLifePostById(
    String postId, {
    String? accessToken,
  }) async {
    throw StateError('backend unavailable');
  }

  @override
  Future<LifePostDto> markLifePostRead(String postId, String accessToken) {
    throw StateError('backend unavailable');
  }

  @override
  Future<LifePostDto> registerForEvent(
    String postId,
    String accessToken, {
    required int partySize,
    String? note,
  }) {
    throw StateError('backend unavailable');
  }

  @override
  Future<LifePostDto> updateEventRegistration(
    String postId,
    String accessToken, {
    required int partySize,
    String? note,
  }) {
    throw StateError('backend unavailable');
  }

  @override
  Future<LifePostDto> cancelEventRegistration(
    String postId,
    String accessToken,
  ) {
    throw StateError('backend unavailable');
  }

  @override
  Future<LifePostDto> checkInEventRegistration(
    String postId,
    String accessToken,
  ) {
    throw StateError('backend unavailable');
  }

  @override
  Future<LifePostDto> checkInEventRegistrationWithCode(
    String code,
    String accessToken,
  ) {
    throw StateError('backend unavailable');
  }
}

class _RegistrationThenFailLifeRemoteDataSource
    extends _FailingLifeRemoteDataSource {
  _RegistrationThenFailLifeRemoteDataSource(this.registeredPost);

  final LifePostDto registeredPost;

  @override
  Future<LifePostDto> registerForEvent(
    String postId,
    String accessToken, {
    required int partySize,
    String? note,
  }) async {
    return registeredPost;
  }
}

class _ContractFailingLifeRemoteDataSource
    extends _FailingLifeRemoteDataSource {
  @override
  Future<List<LifePostDto>> fetchLifePosts({
    String? accessToken,
    LifePostListRequest request = const LifePostListRequest(),
  }) async {
    throw const FormatException('Malformed life post contract.');
  }

  @override
  Future<LifePostDto?> fetchLifePostById(
    String postId, {
    String? accessToken,
  }) async {
    throw const FormatException('Malformed life post contract.');
  }
}

class _NotFoundLifeRemoteDataSource implements LifeRemoteDataSource {
  @override
  Future<List<LifePostDto>> fetchLifePosts({
    String? accessToken,
    LifePostListRequest request = const LifePostListRequest(),
  }) async {
    return const [];
  }

  @override
  Future<LifePostDto?> fetchLifePostById(
    String postId, {
    String? accessToken,
  }) async {
    throw const ApiError(
      message: 'Life post not found.',
      statusCode: 404,
      code: 'event_not_found',
    );
  }

  @override
  Future<LifePostDto> markLifePostRead(String postId, String accessToken) {
    throw StateError('life post not found');
  }

  @override
  Future<LifePostDto> registerForEvent(
    String postId,
    String accessToken, {
    required int partySize,
    String? note,
  }) {
    throw StateError('life post not found');
  }

  @override
  Future<LifePostDto> updateEventRegistration(
    String postId,
    String accessToken, {
    required int partySize,
    String? note,
  }) {
    throw StateError('life post not found');
  }

  @override
  Future<LifePostDto> cancelEventRegistration(
    String postId,
    String accessToken,
  ) {
    throw StateError('life post not found');
  }

  @override
  Future<LifePostDto> checkInEventRegistration(
    String postId,
    String accessToken,
  ) {
    throw StateError('life post not found');
  }

  @override
  Future<LifePostDto> checkInEventRegistrationWithCode(
    String code,
    String accessToken,
  ) {
    throw StateError('life post not found');
  }
}

class _StaticLifeRemoteDataSource implements LifeRemoteDataSource {
  const _StaticLifeRemoteDataSource(this.posts);

  final List<LifePostDto> posts;

  @override
  Future<List<LifePostDto>> fetchLifePosts({
    String? accessToken,
    LifePostListRequest request = const LifePostListRequest(),
  }) async {
    return posts;
  }

  @override
  Future<LifePostDto?> fetchLifePostById(
    String postId, {
    String? accessToken,
  }) async {
    return posts.where((post) => post.id == postId).firstOrNull;
  }

  @override
  Future<LifePostDto> markLifePostRead(
    String postId,
    String accessToken,
  ) async {
    return posts
        .where((post) => post.id == postId)
        .first
        .copyWith(isRead: true, readAt: '2026-05-29T20:00:00.000Z');
  }

  @override
  Future<LifePostDto> registerForEvent(
    String postId,
    String accessToken, {
    required int partySize,
    String? note,
  }) async {
    return posts.where((post) => post.id == postId).first;
  }

  @override
  Future<LifePostDto> updateEventRegistration(
    String postId,
    String accessToken, {
    required int partySize,
    String? note,
  }) async {
    return posts.where((post) => post.id == postId).first;
  }

  @override
  Future<LifePostDto> cancelEventRegistration(
    String postId,
    String accessToken,
  ) async {
    return posts.where((post) => post.id == postId).first;
  }

  @override
  Future<LifePostDto> checkInEventRegistration(
    String postId,
    String accessToken,
  ) async {
    return posts.where((post) => post.id == postId).first;
  }

  @override
  Future<LifePostDto> checkInEventRegistrationWithCode(
    String code,
    String accessToken,
  ) async {
    return posts.first;
  }
}

class _RecordingLifeRemoteDataSource implements LifeRemoteDataSource {
  const _RecordingLifeRemoteDataSource(this.posts);

  final List<LifePostDto> posts;
  static String? _lastListAccessToken;
  static String? _lastDetailAccessToken;
  static String? _lastMarkReadAccessToken;
  static String? _lastMarkedReadPostId;

  String? get lastListAccessToken => _lastListAccessToken;
  String? get lastDetailAccessToken => _lastDetailAccessToken;
  String? get lastMarkReadAccessToken => _lastMarkReadAccessToken;
  String? get lastMarkedReadPostId => _lastMarkedReadPostId;

  @override
  Future<List<LifePostDto>> fetchLifePosts({
    String? accessToken,
    LifePostListRequest request = const LifePostListRequest(),
  }) async {
    _lastListAccessToken = accessToken;
    return posts;
  }

  @override
  Future<LifePostDto?> fetchLifePostById(
    String postId, {
    String? accessToken,
  }) async {
    _lastDetailAccessToken = accessToken;
    return posts.where((post) => post.id == postId).firstOrNull;
  }

  @override
  Future<LifePostDto> markLifePostRead(
    String postId,
    String accessToken,
  ) async {
    _lastMarkReadAccessToken = accessToken;
    _lastMarkedReadPostId = postId;
    return posts
        .where((post) => post.id == postId)
        .first
        .copyWith(isRead: true, readAt: '2026-05-29T20:00:00.000Z');
  }

  @override
  Future<LifePostDto> registerForEvent(
    String postId,
    String accessToken, {
    required int partySize,
    String? note,
  }) async {
    return posts.where((post) => post.id == postId).first;
  }

  @override
  Future<LifePostDto> updateEventRegistration(
    String postId,
    String accessToken, {
    required int partySize,
    String? note,
  }) async {
    return posts.where((post) => post.id == postId).first;
  }

  @override
  Future<LifePostDto> cancelEventRegistration(
    String postId,
    String accessToken,
  ) async {
    return posts.where((post) => post.id == postId).first;
  }

  @override
  Future<LifePostDto> checkInEventRegistration(
    String postId,
    String accessToken,
  ) async {
    return posts.where((post) => post.id == postId).first;
  }

  @override
  Future<LifePostDto> checkInEventRegistrationWithCode(
    String code,
    String accessToken,
  ) async {
    return posts.first;
  }
}

class _LifeApiDio {
  _LifeApiDio({this.responseData = _apiLifePostJson}) {
    instance.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          requests.add(
            _RecordedLifeApiRequest(
              path: options.path,
              authorization: options.headers['authorization'] as String?,
              data: options.data,
            ),
          );
          handler.resolve(
            Response<Object?>(
              requestOptions: options,
              statusCode: 200,
              data: {'data': responseData, 'meta': <String, Object?>{}},
            ),
          );
        },
      ),
    );
  }

  final Dio instance = Dio(BaseOptions(baseUrl: _testAppConfig.apiBaseUrl));
  final Object? responseData;
  final List<_RecordedLifeApiRequest> requests = [];
}

class _RecordedLifeApiRequest {
  const _RecordedLifeApiRequest({
    required this.path,
    required this.authorization,
    required this.data,
  });

  final String path;
  final String? authorization;
  final Object? data;
}

const _memberSession = MemberSession(
  accessToken: 'member-token',
  member: MemberProfile(
    id: 'member-1',
    email: 'member@example.com',
    displayName: 'Member',
    roles: [],
    appLocale: 'zh',
    fellowshipGroupId: null,
    notificationSettings: MemberNotificationSettings.defaults,
  ),
);

const _apiLifePostJson = {
  'id': 'event/friday night',
  'type': 'fellowship',
  'title': 'Friday fellowship',
  'body': 'Dinner and prayer.',
  'meta': 'Friday 7:30 PM',
  'iconName': 'groups',
  'startsAt': null,
  'endsAt': null,
  'visibility': 'public',
  'status': 'published',
  'imageUrl': null,
  'displayWeight': 0,
  'ctaLabel': null,
  'ctaUrl': null,
  'registrationEnabled': false,
  'registrationCapacity': null,
  'registrationDeadline': null,
  'registrationAllowCancellation': true,
  'registrationMaxPartySize': 1,
  'registrationSummary': {
    'enabled': false,
    'capacity': null,
    'registeredCount': 0,
    'remainingCount': null,
    'myRegistrationStatus': null,
    'myPartySize': null,
    'myNote': null,
    'myCheckedInAt': null,
    'myCheckInMethod': null,
  },
  'updatedAt': '2026-05-29T19:30:00.000Z',
};

const _testAppConfig = AppConfig(
  apiBaseUrl: 'https://api.test/v1',
  useMockRemoteData: false,
);
