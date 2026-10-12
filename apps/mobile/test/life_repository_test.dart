import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
import 'package:mbc_walkwith/core/api/api_error.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';
import 'package:mbc_walkwith/core/database/app_database.dart';
import 'package:mbc_walkwith/features/life/data/dto/care_request_dto.dart';
import 'package:mbc_walkwith/features/life/data/dto/life_post_dto.dart';
import 'package:mbc_walkwith/features/life/data/local/life_local_data_source.dart';
import 'package:mbc_walkwith/features/life/data/life_repository.dart';
import 'package:mbc_walkwith/features/life/data/remote/api_life_remote_data_source.dart';
import 'package:mbc_walkwith/features/life/data/remote/life_remote_data_source.dart';
import 'package:mbc_walkwith/features/life/data/remote/mock_life_remote_data_source.dart';
import 'package:mbc_walkwith/features/life/domain/life_post.dart';
import 'package:mbc_walkwith/features/life/domain/life_post_list_request.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';

import 'test_database.dart';

part 'life_repository_fakes.dart';

void main() {
  test(
    'returns an empty life post list when the backend returns no posts',
    () async {
      final repository = RemoteLifeRepository(
        remoteDataSource: _EmptyLifeRemoteDataSource(),
      );

      await expectLater(repository.getLifePosts(), completion(isEmpty));
    },
  );

  test('maps care requests without exposing admin-only fields', () {
    final request = CareRequestDto.fromJson({
      'id': 'care-1',
      'userId': 'member-1',
      'memberDisplayName': 'Grace Member',
      'memberEmail': 'grace@example.com',
      'title': 'Pastoral care',
      'body': 'Please call me this week.',
      'status': 'assigned',
      'privacyLevel': 'pastoral_only',
      'assigneeName': 'Pastor Lee',
      'nextFollowUpAt': '2026-07-10T18:00:00.000Z',
      'createdAt': '2026-06-20T18:00:00.000Z',
      'updatedAt': '2026-06-21T18:00:00.000Z',
      'internalNote': 'Admin-only note',
      'followUps': [
        {'note': 'Admin-only follow-up'},
      ],
    }).toDomain();

    expect(request.id, 'care-1');
    expect(request.status, 'assigned');
    expect(request.assigneeName, 'Pastor Lee');
    expect(
      () => (request as dynamic).internalNote,
      throwsA(isA<NoSuchMethodError>()),
    );
    expect(
      () => (request as dynamic).followUps,
      throwsA(isA<NoSuchMethodError>()),
    );
  });

  test('surfaces remote life failures instead of using local data', () async {
    final repository = RemoteLifeRepository(
      remoteDataSource: _FailingLifeRemoteDataSource(),
    );

    await expectLater(repository.getLifePosts(), throwsA(isA<StateError>()));
  });

  test('returns cached life posts when remote list fails', () async {
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);
    final localDataSource = LifeLocalDataSource(database: database);
    await localDataSource.replaceLifePosts([_cachedLifePostDto]);
    final repository = CachedLifeRepository(
      remoteDataSource: _FailingLifeRemoteDataSource(),
      localDataSource: localDataSource,
    );

    final posts = await repository.getLifePosts();

    expect(posts, hasLength(1));
    expect(posts.single.id, 'cached-life-post');
    expect(posts.single.visibility, 'public');
    expect(posts.single.displayWeight, 100);
    expect(posts.single.ctaUrl, 'https://example.com/fellowship');
  });

  test('caches remote life posts for later offline use', () async {
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);
    final localDataSource = LifeLocalDataSource(database: database);
    final repository = CachedLifeRepository(
      remoteDataSource: _StaticLifeRemoteDataSource([_cachedLifePostDto]),
      localDataSource: localDataSource,
    );

    await repository.getLifePosts();
    final cached = await localDataSource.fetchLifePosts();

    expect(cached.single.id, 'cached-life-post');
    expect(cached.single.iconName, 'groups');
    expect(cached.single.displayWeight, 100);
    expect(cached.single.ctaLabel, '报名团契');
  });

  test(
    'does not replace offline content cache for a date-range request',
    () async {
      final database = AppDatabase(openTestDatabaseConnection());
      addTearDown(database.close);
      final localDataSource = LifeLocalDataSource(database: database);
      await localDataSource.replaceLifePosts([_cachedLifePostDto]);
      final rangedPost = _cachedLifePostDto.copyWith(id: 'current-week-post');
      final repository = CachedLifeRepository(
        remoteDataSource: _StaticLifeRemoteDataSource([rangedPost]),
        localDataSource: localDataSource,
      );

      await repository.getLifePosts(
        request: LifePostListRequest(
          from: DateTime.utc(2026, 6, 7),
          to: DateTime.utc(2026, 6, 14),
        ),
      );

      final cached = await localDataSource.fetchLifePosts();
      expect(cached.map((post) => post.id), ['cached-life-post']);
    },
  );

  test('uses member token when fetching member-visible life posts', () async {
    final remoteDataSource = _RecordingLifeRemoteDataSource([
      _cachedLifePostDto,
    ]);
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);
    final repository = CachedLifeRepository(
      remoteDataSource: remoteDataSource,
      localDataSource: LifeLocalDataSource(database: database),
    );

    await repository.getLifePosts(session: _memberSession);
    await repository.getLifePostById(
      'cached-life-post',
      session: _memberSession,
    );
    await repository.markLifePostRead('cached-life-post', _memberSession);

    expect(remoteDataSource.lastListAccessToken, 'member-token');
    expect(remoteDataSource.lastDetailAccessToken, 'member-token');
    expect(remoteDataSource.lastMarkReadAccessToken, 'member-token');
    expect(remoteDataSource.lastMarkedReadPostId, 'cached-life-post');
  });

  test('does not expose cached member-only life posts after logout', () async {
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);
    final localDataSource = LifeLocalDataSource(database: database);
    await localDataSource.replaceLifePosts([
      _cachedLifePostDto,
      _cachedLifePostDto.copyWith(id: 'members-only', visibility: 'members'),
    ]);
    final repository = CachedLifeRepository(
      remoteDataSource: _FailingLifeRemoteDataSource(),
      localDataSource: localDataSource,
    );

    final posts = await repository.getLifePosts();
    final detail = await repository.getLifePostById('members-only');

    expect(posts.map((post) => post.id), isNot(contains('members-only')));
    expect(detail, isNull);
  });

  test('does not expose cached unpublished life posts offline', () async {
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);
    final localDataSource = LifeLocalDataSource(database: database);
    await localDataSource.replaceLifePosts([
      _cachedLifePostDto,
      _cachedLifePostDto.copyWith(id: 'draft-post', status: 'draft'),
    ]);
    final repository = CachedLifeRepository(
      remoteDataSource: _FailingLifeRemoteDataSource(),
      localDataSource: localDataSource,
    );

    final posts = await repository.getLifePosts(session: _memberSession);
    final detail = await repository.getLifePostById(
      'draft-post',
      session: _memberSession,
    );

    expect(posts.map((post) => post.id), isNot(contains('draft-post')));
    expect(detail, isNull);
  });

  test('returns cached life post detail when remote detail fails', () async {
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);
    final localDataSource = LifeLocalDataSource(database: database);
    await localDataSource.replaceLifePosts([_cachedLifePostDto]);
    final repository = CachedLifeRepository(
      remoteDataSource: _FailingLifeRemoteDataSource(),
      localDataSource: localDataSource,
    );

    final post = await repository.getLifePostById('cached-life-post');

    expect(post?.title, 'Cached fellowship');
    expect(post?.startsAt, isNotNull);
  });

  test(
    'does not hide remote contract failures behind cached content',
    () async {
      final database = AppDatabase(openTestDatabaseConnection());
      addTearDown(database.close);
      final localDataSource = LifeLocalDataSource(database: database);
      await localDataSource.replaceLifePosts([_cachedLifePostDto]);
      final repository = CachedLifeRepository(
        remoteDataSource: _ContractFailingLifeRemoteDataSource(),
        localDataSource: localDataSource,
      );

      await expectLater(
        repository.getLifePosts(),
        throwsA(isA<FormatException>()),
      );
      await expectLater(
        repository.getLifePostById('cached-life-post'),
        throwsA(isA<FormatException>()),
      );
    },
  );

  test('removes cached life post detail when remote returns no post', () async {
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);
    final localDataSource = LifeLocalDataSource(database: database);
    await localDataSource.replaceLifePosts([_cachedLifePostDto]);
    final repository = CachedLifeRepository(
      remoteDataSource: _EmptyLifeRemoteDataSource(),
      localDataSource: localDataSource,
    );

    final post = await repository.getLifePostById('cached-life-post');

    expect(post, isNull);
    expect(await localDataSource.fetchLifePostById('cached-life-post'), isNull);
  });

  test(
    'removes cached life post detail when backend reports not found',
    () async {
      final database = AppDatabase(openTestDatabaseConnection());
      addTearDown(database.close);
      final localDataSource = LifeLocalDataSource(database: database);
      await localDataSource.replaceLifePosts([_cachedLifePostDto]);
      final repository = CachedLifeRepository(
        remoteDataSource: _NotFoundLifeRemoteDataSource(),
        localDataSource: localDataSource,
      );

      final post = await repository.getLifePostById('cached-life-post');

      expect(post, isNull);
      expect(
        await localDataSource.fetchLifePostById('cached-life-post'),
        isNull,
      );
    },
  );

  test('encodes life post ids in public and member API paths', () async {
    final dio = _LifeApiDio();
    final dataSource = ApiLifeRemoteDataSource(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );
    const postId = 'event/friday night';

    await dataSource.fetchLifePostById(postId);
    await dataSource.fetchLifePostById(postId, accessToken: 'member-token');
    await dataSource.markLifePostRead(postId, 'member-token');
    await dataSource.registerForEvent(
      postId,
      'member-token',
      partySize: 2,
      note: ' Please save seats. ',
    );
    await dataSource.updateEventRegistration(
      postId,
      'member-token',
      partySize: 3,
    );
    await dataSource.cancelEventRegistration(postId, 'member-token');
    await dataSource.checkInEventRegistration(postId, 'member-token');

    expect(dio.requests.map((request) => request.path), [
      '/life/posts/event%2Ffriday%20night',
      '/member/life/posts/event%2Ffriday%20night',
      '/member/life/posts/event%2Ffriday%20night/read',
      '/member/life/posts/event%2Ffriday%20night/register',
      '/member/life/posts/event%2Ffriday%20night/registration',
      '/member/life/posts/event%2Ffriday%20night/registration/cancel',
      '/member/life/posts/event%2Ffriday%20night/registration/check-in',
    ]);
    expect(dio.requests[3].data, {
      'partySize': 2,
      'note': 'Please save seats.',
    });
    expect(
      dio.requests.skip(1).every((request) {
        return request.authorization == 'Bearer member-token';
      }),
      isTrue,
    );
  });

  test('rejects malformed life list envelopes instead of returning empty', () {
    final dio = _LifeApiDio(responseData: const {'unexpected': true});
    final dataSource = ApiLifeRemoteDataSource(
      apiClient: ApiClient(config: _testAppConfig, dio: dio.instance),
    );

    expect(dataSource.fetchLifePosts(), throwsA(isA<FormatException>()));
  });

  test('keeps canonical registration state partitioned by member', () async {
    const registeredPost = LifePostDto(
      id: 'cached-life-post',
      type: 'fellowship',
      title: 'Cached fellowship',
      body: 'Stored for offline church life.',
      meta: 'Friday 7:30 PM',
      iconName: 'groups',
      visibility: 'public',
      status: 'published',
      registrationEnabled: true,
      registrationMaxPartySize: 4,
      registrationSummary: EventRegistrationSummaryDto(
        enabled: true,
        registeredCount: 2,
        myRegistrationStatus: 'confirmed',
        myPartySize: 2,
        myNote: 'Need two seats.',
      ),
      updatedAt: '2026-05-29T19:30:00.000Z',
    );
    const otherSession = MemberSession(
      accessToken: 'other-token',
      member: MemberProfile(
        id: 'member-2',
        email: 'other@example.com',
        displayName: 'Other Member',
        roles: [],
        appLocale: 'en',
        fellowshipGroupId: null,
        notificationSettings: MemberNotificationSettings.defaults,
      ),
    );
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);
    final repository = CachedLifeRepository(
      remoteDataSource: _RegistrationThenFailLifeRemoteDataSource(
        registeredPost,
      ),
      localDataSource: LifeLocalDataSource(database: database),
    );

    final registered = await repository.registerForEvent(
      registeredPost.id,
      _memberSession,
      partySize: 2,
      note: 'Need two seats.',
    );
    final sameMemberFallback = await repository.getLifePostById(
      registeredPost.id,
      session: _memberSession,
    );
    final otherMemberFallback = await repository.getLifePostById(
      registeredPost.id,
      session: otherSession,
    );

    expect(
      registered.registrationSummary?.myRegistrationStatus,
      EventRegistrationStatus.confirmed,
    );
    expect(sameMemberFallback?.registrationSummary?.isRegistered, isTrue);
    expect(otherMemberFallback?.registrationSummary, isNull);
  });

  test('mock life remote filters member-only posts for guests', () async {
    final dataSource = MockLifeRemoteDataSource();

    final guestPosts = await dataSource.fetchLifePosts();
    final memberPosts = await dataSource.fetchLifePosts(accessToken: 'token');
    final guestPrayer = await dataSource.fetchLifePostById('mock-life-prayer');
    final memberPrayer = await dataSource.fetchLifePostById(
      'mock-life-prayer',
      accessToken: 'token',
    );

    expect(
      guestPosts.map((post) => post.id),
      isNot(contains('mock-life-prayer')),
    );
    expect(memberPosts.map((post) => post.id), contains('mock-life-prayer'));
    expect(guestPrayer, isNull);
    expect(memberPrayer?.id, 'mock-life-prayer');
  });
}
