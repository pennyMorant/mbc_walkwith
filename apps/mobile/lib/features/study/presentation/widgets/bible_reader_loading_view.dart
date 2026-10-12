import 'package:flutter/material.dart';

import '../../../../shared/widgets/app_skeleton.dart';

class BibleReaderLoadingView extends StatelessWidget {
  const BibleReaderLoadingView({super.key});

  @override
  Widget build(BuildContext context) {
    return const AppSkeletonGroup(
      child: CustomScrollView(
        physics: NeverScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(child: _ReaderHeaderSkeleton()),
          SliverToBoxAdapter(child: _ReaderVerseSkeletonList()),
        ],
      ),
    );
  }
}

class _ReaderHeaderSkeleton extends StatelessWidget {
  const _ReaderHeaderSkeleton();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              AppSkeletonBox(width: 104, height: 34, borderRadius: 999),
              AppSkeletonBox(width: 64, height: 34, borderRadius: 999),
              AppSkeletonBox(width: 120, height: 34, borderRadius: 999),
            ],
          ),
          SizedBox(height: 20),
          AppSkeletonBox(width: 172, height: 30, borderRadius: 10),
          SizedBox(height: 10),
          AppSkeletonBox(width: double.infinity, height: 16, borderRadius: 8),
          SizedBox(height: 6),
          AppSkeletonBox(width: 240, height: 16, borderRadius: 8),
        ],
      ),
    );
  }
}

class _ReaderVerseSkeletonList extends StatelessWidget {
  const _ReaderVerseSkeletonList();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 4, 12, 24),
      child: Column(
        children: [
          for (var index = 0; index < 10; index += 1)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(
                    width: 36,
                    child: AppSkeletonBox(
                      width: 20,
                      height: 18,
                      borderRadius: 6,
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const AppSkeletonBox(
                          width: double.infinity,
                          height: 18,
                          borderRadius: 8,
                        ),
                        const SizedBox(height: 10),
                        AppSkeletonBox(
                          width: index.isEven ? 280 : 220,
                          height: 18,
                          borderRadius: 8,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
