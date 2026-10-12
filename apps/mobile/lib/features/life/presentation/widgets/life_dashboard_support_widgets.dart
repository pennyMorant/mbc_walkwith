import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/app_routes.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../member_auth/data/member_session_repository.dart';
import '../../domain/life_post.dart';
import '../life_post_detail_presentation.dart';
import 'care_request_sheet.dart';
import 'life_post_card.dart';
import 'newcomer_welcome_sheet.dart';
import 'prayer_request_sheet.dart';

class LifeTabScrollView extends StatelessWidget {
  const LifeTabScrollView({
    super.key,
    required this.storageKey,
    required this.slivers,
  });

  final PageStorageKey<String> storageKey;
  final List<Widget> slivers;

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      key: storageKey,
      physics: const AlwaysScrollableScrollPhysics(),
      slivers: [
        const SliverToBoxAdapter(child: SizedBox(height: 8)),
        ...slivers,
        const SliverToBoxAdapter(child: SizedBox(height: 24)),
      ],
    );
  }
}

class LifeNewcomerActionCard extends StatelessWidget {
  const LifeNewcomerActionCard({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
      child: Card(
        color: colorScheme.secondaryContainer,
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    Icons.waving_hand_outlined,
                    color: colorScheme.onSecondaryContainer,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      l10n.newcomerCardTitle,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: colorScheme.onSecondaryContainer,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                l10n.newcomerCardBody,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSecondaryContainer.withValues(
                    alpha: 0.78,
                  ),
                ),
              ),
              const SizedBox(height: 14),
              FilledButton.icon(
                onPressed: () => NewcomerWelcomeSheet.show(context),
                icon: const Icon(Icons.edit_note_outlined),
                label: Text(l10n.newcomerCardAction),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class LifePostSliverList extends ConsumerWidget {
  const LifePostSliverList({
    super.key,
    required this.posts,
    this.compactBody = false,
    this.showRegistrationDetails = false,
    this.showUnreadBadge = false,
  });

  final List<LifePost> posts;
  final bool compactBody;
  final bool showRegistrationDetails;
  final bool showUnreadBadge;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SliverList.separated(
      itemCount: posts.length,
      separatorBuilder: (context, index) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final post = posts[index];
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: LifePostCard(
            post: post,
            compactBody: compactBody,
            showRegistrationDetails: showRegistrationDetails,
            showUnreadBadge: showUnreadBadge,
            onTap: () => openLifePostDetail(context, ref, post),
          ),
        );
      },
    );
  }
}

class LifePrayerActionCard extends StatelessWidget {
  const LifePrayerActionCard({super.key, required this.memberSession});

  final MemberSession? memberSession;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              FilledButton.icon(
                onPressed: () => PrayerRequestSheet.show(context),
                icon: const Icon(Icons.add),
                label: Text(l10n.prayerSubmitAction),
              ),
              if (memberSession != null)
                OutlinedButton.icon(
                  onPressed: () => CareRequestSheet.show(context),
                  icon: const Icon(Icons.volunteer_activism_outlined),
                  label: Text(l10n.careSubmitAction),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class LifeMemberSignInCard extends StatelessWidget {
  const LifeMemberSignInCard({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return LifeEmptyTabCard(
      title: l10n.memberOptionalSignInTitle,
      body: l10n.lifeTabMemberSignInBody,
      action: TextButton.icon(
        onPressed: () => context.goNamed(AppRouteNames.mine),
        icon: const Icon(Icons.person_outline),
        label: Text(l10n.tabMine),
      ),
    );
  }
}

class LifeEmptyTabCard extends StatelessWidget {
  const LifeEmptyTabCard({
    super.key,
    required this.body,
    this.title,
    this.action,
  });

  final String? title;
  final String body;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (title != null) ...[
                Text(
                  title!,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 8),
              ],
              Text(
                body,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              if (action != null) ...[const SizedBox(height: 12), action!],
            ],
          ),
        ),
      ),
    );
  }
}
