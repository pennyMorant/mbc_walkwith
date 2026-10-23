import 'package:flutter/material.dart';

class AppUnreadCountBadge extends StatelessWidget {
  const AppUnreadCountBadge({
    super.key,
    required this.count,
    this.child,
    this.semanticLabel,
  });

  final int count;
  final Widget? child;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    if (count <= 0) {
      return child ?? const SizedBox.shrink();
    }

    final badge = child == null
        ? _InlineUnreadCount(label: _displayLabel)
        : Badge(label: Text(_displayLabel), child: child);
    final label = semanticLabel?.trim();
    if (label == null || label.isEmpty) {
      return badge;
    }

    return Semantics(
      label: label,
      child: ExcludeSemantics(child: badge),
    );
  }

  String get _displayLabel => count > 99 ? '99+' : '${count.clamp(0, 99)}';
}

class _InlineUnreadCount extends StatelessWidget {
  const _InlineUnreadCount({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      constraints: const BoxConstraints(minWidth: 18),
      height: 18,
      padding: const EdgeInsets.symmetric(horizontal: 5),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: colorScheme.primary,
        borderRadius: BorderRadius.circular(99),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: colorScheme.onPrimary,
          fontSize: 11,
          fontWeight: FontWeight.w700,
          height: 1,
        ),
      ),
    );
  }
}
