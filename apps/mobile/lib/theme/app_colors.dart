import 'package:flutter/material.dart';

/// Semantic aliases for the Material 3 dynamic surface hierarchy.
extension AppColorSchemeX on ColorScheme {
  bool get isLight => brightness == Brightness.light;

  Color get navigationBg => isLight ? surfaceContainer : surfaceContainerHigh;

  Color get scaffoldBg => surface;

  Color get tintedCardColor => isLight ? surfaceContainerLow : surfaceContainer;

  Color get insetSurfaceColor => surfaceContainerHighest;

  Color get subtleOutline => isLight
      ? outlineVariant.withValues(alpha: 0.3)
      : outlineVariant.withValues(alpha: 0.1);
}
