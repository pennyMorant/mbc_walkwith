import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/identity/external_user_identity_repository.dart';
import 'package:mbc_walkwith/features/sermons/data/sermon_discussion_guide_repository.dart';
import 'package:mbc_walkwith/features/sermons/domain/sermon_discussion_guide.dart';
import 'package:mbc_walkwith/features/sermons/presentation/widgets/sermon_discussion_guide_section.dart';
import 'package:mbc_walkwith/features/sermons/presentation/widgets/sermon_discussion_response_sheet.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/shared/widgets/app_button.dart';
import 'package:mbc_walkwith/shared/widgets/app_chip.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('shows a retryable guide error on a narrow screen', (
    tester,
  ) async {
    final repository = _RetryDiscussionGuideRepository();
    await tester.binding.setSurfaceSize(const Size(320, 640));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      ProviderScope(
        retry: (_, _) => null,
        overrides: [
          sermonDiscussionGuideRepositoryProvider.overrideWithValue(repository),
        ],
        child: MaterialApp(
          locale: const Locale('es'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(context)
                .copyWith(textScaler: const TextScaler.linear(1.3)),
            child: child!,
          ),
          home: const Scaffold(
            body: SingleChildScrollView(
              child: SermonDiscussionGuideSection(sermonId: 'sermon-1'),
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    final message = find.text('No se pudo cargar la guía de discusión.');
    final retry = find.byType(AppButton);
    expect(message, findsOneWidget);
    expect(retry, findsOneWidget);
    expect(
      tester.getTopLeft(retry).dy,
      greaterThan(tester.getBottomLeft(message).dy),
    );
    expect(tester.takeException(), isNull);

    await tester.tap(find.text('Reintentar'));
    await tester.pumpAndSettle();

    expect(repository.loadCount, 2);
    expect(message, findsNothing);
    expect(tester.takeException(), isNull);
  });

  testWidgets('stacks guide title and privacy label for larger text', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(320, 760));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sermonDiscussionGuideRepositoryProvider.overrideWithValue(
            _StaticDiscussionGuideRepository(_guide),
          ),
        ],
        child: MaterialApp(
          locale: const Locale('es'),
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: AppTheme.build(null, Brightness.light),
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(context)
                .copyWith(textScaler: const TextScaler.linear(1.3)),
            child: child!,
          ),
          home: const Scaffold(
            body: SingleChildScrollView(
              child: SermonDiscussionGuideSection(sermonId: 'sermon-1'),
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    final title = find.text(_guide.title);
    final privacy = find.byType(AppChip).first;
    expect(
      tester.getTopLeft(privacy).dy,
      greaterThan(tester.getBottomLeft(title).dy),
    );
    expect(tester.takeException(), isNull);
  });

  testWidgets('submits a discussion response only once during rapid taps', (
    tester,
  ) async {
    final repository = _PendingDiscussionGuideRepository();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sermonDiscussionGuideRepositoryProvider.overrideWithValue(repository),
          memberSessionProvider.overrideWith((ref) async => null),
          externalUserIdProvider.overrideWith((ref) async => 'ext_test'),
        ],
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          home: Scaffold(body: SermonDiscussionResponseSheet(guide: _guide)),
        ),
      ),
    );

    await tester.enterText(find.byType(TextField), 'A private response');
    final submitButton = find.text('Submit');
    await tester.tap(submitButton);
    await tester.tap(submitButton);

    expect(repository.createCount, 1);

    repository.pending.completeError(StateError('test failure'));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });

  testWidgets('response sheet scrolls above the keyboard with larger text', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(320, 640));
    tester.view.viewInsets = const FakeViewPadding(bottom: 260);
    addTearDown(() => tester.binding.setSurfaceSize(null));
    addTearDown(tester.view.resetViewInsets);

    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(context)
                .copyWith(textScaler: const TextScaler.linear(1.5)),
            child: child!,
          ),
          home: Scaffold(body: SermonDiscussionResponseSheet(guide: _guide)),
        ),
      ),
    );
    await tester.pumpAndSettle();

    final submitButton = find.text('Submit');
    await tester.ensureVisible(submitButton);
    await tester.pumpAndSettle();

    expect(submitButton, findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}

final _guide = SermonDiscussionGuide(
  id: 'guide-1',
  sermonId: 'sermon-1',
  title: 'Discussion guide',
  summary: '',
  status: 'published',
  audienceType: 'public',
  audienceId: null,
  questions: const [],
  actionSteps: const [],
  prayerPrompts: const [],
  publishedAt: DateTime.utc(2026, 7, 13),
  createdAt: DateTime.utc(2026, 7, 13),
  updatedAt: DateTime.utc(2026, 7, 13),
);

class _RetryDiscussionGuideRepository
    implements SermonDiscussionGuideRepository {
  int loadCount = 0;

  @override
  Future<SermonDiscussionGuide?> getGuideForSermon(String sermonId) async {
    loadCount += 1;
    if (loadCount == 1) {
      throw const FormatException('Malformed public discussion guide.');
    }
    return null;
  }

  @override
  Future<SermonDiscussionResponse> createResponse({
    required String guideId,
    required SermonDiscussionIdentity identity,
    required String content,
    String? questionId,
  }) {
    throw UnimplementedError();
  }
}

class _PendingDiscussionGuideRepository
    implements SermonDiscussionGuideRepository {
  final pending = Completer<SermonDiscussionResponse>();
  int createCount = 0;

  @override
  Future<SermonDiscussionResponse> createResponse({
    required String guideId,
    required SermonDiscussionIdentity identity,
    required String content,
    String? questionId,
  }) {
    createCount += 1;
    return pending.future;
  }

  @override
  Future<SermonDiscussionGuide?> getGuideForSermon(String sermonId) async {
    return null;
  }
}

class _StaticDiscussionGuideRepository
    implements SermonDiscussionGuideRepository {
  const _StaticDiscussionGuideRepository(this.guide);

  final SermonDiscussionGuide guide;

  @override
  Future<SermonDiscussionResponse> createResponse({
    required String guideId,
    required SermonDiscussionIdentity identity,
    required String content,
    String? questionId,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<SermonDiscussionGuide?> getGuideForSermon(String sermonId) async {
    return guide;
  }
}
