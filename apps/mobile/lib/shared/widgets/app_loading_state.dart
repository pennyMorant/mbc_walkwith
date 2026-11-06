import 'package:flutter/material.dart';

class AppLoadingState extends StatelessWidget {
  const AppLoadingState({super.key, this.semanticLabel});

  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: semanticLabel,
      liveRegion: semanticLabel != null,
      child: const Center(child: CircularProgressIndicator()),
    );
  }
}
