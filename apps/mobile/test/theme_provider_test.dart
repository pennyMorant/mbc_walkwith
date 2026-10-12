import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/storage/shared_preferences_provider.dart';
import 'package:mbc_walkwith/features/study/presentation/reader_assist_settings_provider.dart';
import 'package:mbc_walkwith/theme/app_colors.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';
import 'package:mbc_walkwith/theme/theme_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('app surfaces preserve Material 3 dynamic color roles', () {
    for (final brightness in Brightness.values) {
      final scheme = ColorScheme.fromSeed(
        seedColor: const Color(0xFF2E7D32),
        brightness: brightness,
      );
      final theme = AppTheme.build(scheme, brightness);

      expect(scheme.scaffoldBg, scheme.surface);
      final expectedCardColor = brightness == Brightness.light
          ? scheme.surfaceContainerLow
          : scheme.surfaceContainer;
      final expectedNavigationColor = brightness == Brightness.light
          ? scheme.surfaceContainer
          : scheme.surfaceContainerHigh;

      expect(scheme.tintedCardColor, expectedCardColor);
      expect(scheme.navigationBg, expectedNavigationColor);
      expect(scheme.insetSurfaceColor, scheme.surfaceContainerHighest);
      expect(theme.scaffoldBackgroundColor, scheme.surface);
      expect(theme.cardTheme.color, expectedCardColor);
      expect(theme.navigationBarTheme.backgroundColor, expectedNavigationColor);
    }
  });

  test('theme mode defaults to system and persists updates', () async {
    final prefs = await _testSharedPreferences();
    final container = ProviderContainer.test(
      overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
    );

    expect(container.read(themeModeProvider), ThemeMode.system);

    container.read(themeModeProvider.notifier).updateThemeMode(ThemeMode.dark);

    expect(container.read(themeModeProvider), ThemeMode.dark);
    expect(prefs.getInt('theme_mode_index'), ThemeMode.dark.index);
  });

  test('reader assist settings default and persist updates', () async {
    final prefs = await _testSharedPreferences();
    final container = ProviderContainer.test(
      overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
    );

    final settings = container.read(readerAssistSettingsProvider);
    expect(settings.showChapterPeople, isFalse);
    expect(settings.showChapterPlaces, isFalse);
    expect(settings.showLexicon, isTrue);
    expect(settings.showAiStudyHints, isTrue);

    container
        .read(readerAssistSettingsProvider.notifier)
        .updateChapterPeople(true);
    container.read(readerAssistSettingsProvider.notifier).updateLexicon(false);

    expect(
      container.read(readerAssistSettingsProvider).showChapterPeople,
      isTrue,
    );
    expect(container.read(readerAssistSettingsProvider).showLexicon, isFalse);
    expect(prefs.getBool('reader_assist_chapter_people'), isTrue);
    expect(prefs.getBool('reader_assist_lexicon'), isFalse);
  });
}

Future<SharedPreferences> _testSharedPreferences() async {
  SharedPreferences.setMockInitialValues({});
  return SharedPreferences.getInstance();
}
