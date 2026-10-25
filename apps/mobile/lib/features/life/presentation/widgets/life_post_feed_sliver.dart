import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../domain/life_post.dart';
import 'life_dashboard_support_widgets.dart';

class LifePostFeedSliver extends StatelessWidget {
  const LifePostFeedSliver({
    super.key,
    required this.postsAsync,
    required this.onRetry,
    required this.emptyBody,
    required this.showEmpty,
    this.compactBody = false,
    this.showRegistrationDetails = false,
    this.showUnreadBadge = false,
  });

  final AsyncValue<List<LifePost>> postsAsync;
  final VoidCallback onRetry;
  final String emptyBody;
  final bool showEmpty;
  final bool compactBody;
  final bool showRegistrationDetails;
  final bool showUnreadBadge;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return postsAsync.when(
      loading: () => const SliverToBoxAdapter(
        child: Padding(
          padding: EdgeInsets.fromLTRB(20, 8, 20, 16),
          child: LinearProgressIndicator(),
        ),
      ),
      error: (error, stackTrace) => SliverToBoxAdapter(
        child: LifeEmptyTabCard(
          body: l10n.lifeSectionLoadError,
          action: TextButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh),
            label: Text(l10n.retryAction),
          ),
        ),
      ),
      data: (posts) {
        if (posts.isEmpty) {
          return showEmpty
              ? SliverToBoxAdapter(child: LifeEmptyTabCard(body: emptyBody))
              : const SliverToBoxAdapter(child: SizedBox.shrink());
        }
        return LifePostSliverList(
          posts: posts,
          compactBody: compactBody,
          showRegistrationDetails: showRegistrationDetails,
          showUnreadBadge: showUnreadBadge,
        );
      },
    );
  }
}
