import 'package:flutter/material.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/platform/external_link_service.dart';

class AppMarkdownBody extends ConsumerWidget {
  const AppMarkdownBody({
    super.key,
    required this.data,
    this.emptyFallback,
    this.emptyColor,
  });

  final String data;
  final String? emptyFallback;
  final Color? emptyColor;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final value = data.trim();
    final displayValue = value.isEmpty ? emptyFallback?.trim() ?? '' : value;
    if (displayValue.isEmpty) {
      return const SizedBox.shrink();
    }

    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isEmpty = value.isEmpty;
    final textColor = isEmpty ? emptyColor : colorScheme.onSurface;

    return MarkdownBody(
      data: displayValue,
      selectable: true,
      onTapLink: (text, href, title) {
        ref.read(externalLinkServiceProvider).openExternalUrl(href);
      },
      styleSheet: MarkdownStyleSheet.fromTheme(theme).copyWith(
        a: theme.textTheme.bodyLarge?.copyWith(
          color: colorScheme.primary,
          decoration: TextDecoration.underline,
          decorationColor: colorScheme.primary,
        ),
        p: theme.textTheme.bodyLarge?.copyWith(color: textColor, height: 1.65),
        h1: theme.textTheme.titleLarge?.copyWith(
          color: colorScheme.onSurface,
          fontWeight: FontWeight.w800,
        ),
        h2: theme.textTheme.titleMedium?.copyWith(
          color: colorScheme.onSurface,
          fontWeight: FontWeight.w800,
        ),
        h3: theme.textTheme.titleSmall?.copyWith(
          color: colorScheme.onSurface,
          fontWeight: FontWeight.w800,
        ),
        blockquote: theme.textTheme.bodyLarge?.copyWith(
          color: colorScheme.onSurfaceVariant,
          height: 1.6,
        ),
        blockquoteDecoration: BoxDecoration(
          color: colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(8),
          border: Border(
            left: BorderSide(color: colorScheme.primary, width: 4),
          ),
        ),
        codeblockDecoration: BoxDecoration(
          color: colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(8),
        ),
        blockSpacing: 12,
        listIndent: 24,
      ),
    );
  }
}
