import 'package:flutter/material.dart';

import '../../theme/app_colors.dart';

class AppSkeletonGroup extends StatefulWidget {
  const AppSkeletonGroup({super.key, required this.child});

  final Widget child;

  @override
  State<AppSkeletonGroup> createState() => _AppSkeletonGroupState();
}

class _AppSkeletonGroupState extends State<AppSkeletonGroup>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1350),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return _AppSkeletonScope(animation: _controller, child: widget.child);
  }
}

class AppSkeletonBox extends StatelessWidget {
  const AppSkeletonBox({
    super.key,
    required this.height,
    this.width,
    this.borderRadius = 12,
  });

  final double? width;
  final double height;
  final double borderRadius;

  @override
  Widget build(BuildContext context) {
    final animation = _AppSkeletonScope.maybeOf(context)?.animation;
    if (animation == null) {
      return _SkeletonPaint(
        width: width,
        height: height,
        borderRadius: borderRadius,
        progress: 0,
      );
    }

    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) {
        return _SkeletonPaint(
          width: width,
          height: height,
          borderRadius: borderRadius,
          progress: animation.value,
        );
      },
    );
  }
}

class _SkeletonPaint extends StatelessWidget {
  const _SkeletonPaint({
    required this.height,
    required this.borderRadius,
    required this.progress,
    this.width,
  });

  final double? width;
  final double height;
  final double borderRadius;
  final double progress;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final baseColor = colorScheme.insetSurfaceColor.withValues(alpha: 0.74);
    final highlightColor = Color.alphaBlend(
      colorScheme.primary.withValues(alpha: colorScheme.isLight ? 0.10 : 0.16),
      colorScheme.surfaceContainerHighest,
    );
    final offset = -1.6 + (progress * 3.2);

    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: SizedBox(
        width: width,
        height: height,
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment(offset, -0.7),
              end: Alignment(offset + 1.2, 0.7),
              colors: [baseColor, highlightColor, baseColor],
              stops: const [0.22, 0.5, 0.78],
            ),
          ),
        ),
      ),
    );
  }
}

class _AppSkeletonScope extends InheritedWidget {
  const _AppSkeletonScope({required this.animation, required super.child});

  final Animation<double> animation;

  static _AppSkeletonScope? maybeOf(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<_AppSkeletonScope>();
  }

  @override
  bool updateShouldNotify(_AppSkeletonScope oldWidget) {
    return animation != oldWidget.animation;
  }
}
