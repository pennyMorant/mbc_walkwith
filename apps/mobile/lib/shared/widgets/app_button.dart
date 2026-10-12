import 'package:flutter/material.dart';

enum AppButtonVariant { filled, tonal, outlined, text }

enum AppButtonShape { stadium, rounded }

class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.selected = false,
    this.variant = AppButtonVariant.tonal,
    this.shape = AppButtonShape.stadium,
    this.padding = const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
    this.minHeight = 44,
    this.iconSize = 18,
    this.backgroundColor,
    this.foregroundColor,
    this.selectedBackgroundColor,
    this.selectedForegroundColor,
    this.textStyle,
    this.semanticLabel,
    this.loading = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool selected;
  final AppButtonVariant variant;
  final AppButtonShape shape;
  final EdgeInsetsGeometry padding;
  final double minHeight;
  final double iconSize;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final Color? selectedBackgroundColor;
  final Color? selectedForegroundColor;
  final TextStyle? textStyle;
  final String? semanticLabel;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    final effectiveOnPressed = loading ? null : onPressed;
    final style = _buttonStyle(context);
    final child = Text(
      label,
      textAlign: TextAlign.center,
      semanticsLabel: semanticLabel,
    );
    final effectiveIcon = loading
        ? SizedBox.square(
            dimension: iconSize,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: _buttonColors(
                Theme.of(context).colorScheme,
                disabled: false,
              ).foreground,
            ),
          )
        : icon == null
        ? null
        : Icon(icon, size: iconSize);

    if (effectiveIcon == null) {
      return switch (variant) {
        AppButtonVariant.filled => FilledButton(
          onPressed: effectiveOnPressed,
          style: style,
          child: child,
        ),
        AppButtonVariant.tonal => FilledButton.tonal(
          onPressed: effectiveOnPressed,
          style: style,
          child: child,
        ),
        AppButtonVariant.outlined => OutlinedButton(
          onPressed: effectiveOnPressed,
          style: style,
          child: child,
        ),
        AppButtonVariant.text => TextButton(
          onPressed: effectiveOnPressed,
          style: style,
          child: child,
        ),
      };
    }

    return switch (variant) {
      AppButtonVariant.filled => FilledButton.icon(
        onPressed: effectiveOnPressed,
        style: style,
        icon: effectiveIcon,
        label: child,
      ),
      AppButtonVariant.tonal => FilledButton.tonalIcon(
        onPressed: effectiveOnPressed,
        style: style,
        icon: effectiveIcon,
        label: child,
      ),
      AppButtonVariant.outlined => OutlinedButton.icon(
        onPressed: effectiveOnPressed,
        style: style,
        icon: effectiveIcon,
        label: child,
      ),
      AppButtonVariant.text => TextButton.icon(
        onPressed: effectiveOnPressed,
        style: style,
        icon: effectiveIcon,
        label: child,
      ),
    };
  }

  ButtonStyle _buttonStyle(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return ButtonStyle(
      minimumSize: WidgetStatePropertyAll(Size(0, minHeight)),
      padding: WidgetStatePropertyAll(padding),
      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
      visualDensity: VisualDensity.standard,
      shape: WidgetStatePropertyAll(_buttonShape()),
      textStyle: WidgetStatePropertyAll(textStyle),
      backgroundColor: WidgetStateProperty.resolveWith(
        (states) => _buttonColors(
          colorScheme,
          disabled: states.contains(WidgetState.disabled) && !loading,
        ).background,
      ),
      foregroundColor: WidgetStateProperty.resolveWith(
        (states) => _buttonColors(
          colorScheme,
          disabled: states.contains(WidgetState.disabled) && !loading,
        ).foreground,
      ),
    );
  }

  _AppButtonColors _buttonColors(
    ColorScheme colorScheme, {
    required bool disabled,
  }) {
    if (disabled) {
      return _AppButtonColors(
        background: _disabledBackground(colorScheme),
        foreground: colorScheme.onSurface.withValues(alpha: 0.38),
      );
    }

    if (selected) {
      return _AppButtonColors(
        background: selectedBackgroundColor ?? colorScheme.secondaryContainer,
        foreground: selectedForegroundColor ?? colorScheme.onSecondaryContainer,
      );
    }

    return switch (variant) {
      AppButtonVariant.filled => _AppButtonColors(
        background: backgroundColor ?? colorScheme.primary,
        foreground: foregroundColor ?? colorScheme.onPrimary,
      ),
      AppButtonVariant.tonal => _AppButtonColors(
        background: backgroundColor ?? colorScheme.surfaceContainerHighest,
        foreground: foregroundColor ?? colorScheme.onSurfaceVariant,
      ),
      AppButtonVariant.outlined || AppButtonVariant.text => _AppButtonColors(
        background: backgroundColor ?? Colors.transparent,
        foreground: foregroundColor ?? colorScheme.primary,
      ),
    };
  }

  Color _disabledBackground(ColorScheme colorScheme) {
    return switch (variant) {
      AppButtonVariant.filled ||
      AppButtonVariant.tonal => colorScheme.onSurface.withValues(alpha: 0.12),
      AppButtonVariant.outlined || AppButtonVariant.text => Colors.transparent,
    };
  }

  OutlinedBorder _buttonShape() {
    return switch (shape) {
      AppButtonShape.stadium => const StadiumBorder(),
      AppButtonShape.rounded => RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    };
  }
}

class _AppButtonColors {
  const _AppButtonColors({required this.background, required this.foreground});

  final Color background;
  final Color foreground;
}
