import 'package:flutter/material.dart';

class AppBottomSheetScaffold extends StatelessWidget {
  const AppBottomSheetScaffold({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.fromLTRB(20, 0, 20, 20),
    this.safeAreaTop = true,
    this.controller,
    this.physics,
  });

  final Widget child;
  final EdgeInsets padding;
  final bool safeAreaTop;
  final ScrollController? controller;
  final ScrollPhysics? physics;

  @override
  Widget build(BuildContext context) {
    final keyboardInset = MediaQuery.viewInsetsOf(context).bottom;
    return SafeArea(
      top: safeAreaTop,
      child: SingleChildScrollView(
        controller: controller,
        physics: physics,
        padding: padding.copyWith(bottom: padding.bottom + keyboardInset),
        child: child,
      ),
    );
  }
}
