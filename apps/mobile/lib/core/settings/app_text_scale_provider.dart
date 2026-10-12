import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../storage/shared_preferences_provider.dart';

enum AppTextScale { system, standard, large, extraLarge }

final appTextScaleProvider =
    NotifierProvider<AppTextScaleNotifier, AppTextScale>(
      AppTextScaleNotifier.new,
    );

class AppTextScaleNotifier extends Notifier<AppTextScale> {
  static const _key = 'app_text_scale';

  @override
  AppTextScale build() {
    final prefs = ref.watch(sharedPreferencesProvider);
    final saved = prefs.getString(_key);
    return AppTextScale.values.firstWhere(
      (value) => value.name == saved,
      orElse: () => AppTextScale.system,
    );
  }

  Future<void> update(AppTextScale scale) async {
    state = scale;
    await ref.read(sharedPreferencesProvider).setString(_key, scale.name);
  }
}

TextScaler textScalerForPreference(
  AppTextScale scale,
  TextScaler systemTextScaler,
) {
  return switch (scale) {
    AppTextScale.system => systemTextScaler,
    AppTextScale.standard => TextScaler.noScaling,
    AppTextScale.large => const TextScaler.linear(1.15),
    AppTextScale.extraLarge => const TextScaler.linear(1.30),
  };
}
