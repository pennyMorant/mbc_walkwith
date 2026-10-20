import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/life/data/life_repository.dart';
import 'package:mbc_walkwith/features/life/domain/life_post.dart';
import 'package:mbc_walkwith/features/life/domain/life_post_list_request.dart';
import 'package:mbc_walkwith/features/life/presentation/life_post_read_controller.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';

void main() {
  testWidgets('read intent invalidates every visible Life post projection', (
    tester,
  ) async {
    final repository = _ProjectionRepository();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          lifeRepositoryProvider.overrideWithValue(repository),
          memberSessionProvider.overrideWith((ref) async => _session),
        ],
        child: const MaterialApp(home: _ProjectionHarness()),
      ),
    );
    await tester.pumpAndSettle();

    final listCallsBeforeRead = repository.listCalls;
    final latestCallsBeforeRead = repository.latestCalls;
    final detailCallsBeforeRead = repository.detailCalls;

    await tester.tap(find.text('Mark read'));
    await tester.pumpAndSettle();

    expect(repository.markReadCalls, 1);
    expect(repository.listCalls, listCallsBeforeRead + 2);
    expect(repository.latestCalls, latestCallsBeforeRead + 1);
    expect(repository.detailCalls, detailCallsBeforeRead + 1);
  });
}

class _ProjectionHarness extends ConsumerWidget {
  const _ProjectionHarness();

  static const request = LifePostListRequest(limit: 1);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(lifePostsProvider);
    ref.watch(lifePostListProvider(request));
    ref.watch(latestLifeBulletinProvider(request));
    ref.watch(lifePostByIdProvider(_post.id));
    return Scaffold(
      body: Center(
        child: FilledButton(
          onPressed: () =>
              markLifePostReadAndRefresh(ref, post: _post, session: _session),
          child: const Text('Mark read'),
        ),
      ),
    );
  }
}

class _ProjectionRepository extends LifeRepository {
  int listCalls = 0;
  int latestCalls = 0;
  int detailCalls = 0;
  int markReadCalls = 0;

  @override
  Future<List<LifePost>> getLifePosts({
    MemberSession? session,
    LifePostListRequest request = const LifePostListRequest(),
  }) async {
    listCalls += 1;
    return const [_post];
  }

  @override
  Future<LifePost?> getLatestBulletin({
    MemberSession? session,
    required LifePostListRequest request,
  }) async {
    latestCalls += 1;
    return _post;
  }

  @override
  Future<LifePost?> getLifePostById(
    String postId, {
    MemberSession? session,
  }) async {
    detailCalls += 1;
    return _post;
  }

  @override
  Future<LifePost> markLifePostRead(
    String postId,
    MemberSession session,
  ) async {
    markReadCalls += 1;
    return _post;
  }

  @override
  Future<LifePost> registerForEvent(
    String postId,
    MemberSession session, {
    required int partySize,
    String? note,
  }) => throw UnimplementedError();

  @override
  Future<LifePost> updateEventRegistration(
    String postId,
    MemberSession session, {
    required int partySize,
    String? note,
  }) => throw UnimplementedError();

  @override
  Future<LifePost> cancelEventRegistration(
    String postId,
    MemberSession session,
  ) => throw UnimplementedError();

  @override
  Future<LifePost> checkInEventRegistration(
    String postId,
    MemberSession session,
  ) => throw UnimplementedError();

  @override
  Future<LifePost> checkInEventRegistrationWithCode(
    String code,
    MemberSession session,
  ) => throw UnimplementedError();
}

const _post = LifePost(
  id: 'weekly-bulletin',
  type: 'weekly_bulletin',
  title: 'Weekly bulletin',
  body: 'Body',
  meta: '',
  iconName: 'article',
);

const _session = MemberSession(
  accessToken: 'member-token',
  member: MemberProfile(
    id: 'member-1',
    email: 'member@example.com',
    displayName: 'Member',
    roles: [],
    appLocale: 'en',
    fellowshipGroupId: null,
    notificationSettings: MemberNotificationSettings.defaults,
  ),
);
