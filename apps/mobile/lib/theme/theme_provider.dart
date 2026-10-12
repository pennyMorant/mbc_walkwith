import 'package:flutter/material.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../core/storage/shared_preferences_provider.dart';

part 'theme_provider.g.dart';

@Riverpod(keepAlive: true)
class ThemeModeNotifier extends _$ThemeModeNotifier {
  static const String _key = 'theme_mode_index';

  @override
  ThemeMode build() {
    final prefs = ref.watch(sharedPreferencesProvider);
    final index = prefs.getInt(_key) ?? ThemeMode.system.index;

    if (index < 0 || index >= ThemeMode.values.length) {
      return ThemeMode.system;
    }

    return ThemeMode.values[index];
  }

  void updateThemeMode(ThemeMode mode) {
    state = mode;
    ref.read(sharedPreferencesProvider).setInt(_key, mode.index);
  }
}
