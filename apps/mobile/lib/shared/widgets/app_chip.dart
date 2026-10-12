import 'package:flutter/material.dart';

enum AppChipVariant { filled, tonal, outlined }

enum AppChipShape { stadium, rounded }

class AppChip extends StatelessWidget {
  const AppChip({
    super.key,
    required this.label,
    this.icon,
    this.selected = false,
    this.variant = AppChipVariant.tonal,
    this.shape = AppChipShape.stadium,
    this.maxLines = 1,
    this.padding = const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
    this.backgroundColor,
    this.foregroundColor,
    this.selectedBackgroundColor,
    this.selectedForegroundColor,
    this.borderColor,
    this.textStyle,
    this.textAlign = TextAlign.center,
    this.iconSize = 16,
    this.iconGap = 6,
  });

  final String label;
  final IconData? icon;
  final bool selected;
  final AppChipVariant variant;
  final AppChipShape shape;
  final int maxLines;
  final EdgeInsetsGeometry padding;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final Color? selectedBackgroundColor;
  final Color? selectedForegroundColor;
  final Color? borderColor;
  final TextStyle? textStyle;
  final TextAlign textAlign;
  final double iconSize;
  final double iconGap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final colors = _chipColors(colorScheme);
    final baseTextStyle =
        textStyle ??
        Theme.of(
          context,
        ).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w700);

    return DecoratedBox(
      decoration: ShapeDecoration(
        color: colors.background,
        shape: _chipBorder(
          side: BorderSide(color: colors.border, width: colors.borderWidth),
        ),
      ),
      child: Padding(
        padding: padding,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[
              Icon(icon, size: iconSize, color: colors.foreground),
              SizedBox(width: iconGap),
            ],
            Text(
              label,
              maxLines: maxLines,
              overflow: TextOverflow.ellipsis,
              textAlign: textAlign,
              style: baseTextStyle?.copyWith(
                color: textStyle?.color ?? colors.foreground,
              ),
            ),
          ],
        ),
      ),
    );
  }

  _AppChipColors _chipColors(ColorScheme colorScheme) {
    final selectedBackground =
        selectedBackgroundColor ?? colorScheme.secondaryContainer;
    final selectedForeground =
        selectedForegroundColor ?? colorScheme.onSecondaryContainer;

    if (selected) {
      return _AppChipColors(
        background: selectedBackground,
        foreground: selectedForeground,
        border: borderColor ?? Colors.transparent,
        borderWidth: variant == AppChipVariant.outlined ? 1 : 0,
      );
    }

    return switch (variant) {
      AppChipVariant.filled => _AppChipColors(
        background: backgroundColor ?? colorScheme.surfaceContainerHighest,
        foreground: foregroundColor ?? colorScheme.onSurfaceVariant,
        border: borderColor ?? Colors.transparent,
        borderWidth: 0,
      ),
      AppChipVariant.tonal => _AppChipColors(
        background: backgroundColor ?? colorScheme.surfaceContainerHighest,
        foreground: foregroundColor ?? colorScheme.onSurfaceVariant,
        border: borderColor ?? Colors.transparent,
        borderWidth: 0,
      ),
      AppChipVariant.outlined => _AppChipColors(
        background: backgroundColor ?? Colors.transparent,
        foreground: foregroundColor ?? colorScheme.onSurfaceVariant,
        border: borderColor ?? colorScheme.outlineVariant,
        borderWidth: 1,
      ),
    };
  }

  OutlinedBorder _chipBorder({required BorderSide side}) {
    return switch (shape) {
      AppChipShape.stadium => StadiumBorder(side: side),
      AppChipShape.rounded => RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
        side: side,
      ),
    };
  }
}

class _AppChipColors {
  const _AppChipColors({
    required this.background,
    required this.foreground,
    required this.border,
    required this.borderWidth,
  });

  final Color background;
  final Color foreground;
  final Color border;
  final double borderWidth;
}
