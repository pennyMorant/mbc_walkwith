import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/settings/app_settings.dart';
import 'package:mbc_walkwith/core/settings/app_settings_repository.dart';
import 'package:mbc_walkwith/features/life/data/care_repository.dart';
import 'package:mbc_walkwith/features/life/data/course_repository.dart';
import 'package:mbc_walkwith/features/life/data/group_repository.dart';
import 'package:mbc_walkwith/features/life/data/life_repository.dart';
import 'package:mbc_walkwith/features/life/data/prayer_repository.dart';
import 'package:mbc_walkwith/features/life/data/serving_repository.dart';
import 'package:mbc_walkwith/features/life/domain/care_request.dart';
import 'package:mbc_walkwith/features/life/domain/course_learning.dart';
import 'package:mbc_walkwith/features/life/domain/life_post.dart';
import 'package:mbc_walkwith/features/life/domain/life_post_list_request.dart';
import 'package:mbc_walkwith/features/life/domain/ministry_group.dart';
import 'package:mbc_walkwith/features/life/domain/prayer_request.dart';
import 'package:mbc_walkwith/features/life/domain/serving_assignment.dart';
import 'package:mbc_walkwith/features/life/presentation/life_tab.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets(
    'life pull refresh completes when the post list refresh finishes',
    (tester) async {
      final lifeRepository = _RefreshAwareLifeRepository();
      final publicPrayerRequests = Completer<List<PrayerRequest>>();
      final memberPrayerRequests = Completer<List<PrayerRequest>>();
      final ministryGroups = Completer<List<MinistryGroup>>();
      final courses = Completer<List<CourseLearning>>();
      final servingAssignments = Completer<List<ServingAssignment>>();
      final careRequests = Completer<List<CareRequest>>();

      addTearDown(() {
        if (!publicPrayerRequests.isCompleted) {
          publicPrayerRequests.complete([]);
        }
        if (!memberPrayerRequests.isCompleted) {
          memberPrayerRequests.complete([]);
        }
        if (!ministryGroups.isCompleted) ministryGroups.complete([]);
        if (!courses.isCompleted) courses.complete([]);
        if (!servingAssignments.isCompleted) servingAssignments.complete([]);
        if (!careRequests.isCompleted) careRequests.complete([]);
      });

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            lifeRepositoryProvider.overrideWithValue(lifeRepository),
            memberSessionProvider.overrideWith((ref) async => null),
            appSettingsProvider.overrideWith(
              (ref) async => AppSettings.defaults,
            ),
            publicPrayerRequestsProvider.overrideWith(
              (ref) => publicPrayerRequests.future,
            ),
            memberPrayerRequestsProvider.overrideWith(
              (ref) => memberPrayerRequests.future,
            ),
            ministryGroupsProvider.overrideWith((ref) => ministryGroups.future),
            coursesProvider.overrideWith((ref) => courses.future),
            servingAssignmentsProvider.overrideWith(
              (ref) => servingAssignments.future,
            ),
            careRequestsProvider.overrideWith((ref) => careRequests.future),
          ],
          child: MaterialApp(
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            supportedLocales: AppLocalizations.supportedLocales,
            theme: AppTheme.build(null, Brightness.light),
            home: const LifeTab(),
          ),
        ),
      );

      await _pumpUntilFound(tester, find.byType(RefreshIndicator));

      final initialPeriods = lifeRepository.requests
          .where((request) => request.from != null && request.to != null)
          .toList();
      expect(
        initialPeriods.any(
          (request) => request.to!.difference(request.from!).inDays == 7,
        ),
        isTrue,
      );
      expect(
        initialPeriods.any((request) {
          final days = request.to!.difference(request.from!).inDays;
          return days >= 28 && days <= 31;
        }),
        isTrue,
      );

      final refreshIndicator = tester.widget<RefreshIndicator>(
        find.byType(RefreshIndicator),
      );
      lifeRepository.armNextRefresh();
      final refreshFuture = refreshIndicator.onRefresh();
      var didComplete = false;
      unawaited(refreshFuture.then((_) => didComplete = true));

      await tester.pump();
      expect(didComplete, isFalse);
      expect(lifeRepository.refreshCount, 3);

      lifeRepository.completeRefreshes();
      await tester.pump();

      await refreshFuture.timeout(const Duration(milliseconds: 200));
      expect(didComplete, isTrue);
      expect(publicPrayerRequests.isCompleted, isFalse);
      expect(memberPrayerRequests.isCompleted, isFalse);
      expect(ministryGroups.isCompleted, isFalse);
      expect(courses.isCompleted, isFalse);
      expect(servingAssignments.isCompleted, isFalse);
      expect(careRequests.isCompleted, isFalse);
    },
  );
}

Future<void> _pumpUntilFound(
  WidgetTester tester,
  Finder finder, {
  int maxPumps = 20,
}) async {
  for (var i = 0; i < maxPumps; i += 1) {
    await tester.pump(const Duration(milliseconds: 50));
    if (finder.evaluate().isNotEmpty) {
      return;
    }
  }
  throw TestFailure('Timed out waiting for $finder');
}

class _RefreshAwareLifeRepository implements LifeRepository {
  bool _nextCallIsRefresh = false;
  final List<LifePostListRequest> requests = [];
  final List<Completer<List<LifePost>>> _refreshCompleters = [];

  int get refreshCount => _refreshCompleters.length;

  void armNextRefresh() {
    _nextCallIsRefresh = true;
  }

  @override
  Future<List<LifePost>> getLifePosts({
    MemberSession? session,
    LifePostListRequest request = const LifePostListRequest(),
  }) {
    requests.add(request);
    if (_nextCallIsRefresh) {
      final completer = Completer<List<LifePost>>();
      _refreshCompleters.add(completer);
      return completer.future;
    }
    return Future.value([_post('initial-life-post', 'Initial Life Post')]);
  }

  void completeRefreshes() {
    if (_refreshCompleters.length != 3) {
      throw StateError('Refresh was not started');
    }
    for (final completer in _refreshCompleters) {
      completer.complete([_post('refreshed-life-post', 'Refreshed Life Post')]);
    }
  }

  @override
  Future<LifePost?> getLifePostById(
    String postId, {
    MemberSession? session,
  }) async {
    return null;
  }

  @override
  Future<LifePost> markLifePostRead(String postId, MemberSession session) {
    throw UnimplementedError();
  }

  @override
  Future<LifePost> registerForEvent(
    String postId,
    MemberSession session, {
    required int partySize,
    String? note,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<LifePost> updateEventRegistration(
    String postId,
    MemberSession session, {
    required int partySize,
    String? note,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<LifePost> cancelEventRegistration(
    String postId,
    MemberSession session,
  ) {
    throw UnimplementedError();
  }

  @override
  Future<LifePost> checkInEventRegistration(
    String postId,
    MemberSession session,
  ) {
    throw UnimplementedError();
  }

  @override
  Future<LifePost> checkInEventRegistrationWithCode(
    String code,
    MemberSession session,
  ) {
    throw UnimplementedError();
  }
}

LifePost _post(String id, String title) {
  return LifePost(
    id: id,
    type: 'announcement',
    title: title,
    body: 'Life refresh test body.',
    meta: '',
    iconName: 'campaign',
    startsAt: DateTime.utc(2026, 6, 27, 17),
    status: 'published',
  );
}
