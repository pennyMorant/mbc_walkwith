import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/intl.dart';
import 'package:mbc_walkwith/app/app_router.dart';
import 'package:mbc_walkwith/app/app_routes.dart';
import 'package:mbc_walkwith/app/walk_with_app.dart';
import 'package:mbc_walkwith/core/api/api_error.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';
import 'package:mbc_walkwith/core/database/app_database.dart';
import 'package:mbc_walkwith/core/settings/app_settings.dart';
import 'package:mbc_walkwith/core/settings/app_settings_repository.dart';
import 'package:mbc_walkwith/core/storage/shared_preferences_provider.dart';
import 'package:mbc_walkwith/features/life/data/care_repository.dart';
import 'package:mbc_walkwith/features/life/data/course_repository.dart';
import 'package:mbc_walkwith/features/life/data/group_repository.dart';
import 'package:mbc_walkwith/features/life/data/life_repository.dart';
import 'package:mbc_walkwith/features/life/data/prayer_repository.dart';
import 'package:mbc_walkwith/features/life/data/serving_repository.dart';
import 'package:mbc_walkwith/features/life/domain/life_post.dart';
import 'package:mbc_walkwith/features/life/domain/life_post_list_request.dart';
import 'package:mbc_walkwith/features/life/presentation/life_post_detail_page.dart';
import 'package:mbc_walkwith/features/life/presentation/life_post_detail_presentation.dart';
import 'package:mbc_walkwith/features/life/presentation/life_tab.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/life_dashboard_tab_bar.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/life_dashboard_view.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/life_post_card.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';
import 'package:mbc_walkwith/features/sermons/domain/sermon.dart';
import 'package:mbc_walkwith/features/sermons/domain/sermon_discovery_facets.dart';
import 'package:mbc_walkwith/features/sermons/domain/sermon_list_request.dart';
import 'package:mbc_walkwith/features/sermons/data/mock_sermon_data.dart'
    as mock_sermons;
import 'package:mbc_walkwith/features/sermons/data/sermons_repository.dart';
import 'package:mbc_walkwith/features/sermons/presentation/sermons_tab.dart';
import 'package:mbc_walkwith/features/sermons/presentation/widgets/sermon_player_panel.dart';
import 'package:mbc_walkwith/features/study/data/bible_catalog_new_testament.dart';
import 'package:mbc_walkwith/features/study/data/bible_catalog_old_testament.dart';
import 'package:mbc_walkwith/features/study/data/local/bible_seed_importer.dart';
import 'package:mbc_walkwith/features/study/data/study_repository.dart';
import 'package:mbc_walkwith/features/study/domain/bible_book.dart';
import 'package:mbc_walkwith/features/study/domain/bible_search_result.dart';
import 'package:mbc_walkwith/features/study/domain/bible_verse.dart';
import 'package:mbc_walkwith/features/study/domain/study_annotation.dart';
import 'package:mbc_walkwith/features/study/presentation/widgets/continue_reading_card.dart';
import 'package:mbc_walkwith/features/study/presentation/widgets/reader_settings_sheet.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/shared/utils/date_period.dart';
import 'package:mbc_walkwith/shared/widgets/app_button.dart';
import 'package:mbc_walkwith/theme/app_colors.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'test_database.dart';

part 'widget_test_harness.dart';
part 'widget_sermon_checks.dart';
part 'widget_life_checks.dart';

void main() {
  registerLifeWidgetChecks();
  registerSermonWidgetChecks();

  testWidgets('shows the core tabs in default locale', (tester) async {
    final harness = await _testApp();
    addTearDown(harness.close);
    await tester.runAsync(harness.seedBible);

    await tester.pumpWidget(harness.widget);
    await _pumpUntilFound(tester, find.text('Bible'));

    expect(find.text('Study'), findsOneWidget);
    expect(find.text('Sermons'), findsOneWidget);
    expect(find.text('Life'), findsOneWidget);
    expect(find.text('Mine'), findsOneWidget);
    expect(find.text('Bible'), findsWidgets);
  });

  testWidgets('navigates to sermons and life tabs', (tester) async {
    final harness = await _testApp();
    addTearDown(harness.close);
    await tester.runAsync(harness.seedBible);

    await tester.pumpWidget(harness.widget);
    await _pumpUntilFound(tester, find.text('Bible'));

    await tester.tap(find.byIcon(Icons.graphic_eq_outlined));
    await _pumpUntilFound(tester, find.text('Sermons'));
    expect(find.text('Sermons'), findsWidgets);

    await tester.tap(find.byIcon(Icons.volunteer_activism_outlined));
    await _pumpUntilFound(tester, find.text('Church Life'));
    expect(find.text('Church Life'), findsWidgets);
    await tester.pumpAndSettle();
  });

  testWidgets('main navigation gives haptic feedback only when tabs change', (
    tester,
  ) async {
    final hapticCalls = <MethodCall>[];
    tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
      SystemChannels.platform,
      (call) async {
        if (call.method == 'HapticFeedback.vibrate') {
          hapticCalls.add(call);
        }
        return null;
      },
    );
    addTearDown(
      () => tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
        SystemChannels.platform,
        null,
      ),
    );
    final harness = await _testApp();
    addTearDown(harness.close);
    await tester.runAsync(harness.seedBible);

    await tester.pumpWidget(harness.widget);
    await _pumpUntilFound(tester, find.text('Bible'));

    await tester.tap(find.byIcon(Icons.graphic_eq_outlined));
    await tester.pump(const Duration(milliseconds: 100));
    await tester.pump(const Duration(milliseconds: 100));
    expect(hapticCalls, hasLength(1));
    expect(hapticCalls.single.arguments, 'HapticFeedbackType.selectionClick');

    await tester.tap(find.byIcon(Icons.graphic_eq));
    await tester.pump();
    expect(hapticCalls, hasLength(1));

    await tester.pumpWidget(const SizedBox.shrink());
    await tester.pump();
  });

  testWidgets('supports Simplified Chinese locale', (tester) async {
    final harness = await _localizedApp(locale: const Locale('zh'));
    addTearDown(harness.close);
    await tester.runAsync(harness.seedBible);

    await tester.pumpWidget(harness.widget);
    await _pumpUntilFound(tester, find.text('读经'));

    expect(find.text('读经'), findsNWidgets(2));
    expect(find.text('讲道'), findsOneWidget);
    expect(find.text('生活'), findsOneWidget);
    expect(find.text('我的'), findsOneWidget);
  });

  testWidgets('member sign-in keeps a clear two-step flow on a small screen', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(320, 640));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final harness = await _localizedApp(locale: const Locale('zh'));
    addTearDown(harness.close);

    await tester.pumpWidget(harness.widget);
    await tester.pump();
    GoRouter.of(tester.element(find.byType(Scaffold).first))
        .pushNamed(AppRouteNames.memberLoginEmail);
    await _pumpUntilFound(tester, find.text('欢迎回来'));

    expect(
      find.byKey(const ValueKey('member_auth_brand_logo')),
      findsOneWidget,
    );
    expect(find.text('欢迎回来'), findsOneWidget);
    expect(find.widgetWithText(AppButton, '下一步'), findsOneWidget);
    expect(tester.takeException(), isNull);

    await tester.enterText(find.byType(TextField), 'invalid-email');
    await tester.tap(find.widgetWithText(AppButton, '下一步'));
    await tester.pump();
    expect(find.text('请输入有效的邮箱地址。'), findsOneWidget);

    await tester.enterText(find.byType(TextField), 'member@example.com');
    await tester.tap(find.widgetWithText(AppButton, '下一步'));
    await _pumpUntilFound(
      tester,
      find.byKey(const ValueKey('member_auth_account_row')),
    );

    expect(
      find.byKey(const ValueKey('member_auth_account_row')),
      findsOneWidget,
    );
    expect(
      find.descendant(
        of: find.byKey(const ValueKey('member_auth_account_row')),
        matching: find.text('member@example.com'),
      ),
      findsOneWidget,
    );
    expect(find.widgetWithText(AppButton, '登录'), findsOneWidget);
    expect(find.text('忘记密码？'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('supports Traditional Chinese Bible text', (tester) async {
    final harness = await _localizedApp(
      locale: const Locale.fromSubtags(languageCode: 'zh', scriptCode: 'Hant'),
    );
    addTearDown(harness.close);
    await tester.runAsync(
      () => harness.seedBible(verseTranslationIds: const ['cuvt']),
    );

    await tester.pumpWidget(harness.widget);
    await _pumpUntilFound(tester, find.text('讀經'));

    await _openBookChapterSheet(
      tester,
      loadedLabel: '新約',
      bookName: '羅馬書',
      chapterCountLabel: '16 章',
    );
    await _tapChapterButton(tester, '8');

    await _pumpUntilFound(tester, find.textContaining('如今，那些在基督耶穌裏的就不定罪了'));
    expect(find.text('羅馬書 8'), findsWidgets);
  });

  testWidgets('opens Bible reader from Romans chapter picker', (tester) async {
    final harness = await _localizedApp(locale: const Locale('zh'));
    addTearDown(harness.close);
    await tester.runAsync(
      () => harness.seedBible(verseTranslationIds: const ['cuvs']),
    );

    await tester.pumpWidget(harness.widget);
    await _pumpUntilFound(tester, find.text('读经'));

    expect(find.text('读经'), findsWidgets);
    await _openBookChapterSheet(
      tester,
      loadedLabel: '新约',
      bookName: '罗马书',
      chapterCountLabel: '16 章',
    );
    expect(find.text('16 章'), findsOneWidget);

    final sheet = tester.widget<BottomSheet>(find.byType(BottomSheet));
    final sheetContext = tester.element(find.byType(BottomSheet));
    final colorScheme = Theme.of(sheetContext).colorScheme;
    final firstChapterButton = tester.widget<AppButton>(
      find.widgetWithText(AppButton, '1'),
    );
    expect(sheet.backgroundColor, colorScheme.surface);
    expect(firstChapterButton.backgroundColor, colorScheme.tintedCardColor);
    expect(firstChapterButton.backgroundColor, isNot(sheet.backgroundColor));

    await _tapChapterButton(tester, '8');
    await _pumpUntilFound(tester, find.textContaining('如今，那些在基督耶稣里的就不定罪了'));
    expect(find.byType(NavigationBar).hitTestable(), findsNothing);
    expect(find.text('罗马书 8'), findsWidgets);
    expect(find.textContaining('如今，那些在基督耶稣里的就不定罪了'), findsOneWidget);
    await _scrollUntilFound(tester, find.textContaining('我们晓得万事都互相效力'));
    expect(find.textContaining('我们晓得万事都互相效力'), findsOneWidget);
  });

  testWidgets('tapping a Bible verse opens the verse tools bottom sheet', (
    tester,
  ) async {
    final harness = await _localizedApp(locale: const Locale('zh'));
    addTearDown(harness.close);
    await tester.runAsync(
      () => harness.seedBible(verseTranslationIds: const ['cuvs']),
    );

    await tester.pumpWidget(harness.widget);
    await _pumpUntilFound(tester, find.text('读经'));
    await _openBookChapterSheet(
      tester,
      loadedLabel: '新约',
      bookName: '罗马书',
      chapterCountLabel: '16 章',
    );
    await _tapChapterButton(tester, '8');

    final verse = find.textContaining('如今，那些在基督耶稣里的就不定罪了');
    await _pumpUntilFound(tester, verse);
    await tester.tap(verse);
    await _pumpUntilFound(tester, find.text('我的笔记'));

    expect(find.byType(BottomSheet), findsOneWidget);
    expect(find.text('我的笔记'), findsOneWidget);
    expect(find.text('教会心得'), findsOneWidget);
  });

  testWidgets('Bible reader exposes TTS controls without starting playback', (
    tester,
  ) async {
    final harness = await _localizedApp(
      locale: const Locale('zh'),
      sharedPreferencesValues: const {'reader_tts_rate': 0.62},
    );
    addTearDown(harness.close);
    await tester.runAsync(
      () => harness.seedBible(verseTranslationIds: const ['cuvs']),
    );

    await tester.pumpWidget(harness.widget);
    await _pumpUntilFound(tester, find.text('读经'));

    await _openBookChapterSheet(
      tester,
      loadedLabel: '新约',
      bookName: '罗马书',
      chapterCountLabel: '16 章',
    );
    await _tapChapterButton(tester, '8');
    await _pumpUntilFound(tester, find.text('朗读圣经'));

    final initialRate = tester.widget<Slider>(find.byType(Slider)).value;
    expect(initialRate, 0.62);
    expect(find.byTooltip('朗读'), findsOneWidget);
    expect(find.byTooltip('上一节'), findsOneWidget);
    expect(find.byTooltip('下一节'), findsOneWidget);
    expect(find.byTooltip('停止朗读'), findsOneWidget);
    expect(
      tester
          .widget<IconButton>(
            find.widgetWithIcon(IconButton, Icons.skip_previous),
          )
          .onPressed,
      isNull,
    );
    expect(
      tester
          .widget<IconButton>(find.widgetWithIcon(IconButton, Icons.skip_next))
          .onPressed,
      isNull,
    );
    expect(
      tester
          .widget<IconButton>(find.widgetWithIcon(IconButton, Icons.stop))
          .onPressed,
      isNull,
    );

    await tester.drag(find.byType(Slider), const Offset(-160, 0));
    await tester.pumpAndSettle();
    final updatedRate = tester.widget<Slider>(find.byType(Slider)).value;
    expect(updatedRate, lessThan(initialRate));
    expect(harness.sharedPreferences.getDouble('reader_tts_rate'), updatedRate);
  });

  testWidgets('searches Bible text and opens the selected verse', (
    tester,
  ) async {
    final harness = await _localizedApp(locale: const Locale('zh'));
    addTearDown(harness.close);
    await tester.runAsync(
      () => harness.seedBible(verseTranslationIds: const ['cuvs']),
    );

    await tester.pumpWidget(harness.widget);
    await _pumpUntilFound(tester, find.text('读经'));

    await tester.tap(find.byTooltip('搜索经文'));
    await _pumpUntilFound(tester, find.text('搜索经文'));
    expect(find.text('搜索经文'), findsWidgets);

    await tester.enterText(find.byType(TextField), '万事互相效力');
    await tester.pump(const Duration(milliseconds: 320));
    await _pumpUntilFound(tester, find.text('罗马书 8:28'));

    await tester.tap(find.text('罗马书 8:28'));
    await _pumpUntilFound(
      tester,
      find.textContaining('我们晓得万事都互相效力').hitTestable(),
    );

    expect(find.byType(NavigationBar).hitTestable(), findsNothing);
    expect(find.textContaining('我们晓得万事都互相效力').hitTestable(), findsOneWidget);
  });

  testWidgets('reader verse picker scrolls to selected verse', (tester) async {
    final harness = await _localizedApp(locale: const Locale('zh'));
    addTearDown(harness.close);
    await tester.runAsync(
      () => harness.seedBible(verseTranslationIds: const ['cuvs']),
    );

    await tester.pumpWidget(harness.widget);
    await _pumpUntilFound(tester, find.text('读经'));

    await _openBookChapterSheet(
      tester,
      loadedLabel: '新约',
      bookName: '罗马书',
      chapterCountLabel: '16 章',
    );
    await _tapChapterButton(tester, '8');
    await _pumpUntilFound(tester, find.text('罗马书 8'));

    await tester.tap(find.byTooltip('选择经节'));
    await _pumpUntilFound(tester, find.text('选择经节'));
    expect(find.text('选择经节'), findsOneWidget);

    await tester.scrollUntilVisible(
      find.widgetWithText(FilledButton, '28'),
      120,
      scrollable: find.byType(Scrollable).last,
    );
    await tester.pump(const Duration(milliseconds: 240));
    await tester.tap(find.widgetWithText(FilledButton, '28'));
    await _pumpUntilFound(
      tester,
      find.textContaining('我们晓得万事都互相效力').hitTestable(),
    );

    expect(find.textContaining('我们晓得万事都互相效力').hitTestable(), findsOneWidget);
  });

  testWidgets('updates continue reading card after opening another chapter', (
    tester,
  ) async {
    final harness = await _localizedApp(locale: const Locale('zh'));
    addTearDown(harness.close);
    await tester.runAsync(
      () => harness.seedBible(verseTranslationIds: const ['cuvs']),
    );

    await tester.pumpWidget(harness.widget);
    await _pumpUntilFound(tester, find.text('读经'));

    await _pumpUntilFound(tester, find.byKey(const ValueKey('study-content')));
    if (find.text('旧约').evaluate().isEmpty) {
      await _scrollUntilFound(tester, find.text('旧约'), maxDrags: 8);
    }
    await tester.tap(find.text('旧约').hitTestable().first);
    await tester.pump(const Duration(milliseconds: 260));
    await _scrollUntilFound(tester, find.text('创世记'), maxDrags: 30);
    await tester.tap(find.text('创世记').hitTestable().first);
    await _pumpUntilFound(tester, find.text('50 章'));
    await _tapChapterButton(tester, '1');
    await _pumpUntilFound(tester, find.textContaining('起初， 神创造天地'));
    expect(find.byType(NavigationBar).hitTestable(), findsNothing);

    const restoredText = '有晚上，有早晨，是第四日';
    await _scrollUntilFound(tester, find.textContaining(restoredText));
    await tester.pump(const Duration(milliseconds: 400));

    await tester.tap(find.byIcon(Icons.arrow_back_rounded).first);
    await _scrollToTop(tester);
    final restoredCardTitle = find.descendant(
      of: find.byType(ContinueReadingCard),
      matching: find.text('创世记 1'),
    );
    await _pumpUntilFound(tester, restoredCardTitle);

    expect(restoredCardTitle, findsOneWidget);

    await tester.ensureVisible(find.widgetWithText(FilledButton, '继续'));
    await tester.pump(const Duration(milliseconds: 240));
    await tester.tap(find.widgetWithText(FilledButton, '继续'));
    await _pumpUntilFound(tester, find.textContaining(restoredText));
    expect(find.byType(NavigationBar).hitTestable(), findsNothing);
    expect(find.textContaining(restoredText), findsOneWidget);
  });

  testWidgets('reader settings slider updates its visible value', (
    tester,
  ) async {
    var changedScale = 1.0;
    await tester.pumpWidget(
      MaterialApp(
        locale: const Locale('zh'),
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        supportedLocales: AppLocalizations.supportedLocales,
        home: Scaffold(
          body: ReaderSettingsSheet(
            readerScale: changedScale,
            onReaderScaleChanged: (value) {
              changedScale = value;
            },
          ),
        ),
      ),
    );

    final before = tester.widget<Slider>(find.byType(Slider)).value;
    await tester.drag(find.byType(Slider), const Offset(120, 0));
    await tester.pump();
    final after = tester.widget<Slider>(find.byType(Slider)).value;

    expect(after, greaterThan(before));
    expect(changedScale, after);
  });
}
