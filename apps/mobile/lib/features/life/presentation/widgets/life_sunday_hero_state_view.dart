import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_skeleton.dart';
import '../../domain/life_post.dart';
import 'life_sunday_hero_card.dart';

class LifeSundayHeroStateView extends StatelessWidget {
  const LifeSundayHeroStateView({
    super.key,
    required this.postAsync,
    required this.showUnreadBadge,
    required this.onRetry,
  });

  final AsyncValue<LifePost?> postAsync;
  final bool showUnreadBadge;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return postAsync.when(
      loading: () => const _SundayHeroLoadingCard(),
      error: (error, stackTrace) => _SundayHeroErrorCard(onRetry: onRetry),
      data: (post) =>
          LifeSundayHeroCard(post: post, showUnreadBadge: showUnreadBadge),
    );
  }
}

class _SundayHeroLoadingCard extends StatelessWidget {
  const _SundayHeroLoadingCard();

  @override
  Widget build(BuildContext context) {
    return const AppSkeletonGroup(
      child: Card(
        child: Padding(
          padding: EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AppSkeletonBox(width: 96, height: 24, borderRadius: 999),
              SizedBox(height: 16),
              AppSkeletonBox(width: double.infinity, height: 24),
              SizedBox(height: 10),
              AppSkeletonBox(width: double.infinity, height: 16),
              SizedBox(height: 8),
              AppSkeletonBox(width: 220, height: 16),
            ],
          ),
        ),
      ),
    );
  }
}

class _SundayHeroErrorCard extends StatelessWidget {
  const _SundayHeroErrorCard({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.weeklyBulletinTitle,
              style: Theme.of(context).textTheme.titleLarge
                  ?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(l10n.lifeSectionLoadError),
            const SizedBox(height: 12),
            TextButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: Text(l10n.retryAction),
            ),
          ],
        ),
      ),
    );
  }
}
