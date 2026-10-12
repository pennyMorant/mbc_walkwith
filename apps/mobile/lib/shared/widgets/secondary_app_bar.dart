import 'package:flutter/material.dart';

class SecondaryAppBar extends StatelessWidget implements PreferredSizeWidget {
  const SecondaryAppBar({
    super.key,
    required this.title,
    this.actions,
    this.showBackButton = true,
    this.onBackPressed,
    this.onBack,
  });

  final String title;
  final List<Widget>? actions;
  final bool showBackButton;
  final VoidCallback? onBackPressed;
  final VoidCallback? onBack;

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight + 8);

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return AppBar(
      toolbarHeight: kToolbarHeight + 8,
      elevation: 0,
      scrolledUnderElevation: 0,
      backgroundColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
      foregroundColor: cs.onSurface,
      centerTitle: true,
      title: Text(
        title,
        style: Theme.of(context).textTheme.titleLarge?.copyWith(
          color: cs.onSurface,
          fontWeight: FontWeight.w800,
        ),
      ),
      leadingWidth: 64,
      leading: showBackButton
          ? Padding(
              padding: const EdgeInsets.only(left: 12),
              child: Center(
                child: _SecondaryBackButton(onPressed: onBackPressed ?? onBack),
              ),
            )
          : null,
      actions: actions,
    );
  }
}

class _SecondaryBackButton extends StatelessWidget {
  const _SecondaryBackButton({this.onPressed});

  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final bgColor = Color.alphaBlend(
      cs.primary.withValues(alpha: 0.12),
      cs.surfaceContainerHighest,
    );

    return SizedBox(
      width: 44,
      height: 44,
      child: Material(
        color: bgColor,
        shape: const CircleBorder(),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onPressed ?? () => Navigator.maybePop(context),
          child: Icon(Icons.arrow_back_rounded, color: cs.primary, size: 22),
        ),
      ),
    );
  }
}
