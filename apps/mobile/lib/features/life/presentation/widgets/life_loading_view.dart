import 'package:flutter/material.dart';

import '../../../../shared/widgets/app_skeleton.dart';
import '../../../../shared/widgets/section_header.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_theme.dart';

class LifeLoadingView extends StatelessWidget {
  const LifeLoadingView({super.key});

  @override
  Widget build(BuildContext context) {
    return const AppSkeletonGroup(
      child: CustomScrollView(
        physics: NeverScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(child: _LifeHeroSkeleton()),
          SliverToBoxAdapter(child: _PostListSkeleton()),
          SliverToBoxAdapter(child: SectionHeader(title: '')),
          SliverToBoxAdapter(child: _PostListSkeleton()),
        ],
      ),
    );
  }
}

class _LifeHeroSkeleton extends StatelessWidget {
  const _LifeHeroSkeleton();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
      child: Card(
        color: colorScheme.tintedCardColor,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppTheme.cardRadius),
        ),
        child: const Padding(
          padding: EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  AppSkeletonBox(width: 44, height: 44, borderRadius: 999),
                  SizedBox(width: 12),
                  Expanded(child: AppSkeletonBox(height: 22, borderRadius: 8)),
                ],
              ),
              SizedBox(height: 18),
              AppSkeletonBox(
                width: double.infinity,
                height: 16,
                borderRadius: 8,
              ),
              SizedBox(height: 8),
              AppSkeletonBox(width: 220, height: 16, borderRadius: 8),
            ],
          ),
        ),
      ),
    );
  }
}

class _PostListSkeleton extends StatelessWidget {
  const _PostListSkeleton();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          AppSkeletonBox(width: double.infinity, height: 92, borderRadius: 24),
          SizedBox(height: 8),
          AppSkeletonBox(width: double.infinity, height: 92, borderRadius: 24),
          SizedBox(height: 8),
          AppSkeletonBox(width: double.infinity, height: 92, borderRadius: 24),
        ],
      ),
    );
  }
}
