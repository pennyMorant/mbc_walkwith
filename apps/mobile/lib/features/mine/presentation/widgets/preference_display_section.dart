import 'package:flutter/material.dart';

import '../../../../core/settings/app_text_scale_provider.dart';
import '../../../../l10n/app_localizations.dart';

class PreferenceAppearanceControl extends StatelessWidget {
  const PreferenceAppearanceControl({
    super.key,
    required this.themeMode,
    required this.onChanged,
  });

  final ThemeMode themeMode;
  final ValueChanged<ThemeMode> onChanged;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        PreferenceSectionLabel(label: l10n.appearanceTitle),
        const SizedBox(height: 12),
        SegmentedButton<ThemeMode>(
          segments: [
            ButtonSegment(
              value: ThemeMode.system,
              icon: const Icon(Icons.brightness_auto),
              label: Text(l10n.themeModeSystem),
            ),
            ButtonSegment(
              value: ThemeMode.light,
              icon: const Icon(Icons.light_mode),
              label: Text(l10n.themeModeLight),
            ),
            ButtonSegment(
              value: ThemeMode.dark,
              icon: const Icon(Icons.dark_mode),
              label: Text(l10n.themeModeDark),
            ),
          ],
          selected: {themeMode},
          onSelectionChanged: (selection) => onChanged(selection.first),
        ),
      ],
    );
  }
}

class PreferenceTextScaleControl extends StatelessWidget {
  const PreferenceTextScaleControl({
    super.key,
    required this.textScale,
    required this.onChanged,
  });

  final AppTextScale textScale;
  final ValueChanged<AppTextScale> onChanged;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    final label = _textScaleLabel(l10n, textScale);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(child: PreferenceSectionLabel(label: l10n.textSizeTitle)),
            Text(
              label,
              style: Theme.of(context).textTheme.labelLarge?.copyWith(
                color: colorScheme.primary,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          l10n.textSizeBody,
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant),
        ),
        Slider(
          value: _textScaleValue(textScale),
          min: 0,
          max: 3,
          divisions: 3,
          label: label,
          onChanged: (value) => onChanged(_textScaleFromValue(value.round())),
        ),
      ],
    );
  }
}

class PreferenceSectionLabel extends StatelessWidget {
  const PreferenceSectionLabel({super.key, required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: Theme.of(context).textTheme.titleSmall?.copyWith(
        color: Theme.of(context).colorScheme.onSurfaceVariant,
        fontWeight: FontWeight.w800,
      ),
    );
  }
}

double _textScaleValue(AppTextScale scale) {
  return switch (scale) {
    AppTextScale.system => 0,
    AppTextScale.standard => 1,
    AppTextScale.large => 2,
    AppTextScale.extraLarge => 3,
  };
}

AppTextScale _textScaleFromValue(int value) {
  return switch (value.clamp(0, 3)) {
    0 => AppTextScale.system,
    1 => AppTextScale.standard,
    2 => AppTextScale.large,
    _ => AppTextScale.extraLarge,
  };
}

String _textScaleLabel(AppLocalizations l10n, AppTextScale scale) {
  return switch (scale) {
    AppTextScale.system => l10n.textSizeSystem,
    AppTextScale.standard => l10n.textSizeStandard,
    AppTextScale.large => l10n.textSizeLarge,
    AppTextScale.extraLarge => l10n.textSizeExtraLarge,
  };
}
