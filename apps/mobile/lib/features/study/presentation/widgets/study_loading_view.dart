import 'package:flutter/material.dart';

import '../../../../shared/widgets/app_skeleton.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_theme.dart';

class StudyLoadingView extends StatelessWidget {
  const StudyLoadingView({super.key});

  @override
  Widget build(BuildContext context) {
    return const AppSkeletonGroup(
      child: CustomScrollView(
        physics: NeverScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(child: ContinueReadingCardSkeleton()),
          SliverToBoxAdapter(child: _TestamentSkeleton()),
          _BookSectionSkeleton(tileCount: 5),
          _BookSectionSkeleton(tileCount: 6),
          _BookSectionSkeleton(tileCount: 4),
          SliverToBoxAdapter(child: SizedBox(height: 24)),
        ],
      ),
    );
  }
}

class ContinueReadingCardSkeleton extends StatelessWidget {
  const ContinueReadingCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 18),
      child: Card(
        color: colorScheme.primaryContainer.withValues(alpha: 0.82),
        child: const Padding(
          padding: EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  AppSkeletonBox(width: 26, height: 26, borderRadius: 999),
                  SizedBox(width: 10),
                  AppSkeletonBox(width: 92, height: 18, borderRadius: 8),
                ],
              ),
              SizedBox(height: 18),
              AppSkeletonBox(width: 128, height: 28, borderRadius: 10),
              SizedBox(height: 10),
              AppSkeletonBox(width: 172, height: 16, borderRadius: 8),
              SizedBox(height: 18),
              AppSkeletonBox(width: 96, height: 44, borderRadius: 999),
            ],
          ),
        ),
      ),
    );
  }
}

class _TestamentSkeleton extends StatelessWidget {
  const _TestamentSkeleton();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Expanded(child: AppSkeletonBox(height: 44, borderRadius: 999)),
          SizedBox(width: 8),
          Expanded(child: AppSkeletonBox(height: 44, borderRadius: 999)),
        ],
      ),
    );
  }
}

class _BookSectionSkeleton extends StatelessWidget {
  const _BookSectionSkeleton({required this.tileCount});

  final int tileCount;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 0),
      sliver: SliverToBoxAdapter(
        child: Card(
          clipBehavior: Clip.antiAlias,
          color: colorScheme.tintedCardColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppTheme.cardRadius),
          ),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    AppSkeletonBox(width: 96, height: 20, borderRadius: 8),
                    Spacer(),
                    AppSkeletonBox(width: 58, height: 30, borderRadius: 999),
                  ],
                ),
                const SizedBox(height: 14),
                LayoutBuilder(
                  builder: (context, constraints) {
                    if (constraints.maxWidth <= 0) {
                      return const SizedBox.shrink();
                    }

                    return GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: tileCount,
                      gridDelegate:
                          const SliverGridDelegateWithMaxCrossAxisExtent(
                            maxCrossAxisExtent: 108,
                            mainAxisSpacing: 8,
                            crossAxisSpacing: 8,
                            childAspectRatio: 1.66,
                          ),
                      itemBuilder: (context, index) {
                        return const AppSkeletonBox(
                          height: 54,
                          borderRadius: 14,
                        );
                      },
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
