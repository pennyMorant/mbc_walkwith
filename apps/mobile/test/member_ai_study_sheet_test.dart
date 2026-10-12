import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/ai/member_ai_study_response.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';
import 'package:mbc_walkwith/features/sermons/data/sermon_ai_repository.dart';
import 'package:mbc_walkwith/features/sermons/domain/sermon.dart';
import 'package:mbc_walkwith/features/sermons/presentation/widgets/sermon_ai_question_sheet.dart';
import 'package:mbc_walkwith/features/study/data/ai_study_repository.dart';
import 'package:mbc_walkwith/features/study/domain/bible_book.dart';
import 'package:mbc_walkwith/features/study/domain/bible_translation.dart';
import 'package:mbc_walkwith/features/study/domain/bible_verse.dart';
import 'package:mbc_walkwith/features/study/presentation/widgets/ai_study_sheet.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets(
    'Bible study waits for an explicit request and renders Markdown',
    (tester) async {
      final repository = _ImmediateAiStudyRepository();
      await tester.pumpWidget(
        _localizedApp(
          overrides: [
            memberSessionProvider.overrideWith((ref) async => _session),
            aiStudyRepositoryProvider.overrideWithValue(repository),
          ],
          child: const AiStudySheet(
            book: _romans,
            chapter: 8,
            verse: _verse,
            translation: BibleTranslation.web,
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(repository.callCount, 0);
      expect(find.text('Generated heading'), findsNothing);

      await tester.tap(find.text('Generate study help'));
      await tester.pumpAndSettle();

      expect(repository.callCount, 1);
      expect(find.text('Generated heading'), findsOneWidget);
      expect(find.text('Localized safety notice.'), findsOneWidget);
    },
  );

  testWidgets('Sermon Q&A disables submission for an empty question', (
    tester,
  ) async {
    final repository = _ImmediateSermonAiRepository();
    await tester.pumpWidget(
      _localizedApp(
        overrides: [
          memberSessionProvider.overrideWith((ref) async => _session),
          sermonAiRepositoryProvider.overrideWithValue(repository),
        ],
        child: const SermonAiQuestionSheet(sermon: _sermon),
      ),
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField), '');
    await tester.pump();

    final submitButton = tester.widget<FilledButton>(find.byType(FilledButton));
    expect(submitButton.onPressed, isNull);
    expect(repository.callCount, 0);

    await tester.enterText(find.byType(TextField), 'What is the main point?');
    await tester.pump();
    await tester.tap(find.text('Ask sermon question'));
    await tester.pumpAndSettle();

    expect(repository.callCount, 1);
    expect(find.text('Generated heading'), findsOneWidget);
  });

  testWidgets('disposed study sheets ignore an in-flight response', (
    tester,
  ) async {
    final repository = _PendingAiStudyRepository();
    await tester.pumpWidget(
      _localizedApp(
        overrides: [
          memberSessionProvider.overrideWith((ref) async => _session),
          aiStudyRepositoryProvider.overrideWithValue(repository),
        ],
        child: const AiStudySheet(
          book: _romans,
          chapter: 8,
          verse: _verse,
          translation: BibleTranslation.web,
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Generate study help'));
    await tester.pump();

    await tester.pumpWidget(const MaterialApp(home: SizedBox.shrink()));
    repository.completer.complete(_response);
    await tester.pump();

    expect(tester.takeException(), isNull);
  });

  testWidgets('Bible study ignores a response for an edited question', (
    tester,
  ) async {
    final repository = _PendingAiStudyRepository();
    await tester.pumpWidget(
      _localizedApp(
        overrides: [
          memberSessionProvider.overrideWith((ref) async => _session),
          aiStudyRepositoryProvider.overrideWithValue(repository),
        ],
        child: const AiStudySheet(
          book: _romans,
          chapter: 8,
          verse: _verse,
          translation: BibleTranslation.web,
        ),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Generate study help'));
    await tester.pump();

    await tester.enterText(find.byType(TextField), 'A different question');
    repository.completer.complete(_response);
    await tester.pump();

    expect(find.text('Generated heading'), findsNothing);
    expect(tester.takeException(), isNull);
  });

  testWidgets('Sermon Q&A ignores a response after member sign-out', (
    tester,
  ) async {
    MemberSession? activeSession = _session;
    final repository = _PendingSermonAiRepository();
    await tester.pumpWidget(
      _localizedApp(
        overrides: [
          memberSessionProvider.overrideWith((ref) async => activeSession),
          sermonAiRepositoryProvider.overrideWithValue(repository),
        ],
        child: const SermonAiQuestionSheet(sermon: _sermon),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Ask sermon question'));
    await tester.pump();

    activeSession = null;
    final container = ProviderScope.containerOf(
      tester.element(find.byType(SermonAiQuestionSheet)),
    );
    container.invalidate(memberSessionProvider);
    await tester.pump();
    await tester.pump();

    repository.completer.complete(_sermonResponse);
    await tester.pump();

    expect(find.text('Generated heading'), findsNothing);
    expect(tester.takeException(), isNull);
  });
}

Widget _localizedApp({
  required List<Override> overrides,
  required Widget child,
}) {
  return ProviderScope(
    overrides: overrides,
    child: MaterialApp(
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      theme: AppTheme.build(null, Brightness.light),
      home: Scaffold(body: child),
    ),
  );
}

class _ImmediateAiStudyRepository implements AiStudyRepository {
  int callCount = 0;

  @override
  Future<MemberAiStudyResponse> createBibleStudyHelp({
    required MemberSession session,
    required BibleBook book,
    required int chapter,
    required BibleVerse verse,
    required BibleTranslation translation,
    required String locale,
    required String question,
  }) async {
    callCount += 1;
    return _response;
  }
}

class _PendingAiStudyRepository implements AiStudyRepository {
  final completer = Completer<MemberAiStudyResponse>();

  @override
  Future<MemberAiStudyResponse> createBibleStudyHelp({
    required MemberSession session,
    required BibleBook book,
    required int chapter,
    required BibleVerse verse,
    required BibleTranslation translation,
    required String locale,
    required String question,
  }) {
    return completer.future;
  }
}

class _ImmediateSermonAiRepository implements SermonAiRepository {
  int callCount = 0;

  @override
  Future<MemberAiStudyResponse> askSermonQuestion({
    required MemberSession session,
    required Sermon sermon,
    required String question,
    required String locale,
  }) async {
    callCount += 1;
    return _sermonResponse;
  }
}

class _PendingSermonAiRepository implements SermonAiRepository {
  final completer = Completer<MemberAiStudyResponse>();

  @override
  Future<MemberAiStudyResponse> askSermonQuestion({
    required MemberSession session,
    required Sermon sermon,
    required String question,
    required String locale,
  }) {
    return completer.future;
  }
}

const _response = MemberAiStudyResponse(
  task: 'bible_study_help',
  markdown: '## Generated heading\n\n- First point',
  provider: 'openai',
  model: 'test-model',
  safetyNotice: 'Localized safety notice.',
  usage: AiTokenUsage(inputTokens: 4, outputTokens: 5, totalTokens: 9),
  latencyMs: 42,
);

const _sermonResponse = MemberAiStudyResponse(
  task: 'sermon_qa',
  markdown: '## Generated heading\n\n- First point',
  provider: 'openai',
  model: 'test-model',
  safetyNotice: 'Localized safety notice.',
  usage: AiTokenUsage(inputTokens: 4, outputTokens: 5, totalTokens: 9),
  latencyMs: 42,
);

const _session = MemberSession(
  accessToken: 'member-token',
  member: MemberProfile(
    id: 'member-1',
    email: 'member@example.com',
    displayName: 'Member',
    roles: ['member'],
    appLocale: 'en',
    fellowshipGroupId: null,
    notificationSettings: MemberNotificationSettings.defaults,
  ),
);

const _romans = BibleBook(
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

const _verse = BibleVerse(
  id: 'rom.8.28',
  number: 28,
  text: 'And we know that all things work together for good.',
);

const _sermon = Sermon(
  id: 'sermon-1',
  title: 'God With Us',
  speaker: 'Pastor Lee',
  date: '2026-06-21',
  series: 'Advent',
  primaryReference: 'Matthew 1:23',
  duration: Duration(minutes: 35),
  summary: 'God comes near to his people.',
  outline: [],
  references: [],
  transcript: SermonTranscript(text: 'Full transcript text.'),
  audioUrl: 'https://example.com/sermon.mp3',
);
