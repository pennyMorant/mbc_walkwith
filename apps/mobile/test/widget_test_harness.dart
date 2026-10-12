part of 'widget_test.dart';

Future<_TestHarness> _testApp() async {
  final prefs = await _testSharedPreferences();
  final database = AppDatabase(openTestDatabaseConnection());

  return _TestHarness(
    database: database,
    sharedPreferences: prefs,
    widget: ProviderScope(
      overrides: [
        sharedPreferencesProvider.overrideWithValue(prefs),
        appDatabaseProvider.overrideWithValue(database),
        appConfigProvider.overrideWithValue(_testAppConfig),
        studyRepositoryProvider.overrideWithValue(_FakeStudyRepository()),
      ],
      child: WalkWithApp(),
    ),
  );
}

Future<_TestHarness> _localizedApp({
  required Locale locale,
  Map<String, Object> sharedPreferencesValues = const {},
  List<Override> providerOverrides = const [],
}) async {
  final prefs = await _testSharedPreferences(sharedPreferencesValues);
  final database = AppDatabase(openTestDatabaseConnection());

  return _TestHarness(
    database: database,
    sharedPreferences: prefs,
    widget: ProviderScope(
      overrides: [
        sharedPreferencesProvider.overrideWithValue(prefs),
        appDatabaseProvider.overrideWithValue(database),
        appConfigProvider.overrideWithValue(_testAppConfig),
        studyRepositoryProvider.overrideWithValue(_FakeStudyRepository()),
        sermonsRepositoryProvider.overrideWithValue(_FakeSermonsRepository()),
        ...providerOverrides,
      ],
      child: MaterialApp.router(
        locale: locale,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        theme: AppTheme.build(null, Brightness.light),
        darkTheme: AppTheme.build(null, Brightness.dark),
        themeMode: ThemeMode.system,
        routerConfig: createAppRouter(),
      ),
    ),
  );
}

const _testAppConfig = AppConfig(
  apiBaseUrl: 'http://localhost:3020/v1',
  useMockRemoteData: true,
);

Future<SharedPreferences> _testSharedPreferences([
  Map<String, Object> values = const {},
]) async {
  SharedPreferences.setMockInitialValues(values);
  return SharedPreferences.getInstance();
}

Future<void> _pumpUntilFound(
  WidgetTester tester,
  Finder finder, {
  int maxPumps = 80,
}) async {
  for (var i = 0; i < maxPumps; i += 1) {
    await tester.pump(const Duration(milliseconds: 100));
    if (finder.evaluate().isNotEmpty) {
      return;
    }
  }
  final studyState = [
    if (find.byKey(const ValueKey('study-loading')).evaluate().isNotEmpty)
      'study-loading',
    if (find.byKey(const ValueKey('study-error')).evaluate().isNotEmpty)
      'study-error',
    if (find.byKey(const ValueKey('study-content')).evaluate().isNotEmpty)
      'study-content',
  ].join(', ');
  throw TestFailure(
    'Timed out waiting for $finder'
    '${studyState.isEmpty ? '' : ' (study state: $studyState)'}',
  );
}

Future<void> _scrollUntilFound(
  WidgetTester tester,
  Finder finder, {
  int maxDrags = 20,
}) async {
  final scrollable = find.byType(Scrollable).first;
  for (var i = 0; i < maxDrags; i += 1) {
    if (finder.hitTestable().evaluate().isNotEmpty) {
      return;
    }
    await tester.drag(scrollable, const Offset(0, -360), warnIfMissed: false);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 250));
  }
  throw TestFailure('Timed out scrolling for $finder');
}

Future<void> _openBookChapterSheet(
  WidgetTester tester, {
  required String loadedLabel,
  required String bookName,
  required String chapterCountLabel,
}) async {
  await _pumpUntilFound(tester, find.byKey(const ValueKey('study-content')));
  if (find.text(loadedLabel).evaluate().isEmpty) {
    await _scrollUntilFound(tester, find.text(loadedLabel), maxDrags: 8);
  }
  await _scrollUntilFound(tester, find.text(bookName), maxDrags: 30);
  await tester.tap(find.text(bookName).hitTestable().first);
  await _pumpUntilFound(tester, find.text(chapterCountLabel));
}

Future<void> _tapChapterButton(WidgetTester tester, String label) async {
  final button = find.widgetWithText(AppButton, label);
  await tester.scrollUntilVisible(
    button,
    80,
    scrollable: find.byType(Scrollable).last,
  );
  await tester.pump(const Duration(milliseconds: 120));
  await tester.tap(button.hitTestable().first);
}

Future<void> _openSermonDetail(WidgetTester tester, String title) async {
  await _scrollUntilFound(tester, find.text(title));
  GoRouter.of(tester.element(find.text(title).hitTestable().first)).pushNamed(
    AppRouteNames.sermonDetail,
    pathParameters: {'sermonId': _sermonIdForTitle(title)},
  );
  await tester.pump();
}

String _sermonIdForTitle(String title) {
  for (final sermon in mock_sermons.sermons) {
    if (sermon.title == title) {
      return sermon.id;
    }
  }
  throw StateError('Unknown sermon title: $title');
}

Future<void> _scrollToTop(WidgetTester tester) async {
  final scrollable = find.byType(Scrollable).first;
  for (var i = 0; i < 6; i += 1) {
    await tester.drag(scrollable, const Offset(0, 520), warnIfMissed: false);
    await tester.pump(const Duration(milliseconds: 80));
  }
}

Widget _lifeDetailPresentationApp({
  LifePostDetailPresentationMode mode = LifePostDetailPresentationMode.sheet,
}) {
  final post = LifePost(
    id: 'life-detail-presentation',
    type: '主日',
    title: '本周主日崇拜',
    body: '上午 10:00 在 Main Sanctuary 敬拜。儿童主日学同步进行。',
    meta: '周日 10:00 AM',
    iconName: 'church',
    startsAt: DateTime.utc(2026, 6, 7, 17),
  );

  final router = GoRouter(
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) {
          return Scaffold(
            body: Center(
              child: Consumer(
                builder: (context, ref, child) {
                  return FilledButton(
                    onPressed: () => openLifePostDetail(context, ref, post),
                    child: const Text('Open detail'),
                  );
                },
              ),
            ),
          );
        },
      ),
      GoRoute(
        path: AppRoutePaths.lifePostDetail,
        name: AppRouteNames.lifePostDetail,
        builder: (context, state) {
          return LifePostDetailPage(postId: state.pathParameters['postId']!);
        },
      ),
    ],
  );

  return ProviderScope(
    overrides: [
      lifeRepositoryProvider.overrideWithValue(_SingleLifePostRepository(post)),
      lifePostDetailPresentationModeProvider.overrideWithValue(mode),
    ],
    child: MaterialApp.router(
      locale: const Locale('zh'),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      theme: AppTheme.build(null, Brightness.light),
      routerConfig: router,
    ),
  );
}

class _FakeSermonsRepository implements SermonsRepository {
  @override
  Future<List<Sermon>> getSermons({
    SermonListRequest request = const SermonListRequest(),
  }) async {
    await Future<void>.delayed(Duration.zero);
    final query = request.query?.trim().toLowerCase();
    final sermons = query == null || query.isEmpty
        ? mock_sermons.sermons
        : mock_sermons.sermons
              .where((sermon) {
                return [
                  sermon.title,
                  sermon.speaker,
                  sermon.series,
                  sermon.primaryReference,
                  sermon.summary,
                ].join(' ').toLowerCase().contains(query);
              })
              .toList(growable: false);
    return sermons
        .where(
          (sermon) =>
              _matchesSermonFilter(sermon.speaker, request.speaker) &&
              _matchesSermonFilter(sermon.series, request.series) &&
              (request.topic == null ||
                  request.topic!.trim().isEmpty ||
                  sermon.topics.any(
                    (topic) => _matchesSermonFilter(topic, request.topic),
                  )),
        )
        .take(request.limit)
        .toList(growable: false);
  }

  @override
  Future<SermonDiscoveryFacets> getDiscoveryFacets() async {
    return const SermonDiscoveryFacets(
      speakers: ['Pastor David Chen'],
      series: ['罗马书系列'],
      topics: ['盼望', '苦难', '神的爱', '确据'],
    );
  }

  @override
  Future<Sermon?> getSermonById(String sermonId) async {
    await Future<void>.delayed(Duration.zero);
    for (final sermon in mock_sermons.sermons) {
      if (sermon.id == sermonId) {
        return sermon;
      }
    }
    return null;
  }

  @override
  Future<List<Sermon>> getRecommendedSermons({
    required String bookId,
    required int chapter,
    String? verseId,
    int limit = 3,
  }) async {
    await Future<void>.delayed(Duration.zero);
    final prefix = '$bookId.$chapter.';
    return mock_sermons.sermons
        .where((sermon) {
          return sermon.references.any((reference) {
            if (verseId != null && reference.verseId == verseId) {
              return true;
            }
            return reference.verseId.startsWith(prefix);
          });
        })
        .take(limit)
        .toList(growable: false);
  }
}

class _EmptySermonsRepository implements SermonsRepository {
  @override
  Future<List<Sermon>> getSermons({
    SermonListRequest request = const SermonListRequest(),
  }) async {
    await Future<void>.delayed(Duration.zero);
    return const [];
  }

  @override
  Future<Sermon?> getSermonById(String sermonId) async => null;

  @override
  Future<SermonDiscoveryFacets> getDiscoveryFacets() async =>
      const SermonDiscoveryFacets();

  @override
  Future<List<Sermon>> getRecommendedSermons({
    required String bookId,
    required int chapter,
    String? verseId,
    int limit = 3,
  }) async {
    return const [];
  }
}

bool _matchesSermonFilter(String value, String? expected) {
  final cleanExpected = expected?.trim();
  return cleanExpected == null ||
      cleanExpected.isEmpty ||
      value.toLowerCase() == cleanExpected.toLowerCase();
}

class _FakeStudyRepository implements StudyRepository {
  BibleBook _progressBook = _localizedBook(_romansBook, 'cuvs');
  int _progressChapter = 8;
  String? _progressVerseId;

  @override
  Future<List<BibleBook>> getBibleBooks(String translationId) async {
    return [...oldTestamentBibleBooks, ...newTestamentBibleBooks]
        .map((book) => _localizedBook(book, translationId))
        .toList(growable: false);
  }

  @override
  Future<BibleBook> getBibleBook(String bookId, String translationId) async {
    return _localizedBook(_findBook(bookId), translationId);
  }

  @override
  Future<List<BibleVerse>> getChapterVerses(
    String bookId,
    int chapter,
    String translationId,
  ) async {
    if (_isRomans(bookId) && chapter == 8) {
      return translationId == 'cuvt' ? _romans8Traditional : _romans8Simplified;
    }
    if (_isGenesis(bookId) && chapter == 1) {
      return _genesis1Simplified;
    }
    return const [];
  }

  @override
  Future<List<BibleVerse>> getCurrentChapter() {
    return getChapterVerses('rom', 8, 'cuvs');
  }

  @override
  Future<List<BibleSearchResult>> searchBibleVerses({
    required String query,
    required String translationId,
    int limit = 30,
  }) async {
    final cleanQuery = query.trim();
    if (cleanQuery.length < 2 || !cleanQuery.contains('万事')) {
      return const [];
    }
    return const [
      BibleSearchResult(
        verseId: 'rom.8.28',
        bookId: 'rom',
        bookName: '罗马书',
        chapter: 8,
        verse: 28,
        text: '我们晓得万事都互相效力，叫爱神的人得益处。',
        score: 1000,
        bookSortOrder: 45,
      ),
    ];
  }

  @override
  Future<ReadingProgressEntry> getReadingProgress(String translationId) async {
    return ReadingProgressEntry(
      book: _localizedBook(_progressBook, translationId),
      chapter: _progressChapter,
      verseId: _progressVerseId,
    );
  }

  @override
  Future<void> saveReadingProgress({
    required String bookId,
    required int chapter,
    String? verseId,
  }) async {
    _progressBook = _findBook(bookId);
    _progressChapter = chapter;
    _progressVerseId = verseId;
  }

  @override
  Future<Map<String, StudyVerseAnnotation>> getChapterAnnotations(
    String bookId,
    int chapter,
  ) async {
    return const {};
  }

  @override
  Future<void> saveVerseNote({
    required String verseId,
    required String noteText,
  }) async {}

  @override
  Future<void> setVerseHighlight({
    required String verseId,
    required String? highlightColor,
  }) async {}

  @override
  Future<void> setVerseBookmark({
    required String verseId,
    required bool isBookmarked,
  }) async {}
}

BibleBook _findBook(String bookId) {
  if (_isRomans(bookId)) {
    return _romansBook;
  }
  if (_isGenesis(bookId)) {
    return _genesisBook;
  }
  for (final book in [...oldTestamentBibleBooks, ...newTestamentBibleBooks]) {
    if (book.id == bookId) {
      return book;
    }
  }
  return _romansBook;
}

BibleBook _localizedBook(BibleBook book, String translationId) {
  if (translationId != 'cuvt') {
    return book;
  }
  if (_isRomans(book.id)) {
    return const BibleBook(
      id: 'rom',
      testament: BibleTestament.newTestament,
      category: BibleBookCategory.paulineLetters,
      nameZh: '羅馬書',
      nameEn: 'Romans',
      abbreviationZh: '羅',
      abbreviationEn: 'Rom',
      chapterCount: 16,
      sortOrder: 45,
    );
  }
  return book;
}

bool _isRomans(String bookId) => bookId == 'rom';

bool _isGenesis(String bookId) => bookId == 'gen';

const _romansBook = BibleBook(
  id: 'rom',
  testament: BibleTestament.newTestament,
  category: BibleBookCategory.paulineLetters,
  nameZh: '罗马书',
  nameEn: 'Romans',
  abbreviationZh: '罗',
  abbreviationEn: 'Rom',
  chapterCount: 16,
  sortOrder: 45,
);

const _genesisBook = BibleBook(
  id: 'gen',
  testament: BibleTestament.old,
  category: BibleBookCategory.law,
  nameZh: '创世记',
  nameEn: 'Genesis',
  abbreviationZh: '创',
  abbreviationEn: 'Gen',
  chapterCount: 50,
  sortOrder: 1,
);

const _romans8Simplified = [
  BibleVerse(id: 'rom.8.1', number: 1, text: '如今，那些在基督耶稣里的就不定罪了。'),
  BibleVerse(id: 'rom.8.28', number: 28, text: '我们晓得万事都互相效力，叫爱神的人得益处。'),
];

const _romans8Traditional = [
  BibleVerse(id: 'rom.8.1', number: 1, text: '如今，那些在基督耶穌裏的就不定罪了。'),
  BibleVerse(id: 'rom.8.28', number: 28, text: '我們曉得萬事都互相效力，叫愛神的人得益處。'),
];

const _genesis1Simplified = [
  BibleVerse(id: 'gen.1.1', number: 1, text: '起初， 神创造天地。'),
  BibleVerse(id: 'gen.1.19', number: 19, text: '有晚上，有早晨，是第四日。'),
];

class _TestHarness {
  const _TestHarness({
    required this.widget,
    required this.database,
    required this.sharedPreferences,
  });

  final Widget widget;
  final AppDatabase database;
  final SharedPreferences sharedPreferences;

  Future<void> seedBible({
    Iterable<String> verseTranslationIds = const [],
  }) async {
    final importer = BibleSeedImporter(
      database: database,
      sharedPreferences: sharedPreferences,
    );
    await importer.ensureSeeded();
    for (final translationId in verseTranslationIds) {
      await importer.ensureVerseTextsSeeded(translationId);
    }
  }

  Future<void> close() => database.close();
}

class _SingleLifePostRepository implements LifeRepository {
  const _SingleLifePostRepository(
    this.post, {
    this.updateError,
    this.extraPosts = const [],
  });

  final LifePost post;
  final Object? updateError;
  final List<LifePost> extraPosts;

  @override
  Future<LifePost?> getLifePostById(
    String postId, {
    MemberSession? session,
  }) async {
    return [post, ...extraPosts].where((post) => post.id == postId).firstOrNull;
  }

  @override
  Future<List<LifePost>> getLifePosts({
    MemberSession? session,
    LifePostListRequest request = const LifePostListRequest(),
  }) async {
    return [post, ...extraPosts];
  }

  @override
  Future<LifePost> markLifePostRead(
    String postId,
    MemberSession session,
  ) async {
    return post;
  }

  @override
  Future<LifePost> registerForEvent(
    String postId,
    MemberSession session, {
    required int partySize,
    String? note,
  }) async {
    return post;
  }

  @override
  Future<LifePost> updateEventRegistration(
    String postId,
    MemberSession session, {
    required int partySize,
    String? note,
  }) async {
    final error = updateError;
    if (error != null) {
      throw error;
    }
    return post;
  }

  @override
  Future<LifePost> cancelEventRegistration(
    String postId,
    MemberSession session,
  ) async {
    return post;
  }

  @override
  Future<LifePost> checkInEventRegistration(
    String postId,
    MemberSession session,
  ) async {
    return post;
  }

  @override
  Future<LifePost> checkInEventRegistrationWithCode(
    String code,
    MemberSession session,
  ) async {
    return post;
  }
}
