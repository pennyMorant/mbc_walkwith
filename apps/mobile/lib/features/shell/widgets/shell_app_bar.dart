import 'package:flutter/material.dart';

class ShellAppBar extends StatelessWidget implements PreferredSizeWidget {
  const ShellAppBar({super.key, required this.title, this.actions});

  final String title;
  final List<Widget>? actions;

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight + 8);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final textTheme = theme.textTheme;

    return AppBar(
      toolbarHeight: kToolbarHeight + 8,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      backgroundColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
      titleSpacing: 16,
      title: Text(
        title,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: textTheme.headlineSmall?.copyWith(
          fontWeight: FontWeight.w800,
          color: colorScheme.onSurface,
        ),
      ),
      actions: _buildActions(actions),
    );
  }
}

List<Widget>? _buildActions(List<Widget>? actions) {
  if (actions == null || actions.isEmpty) {
    return actions;
  }

  return [
    for (var index = 0; index < actions.length; index += 1)
      Padding(
        padding: EdgeInsets.only(right: index == actions.length - 1 ? 20 : 8),
        child: actions[index] is IconButton
            ? _ShellIconAction(
                icon: (actions[index] as IconButton).icon,
                tooltip: (actions[index] as IconButton).tooltip,
                onTap: (actions[index] as IconButton).onPressed,
              )
            : actions[index],
      ),
  ];
}

class _ShellIconAction extends StatelessWidget {
  const _ShellIconAction({
    required this.icon,
    required this.tooltip,
    required this.onTap,
  });

  final Widget icon;
  final String? tooltip;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final action = Material(
      color: colorScheme.primary.withValues(alpha: 0.10),
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: SizedBox(
          width: 44,
          height: 44,
          child: IconTheme(
            data: IconThemeData(color: colorScheme.primary, size: 22),
            child: Center(child: icon),
          ),
        ),
      ),
    );

    if (tooltip == null || tooltip!.isEmpty) {
      return action;
    }

    return Tooltip(message: tooltip!, child: action);
  }
}
