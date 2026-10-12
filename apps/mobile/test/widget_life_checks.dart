part of 'widget_test.dart';

void registerLifeWidgetChecks() {
  testWidgets(
    'life category tabs use the selected month instead of this week',
    (tester) async {
      final weekOnlyPost = LifePost(
        id: 'week-only-event',
        type: 'event',
        title: 'Week-only event',
        body: 'This item belongs only to the natural week feed.',
        meta: '',
        iconName: 'event',
      );
      final monthPost = LifePost(
        id: 'month-event',
        type: 'event',
        title: 'Monthly event',
        body: 'This item belongs to the selected month feed.',
        meta: '',
        iconName: 'event',
      );

      await tester.pumpWidget(
        MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          home: Scaffold(
            body: LifeDashboardView(
              weekPosts: [weekOnlyPost],
              monthPosts: [monthPost],
              heroPost: null,
              selectedTab: LifeDashboardTab.events,
              onTabChanged: (_) {},
              prayerEnabled: false,
              publicPrayerRequestsAsync: const AsyncData([]),
              memberPrayerRequestsAsync: const AsyncData([]),
              memberSession: null,
              groupsAsync: const AsyncData([]),
              coursesAsync: const AsyncData([]),
              servingAsync: const AsyncData([]),
              careRequestsAsync: const AsyncData([]),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Monthly event'), findsOneWidget);
      expect(find.text('Week-only event'), findsNothing);
    },
  );

  testWidgets('opens life post detail sheet by default', (tester) async {
    await tester.pumpWidget(_lifeDetailPresentationApp());

    await tester.tap(find.text('Open detail'));
    await _pumpUntilFound(tester, find.byType(DraggableScrollableSheet));
    await _pumpUntilFound(tester, find.text('本周主日崇拜'));

    expect(find.byType(DraggableScrollableSheet), findsOneWidget);
    expect(find.byIcon(Icons.arrow_back_rounded), findsNothing);
    expect(find.text('本周主日崇拜'), findsWidgets);
    expect(find.textContaining('儿童主日学同步进行'), findsWidgets);
  });

  testWidgets('can open life post detail as a route when configured', (
    tester,
  ) async {
    await tester.pumpWidget(
      _lifeDetailPresentationApp(mode: LifePostDetailPresentationMode.page),
    );

    await tester.tap(find.text('Open detail'));
    await _pumpUntilFound(tester, find.byIcon(Icons.arrow_back_rounded));

    expect(find.byType(DraggableScrollableSheet), findsNothing);
    expect(find.byType(NavigationBar).hitTestable(), findsNothing);
    expect(find.text('本周主日崇拜'), findsWidgets);
    expect(find.textContaining('儿童主日学同步进行'), findsWidgets);
  });

  testWidgets('life post detail shows a fallback when body is empty', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          lifeRepositoryProvider.overrideWithValue(
            _SingleLifePostRepository(
              LifePost(
                id: 'life-empty-body',
                type: '公告',
                title: '临时通知',
                body: '',
                meta: '',
                iconName: 'event',
                startsAt: DateTime.utc(2026, 6, 7, 17),
                visibility: 'members',
              ),
            ),
          ),
        ],
        child: MaterialApp(
          locale: const Locale('zh'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          home: const LifePostDetailPage(postId: 'life-empty-body'),
        ),
      ),
    );

    await _pumpUntilFound(tester, find.text('临时通知'));

    expect(find.text('详细内容会稍后补充。'), findsOneWidget);
    expect(find.textContaining('2026'), findsOneWidget);
  });

  testWidgets('life post card renders admin uploaded post metadata', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        locale: const Locale('zh'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        theme: AppTheme.build(null, Brightness.light),
        home: Scaffold(
          body: SingleChildScrollView(
            child: LifePostCard(
              post: LifePost(
                id: 'life-summer-meal',
                type: '团契',
                title: '夏季爱宴报名',
                body: '管理员发布的活动说明和报名提醒。',
                meta: '',
                iconName: 'meal',
                startsAt: DateTime.utc(2026, 5, 30, 2, 30),
                endsAt: DateTime.utc(2026, 5, 30, 4),
                visibility: 'members',
                imageUrl: 'https://example.com/life.jpg',
                displayWeight: 100,
                ctaLabel: '报名参加',
                ctaUrl: 'https://example.com/register',
              ),
            ),
          ),
        ),
      ),
    );

    expect(find.text('团契'), findsOneWidget);
    expect(find.text('夏季爱宴报名'), findsWidgets);
    expect(find.byIcon(Icons.push_pin_outlined), findsNothing);
    expect(find.widgetWithText(FilledButton, '报名参加'), findsOneWidget);
    expect(find.text('会众可见'), findsOneWidget);
    expect(find.textContaining('02:30-04:00'), findsOneWidget);
    expect(find.byType(Image), findsOneWidget);
  });

  testWidgets('life tab surfaces member event registrations', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          lifeRepositoryProvider.overrideWithValue(
            _SingleLifePostRepository(
              LifePost(
                id: 'registered-retreat',
                type: '活动',
                title: '退修会报名',
                body: '周末退修会交通与餐食安排。',
                meta: '',
                iconName: 'event',
                startsAt: DateTime.utc(2026, 6, 26, 16),
                registrationEnabled: true,
                registrationCapacity: 40,
                registrationMaxPartySize: 5,
                registrationSummary: const EventRegistrationSummary(
                  enabled: true,
                  capacity: 40,
                  registeredCount: 12,
                  remainingCount: 28,
                  myRegistrationStatus: EventRegistrationStatus.confirmed,
                  myPartySize: 3,
                  myNote: '需要儿童餐',
                ),
              ),
              extraPosts: [
                LifePost(
                  id: 'life-sunday-hero',
                  type: '主日',
                  title: '本周主日崇拜',
                  body: '主日崇拜安排。',
                  meta: '周日 10:00 AM',
                  iconName: 'church',
                  startsAt: DateTime.utc(2026, 6, 21, 17),
                ),
              ],
            ),
          ),
          memberSessionProvider.overrideWith(
            (ref) async => const MemberSession(
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
            ),
          ),
          appSettingsProvider.overrideWith(
            (ref) async => const AppSettings(
              churchName: 'MBC WalkWith',
              defaultLocale: 'zh',
              prayerEnabled: false,
              givingEnabled: false,
            ),
          ),
          publicPrayerRequestsProvider.overrideWith((ref) async => const []),
          memberPrayerRequestsProvider.overrideWith((ref) async => const []),
          ministryGroupsProvider.overrideWith((ref) async => const []),
          coursesProvider.overrideWith((ref) async => const []),
          servingAssignmentsProvider.overrideWith((ref) async => const []),
          careRequestsProvider.overrideWith((ref) async => const []),
        ],
        child: MaterialApp(
          locale: const Locale('zh'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          home: const LifeTab(),
        ),
      ),
    );

    await _pumpUntilFound(tester, find.text('退修会报名'));

    expect(find.text('退修会报名'), findsWidgets);
    expect(find.textContaining('3 人'), findsOneWidget);
    expect(find.textContaining('需要儿童餐'), findsOneWidget);
  });

  testWidgets('life event registration uses localized backend error codes', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          lifeRepositoryProvider.overrideWithValue(
            _SingleLifePostRepository(
              LifePost(
                id: 'locked-registration',
                type: '活动',
                title: '已签到活动',
                body: '报名已经签到。',
                meta: '',
                iconName: 'event',
                startsAt: DateTime.utc(2026, 8, 1, 16),
                registrationEnabled: true,
                registrationCapacity: 20,
                registrationSummary: const EventRegistrationSummary(
                  enabled: true,
                  capacity: 20,
                  registeredCount: 1,
                  remainingCount: 19,
                  myRegistrationStatus: EventRegistrationStatus.confirmed,
                  myPartySize: 1,
                ),
              ),
              updateError: const ApiError(
                message: 'Checked-in registrations cannot be edited.',
                code: 'check_in_not_allowed',
                statusCode: 409,
              ),
            ),
          ),
          memberSessionProvider.overrideWith(
            (ref) async => const MemberSession(
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
            ),
          ),
        ],
        child: MaterialApp(
          locale: const Locale('zh'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          home: const LifePostDetailPage(postId: 'locked-registration'),
        ),
      ),
    );

    await _pumpUntilFound(tester, find.text('保存修改'));
    await tester.tap(find.widgetWithText(FilledButton, '保存修改'));
    await tester.pumpAndSettle();

    expect(find.text('已签到的报名只能由同工修改。'), findsOneWidget);
  });
}
