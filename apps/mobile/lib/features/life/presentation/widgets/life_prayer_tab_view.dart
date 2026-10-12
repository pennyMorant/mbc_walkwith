import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/section_header.dart';
import '../../../member_auth/data/member_session_repository.dart';
import '../../domain/care_request.dart';
import '../../domain/life_post.dart';
import '../../domain/prayer_request.dart';
import 'care_request_section.dart';
import 'life_dashboard_support_widgets.dart';
import 'prayer_request_section.dart';

class LifePrayerTabView extends StatelessWidget {
  const LifePrayerTabView({
    super.key,
    required this.posts,
    required this.prayerEnabled,
    required this.publicPrayerRequestsAsync,
    required this.memberPrayerRequestsAsync,
    required this.memberSession,
    required this.careRequestsAsync,
    required this.showUnreadBadges,
  });

  final List<LifePost> posts;
  final bool prayerEnabled;
  final AsyncValue<List<PrayerRequest>> publicPrayerRequestsAsync;
  final AsyncValue<List<PrayerRequest>> memberPrayerRequestsAsync;
  final MemberSession? memberSession;
  final AsyncValue<List<CareRequest>> careRequestsAsync;
  final bool showUnreadBadges;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return LifeTabScrollView(
      storageKey: const PageStorageKey<String>('life-prayer-tab'),
      slivers: [
        if (!prayerEnabled)
          SliverToBoxAdapter(
            child: LifeEmptyTabCard(body: l10n.lifeTabPrayerDisabled),
          )
        else ...[
          if (posts.isNotEmpty)
            LifePostSliverList(
              posts: posts,
              compactBody: true,
              showUnreadBadge: showUnreadBadges,
            ),
          SliverToBoxAdapter(
            child: LifePrayerActionCard(memberSession: memberSession),
          ),
          SliverToBoxAdapter(child: SectionHeader(title: l10n.prayerTitle)),
          SliverToBoxAdapter(
            child: PrayerRequestSection(
              publicPrayerRequestsAsync: publicPrayerRequestsAsync,
              memberPrayerRequestsAsync: memberPrayerRequestsAsync,
              memberSession: memberSession,
            ),
          ),
        ],
        if (memberSession != null) ...[
          SliverToBoxAdapter(child: SectionHeader(title: l10n.careTitle)),
          SliverToBoxAdapter(
            child: CareRequestSection(requestsAsync: careRequestsAsync),
          ),
        ],
      ],
    );
  }
}
