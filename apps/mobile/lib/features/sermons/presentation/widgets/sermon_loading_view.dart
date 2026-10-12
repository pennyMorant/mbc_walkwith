import 'package:flutter/material.dart';

import '../../../../shared/widgets/app_skeleton.dart';
import '../../../../shared/widgets/section_header.dart';
import '../../../../theme/app_colors.dart';
import '../../../../theme/app_theme.dart';

class SermonLoadingView extends StatelessWidget {
  const SermonLoadingView({super.key});

  @override
  Widget build(BuildContext context) {
    return const AppSkeletonGroup(
      child: CustomScrollView(
        physics: NeverScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(child: _PlayerSkeleton()),
          SliverToBoxAdapter(child: SectionHeader(title: '')),
          SliverToBoxAdapter(child: _OutlineSkeleton()),
          SliverToBoxAdapter(child: SectionHeader(title: '')),
          SliverToBoxAdapter(child: _ReferenceSkeleton()),
          SliverToBoxAdapter(child: SectionHeader(title: '')),
          SliverToBoxAdapter(child: _SermonListSkeleton()),
        ],
      ),
    );
  }
}

class _PlayerSkeleton extends StatelessWidget {
  const _PlayerSkeleton();

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
              AppSkeletonBox(width: 150, height: 22, borderRadius: 8),
              SizedBox(height: 10),
              AppSkeletonBox(width: 230, height: 16, borderRadius: 8),
              SizedBox(height: 22),
              AppSkeletonBox(
                width: double.infinity,
                height: 8,
                borderRadius: 999,
              ),
              SizedBox(height: 18),
              Row(
                children: [
                  AppSkeletonBox(width: 44, height: 44, borderRadius: 999),
                  SizedBox(width: 12),
                  AppSkeletonBox(width: 44, height: 44, borderRadius: 999),
                  Spacer(),
                  AppSkeletonBox(width: 72, height: 36, borderRadius: 999),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OutlineSkeleton extends StatelessWidget {
  const _OutlineSkeleton();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          AppSkeletonBox(width: double.infinity, height: 58, borderRadius: 18),
          SizedBox(height: 8),
          AppSkeletonBox(width: double.infinity, height: 58, borderRadius: 18),
          SizedBox(height: 8),
          AppSkeletonBox(width: double.infinity, height: 58, borderRadius: 18),
        ],
      ),
    );
  }
}

class _ReferenceSkeleton extends StatelessWidget {
  const _ReferenceSkeleton();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          AppSkeletonBox(width: 98, height: 40, borderRadius: 999),
          SizedBox(width: 8),
          AppSkeletonBox(width: 112, height: 40, borderRadius: 999),
          SizedBox(width: 8),
          AppSkeletonBox(width: 88, height: 40, borderRadius: 999),
        ],
      ),
    );
  }
}

class _SermonListSkeleton extends StatelessWidget {
  const _SermonListSkeleton();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.fromLTRB(20, 0, 20, 24),
      child: Column(
        children: [
          AppSkeletonBox(width: double.infinity, height: 104, borderRadius: 24),
          SizedBox(height: 8),
          AppSkeletonBox(width: double.infinity, height: 104, borderRadius: 24),
          SizedBox(height: 8),
          AppSkeletonBox(width: double.infinity, height: 104, borderRadius: 24),
        ],
      ),
    );
  }
}
