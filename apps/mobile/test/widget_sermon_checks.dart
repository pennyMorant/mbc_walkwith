part of 'widget_test.dart';

void registerSermonWidgetChecks() {
  testWidgets('keeps sermon discovery controls hidden by default', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(360, 800);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    final harness = await _localizedApp(locale: const Locale('zh'));
    addTearDown(harness.close);

    await tester.pumpWidget(harness.widget);
    await _pumpUntilFound(tester, find.text('读经'));
    await tester.tap(find.byIcon(Icons.graphic_eq_outlined));
    await _pumpUntilFound(tester, find.text('在苦难中的盼望'));

    expect(find.byIcon(Icons.tune), findsNothing);
    expect(find.byIcon(Icons.search), findsNothing);
  });

  testWidgets('disables the restored filter while facets load', (tester) async {
    final prefs = await _testSharedPreferences();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
          appConfigProvider.overrideWithValue(_testAppConfig),
          sermonsRepositoryProvider.overrideWithValue(
            _LoadingFacetsSermonsRepository(),
          ),
        ],
        child: MaterialApp(
          locale: const Locale('en'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          home: const SermonsTab(showDiscoveryControls: true),
        ),
      ),
    );

    await _pumpUntilFound(tester, find.byIcon(Icons.tune));

    final filterAction = tester.widget<InkWell>(
      find.descendant(
        of: find.byTooltip('Filter sermons'),
        matching: find.byType(InkWell),
      ),
    );
    expect(filterAction.onTap, isNull);
  });

  testWidgets('sermons empty month remains refreshable and labels period', (
    tester,
  ) async {
    final prefs = await _testSharedPreferences();
    final previousMonth = DatePeriod.current(DatePeriodMode.month).previous;

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
          appConfigProvider.overrideWithValue(_testAppConfig),
          sermonsRepositoryProvider.overrideWithValue(
            _EmptySermonsRepository(),
          ),
        ],
        child: MaterialApp(
          locale: const Locale('en'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          home: const SermonsTab(),
        ),
      ),
    );

    await _pumpUntilFound(tester, find.text('No sermons yet'));
    expect(find.byType(RefreshIndicator), findsOneWidget);
    expect(find.text('Sermons'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.calendar_month_outlined));
    await tester.pumpAndSettle();
    final currentMonth = DatePeriod.current(DatePeriodMode.month);
    if (previousMonth.start.year != currentMonth.start.year) {
      await tester.tap(find.byTooltip('Previous'));
      await tester.pump();
    }
    final expectedMonth = DateFormat.MMM('en').format(previousMonth.start);
    await tester.tap(find.text(expectedMonth).last);
    await tester.pumpAndSettle();

    expect(find.text(expectedMonth), findsOneWidget);
    expect(find.text('Sermons'), findsOneWidget);
    expect(find.text('No sermons yet'), findsOneWidget);
  });

  testWidgets('opens Bible reader from sermon scripture reference', (
    tester,
  ) async {
    final harness = await _localizedApp(locale: const Locale('zh'));
    addTearDown(harness.close);
    await tester.runAsync(
      () => harness.seedBible(verseTranslationIds: const ['cuvs']),
    );

    await tester.pumpWidget(harness.widget);
    await _pumpUntilFound(tester, find.text('读经'));

    await tester.tap(find.byIcon(Icons.graphic_eq_outlined));
    await _pumpUntilFound(tester, find.text('在苦难中的盼望'));

    await _openSermonDetail(tester, '在苦难中的盼望');
    await _pumpUntilFound(tester, find.text('讲道详情'));
    await _scrollUntilFound(tester, find.text('经文'));
    await tester.tap(find.text('经文').hitTestable().first);
    await _scrollUntilFound(tester, find.text('罗马书 8:28'));
    await tester.tap(find.text('罗马书 8:28').hitTestable().first);
    await _pumpUntilFound(
      tester,
      find.textContaining('我们晓得万事都互相效力').hitTestable(),
    );

    expect(find.text('罗马书 8'), findsWidgets);
    expect(find.textContaining('我们晓得万事都互相效力').hitTestable(), findsOneWidget);
  });

  testWidgets('shows sermon transcript content on sermons tab', (tester) async {
    final harness = await _localizedApp(locale: const Locale('zh'));
    addTearDown(harness.close);
    await tester.runAsync(
      () => harness.seedBible(verseTranslationIds: const ['cuvs']),
    );

    await tester.pumpWidget(harness.widget);
    await _pumpUntilFound(tester, find.text('读经'));

    await tester.tap(find.byIcon(Icons.graphic_eq_outlined));
    await _pumpUntilFound(tester, find.text('在苦难中的盼望'));

    await _openSermonDetail(tester, '在苦难中的盼望');
    await _pumpUntilFound(tester, find.text('讲道详情'));
    await _scrollUntilFound(tester, find.text('文稿'));
    await tester.tap(find.text('文稿').hitTestable().first);
    await _pumpUntilFound(tester, find.textContaining('罗马书 8:28 不是一句轻率的安慰'));
    expect(find.textContaining('罗马书 8:28 不是一句轻率的安慰'), findsOneWidget);
  });

  testWidgets('opens sermon detail route from sermon list', (tester) async {
    final harness = await _localizedApp(locale: const Locale('zh'));
    addTearDown(harness.close);
    await tester.runAsync(
      () => harness.seedBible(verseTranslationIds: const ['cuvs']),
    );

    await tester.pumpWidget(harness.widget);
    await _pumpUntilFound(tester, find.text('读经'));

    await tester.tap(find.byIcon(Icons.graphic_eq_outlined));
    await _pumpUntilFound(tester, find.text('在苦难中的盼望'));

    await _openSermonDetail(tester, '不能隔绝的爱');
    await _pumpUntilFound(tester, find.text('讲道详情'));
    await _scrollUntilFound(tester, find.text('讲道重点'));

    expect(find.byType(NavigationBar).hitTestable(), findsNothing);
    expect(find.text('不能隔绝的爱'), findsWidgets);
    expect(find.text('暂未上传音频'), findsOneWidget);
    expect(find.text('询问这篇讲道'), findsNothing);
    expect(find.text('讲道重点'), findsOneWidget);
    await _scrollUntilFound(tester, find.text('神若帮助我们'));
    expect(find.text('神若帮助我们'), findsOneWidget);
    await _scrollUntilFound(tester, find.text('经文'));
    await tester.tap(find.text('经文').hitTestable().first);
    await _scrollUntilFound(tester, find.text('罗马书 8:39'));
    expect(find.text('罗马书 8:39'), findsOneWidget);
    expect(find.text('神的爱在基督里显明'), findsOneWidget);
  });

  testWidgets('sermon player shows clear unavailable audio state', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          locale: const Locale('zh'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          home: Scaffold(
            body: SermonPlayerPanel(
              sermon: const Sermon(
                id: 'sermon-without-audio',
                title: '教会自录讲道',
                speaker: 'Pastor',
                date: '2026-06-07',
                series: '教会讲道',
                primaryReference: '约翰福音 15:5',
                duration: Duration(minutes: 30),
                summary: '讲道摘要',
                outline: [],
                references: [],
              ),
              progress: 0,
              speed: 1,
              onProgressChanged: (_) {},
              onSpeedPressed: () {},
            ),
          ),
        ),
      ),
    );

    expect(find.text('暂未上传音频'), findsOneWidget);
    expect(find.widgetWithIcon(IconButton, Icons.play_arrow), findsOneWidget);
    expect(
      tester
          .widget<IconButton>(find.widgetWithIcon(IconButton, Icons.play_arrow))
          .onPressed,
      isNull,
    );
    expect(
      tester
          .widget<IconButton>(find.widgetWithIcon(IconButton, Icons.forward_30))
          .onPressed,
      isNull,
    );
  });
}

class _LoadingFacetsSermonsRepository extends _FakeSermonsRepository {
  final _facets = Completer<SermonDiscoveryFacets>();

  @override
  Future<SermonDiscoveryFacets> getDiscoveryFacets() => _facets.future;
}
