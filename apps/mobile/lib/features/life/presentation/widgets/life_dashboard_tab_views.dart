import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/app_routes.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../member_auth/data/member_session_repository.dart';
import '../../domain/course_learning.dart';
import '../../domain/life_post.dart';
import '../../domain/ministry_group.dart';
import '../../domain/serving_assignment.dart';
import 'course_learning_section.dart';
import 'life_dashboard_support_widgets.dart';
import 'life_post_feed_sliver.dart';
import 'ministry_group_section.dart';
import 'serving_assignment_section.dart';

class LifeWeekTabView extends StatelessWidget {
  const LifeWeekTabView({
    super.key,
    required this.postsAsync,
    required this.onRetry,
    required this.showNewcomerAction,
    required this.showUnreadBadges,
  });

  final AsyncValue<List<LifePost>> postsAsync;
  final VoidCallback onRetry;
  final bool showNewcomerAction;
  final bool showUnreadBadges;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return LifeTabScrollView(
      storageKey: const PageStorageKey<String>('life-week-tab'),
      slivers: [
        if (showNewcomerAction)
          const SliverToBoxAdapter(child: LifeNewcomerActionCard()),
        LifePostFeedSliver(
          postsAsync: postsAsync,
          onRetry: onRetry,
          emptyBody: l10n.lifeTabWeekEmpty,
          showEmpty: true,
          compactBody: true,
          showRegistrationDetails: true,
          showUnreadBadge: showUnreadBadges,
        ),
      ],
    );
  }
}

class LifeEventsTabView extends StatelessWidget {
  const LifeEventsTabView({
    super.key,
    required this.postsAsync,
    required this.onRetry,
    required this.showUnreadBadges,
  });

  final AsyncValue<List<LifePost>> postsAsync;
  final VoidCallback onRetry;
  final bool showUnreadBadges;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return LifeTabScrollView(
      storageKey: const PageStorageKey<String>('life-events-tab'),
      slivers: [
        LifePostFeedSliver(
          postsAsync: postsAsync,
          onRetry: onRetry,
          emptyBody: l10n.lifeTabEventsEmpty,
          showEmpty: true,
          showRegistrationDetails: true,
          showUnreadBadge: showUnreadBadges,
        ),
      ],
    );
  }
}

class LifeGroupsTabView extends StatelessWidget {
  const LifeGroupsTabView({
    super.key,
    required this.postsAsync,
    required this.onRetryPosts,
    required this.groupsAsync,
    required this.memberSession,
    required this.showMemberSignInCard,
    required this.showUnreadBadges,
  });

  final AsyncValue<List<LifePost>> postsAsync;
  final VoidCallback onRetryPosts;
  final AsyncValue<List<MinistryGroup>> groupsAsync;
  final MemberSession? memberSession;
  final bool showMemberSignInCard;
  final bool showUnreadBadges;

  @override
  Widget build(BuildContext context) {
    return LifeTabScrollView(
      storageKey: const PageStorageKey<String>('life-groups-tab'),
      slivers: [
        LifePostFeedSliver(
          postsAsync: postsAsync,
          onRetry: onRetryPosts,
          emptyBody: '',
          showEmpty: false,
          compactBody: true,
          showRegistrationDetails: true,
          showUnreadBadge: showUnreadBadges,
        ),
        if (showMemberSignInCard)
          SliverToBoxAdapter(child: const LifeMemberSignInCard()),
        SliverToBoxAdapter(
          child: MinistryGroupSection(
            groupsAsync: groupsAsync,
            memberSession: memberSession,
          ),
        ),
      ],
    );
  }
}

class LifeCoursesTabView extends StatelessWidget {
  const LifeCoursesTabView({
    super.key,
    required this.postsAsync,
    required this.onRetryPosts,
    required this.coursesAsync,
    required this.memberSession,
    required this.showMemberSignInCard,
    required this.showUnreadBadges,
  });

  final AsyncValue<List<LifePost>> postsAsync;
  final VoidCallback onRetryPosts;
  final AsyncValue<List<CourseLearning>> coursesAsync;
  final MemberSession? memberSession;
  final bool showMemberSignInCard;
  final bool showUnreadBadges;

  @override
  Widget build(BuildContext context) {
    return LifeTabScrollView(
      storageKey: const PageStorageKey<String>('life-courses-tab'),
      slivers: [
        LifePostFeedSliver(
          postsAsync: postsAsync,
          onRetry: onRetryPosts,
          emptyBody: '',
          showEmpty: false,
          compactBody: true,
          showRegistrationDetails: true,
          showUnreadBadge: showUnreadBadges,
        ),
        if (showMemberSignInCard)
          SliverToBoxAdapter(child: const LifeMemberSignInCard()),
        SliverToBoxAdapter(
          child: CourseLearningSection(
            coursesAsync: coursesAsync,
            memberSession: memberSession,
          ),
        ),
      ],
    );
  }
}

class LifeServingTabView extends StatelessWidget {
  const LifeServingTabView({
    super.key,
    required this.postsAsync,
    required this.onRetryPosts,
    required this.servingAsync,
    required this.memberSession,
    required this.showMemberSignInCard,
    required this.showUnreadBadges,
  });

  final AsyncValue<List<LifePost>> postsAsync;
  final VoidCallback onRetryPosts;
  final AsyncValue<List<ServingAssignment>> servingAsync;
  final MemberSession? memberSession;
  final bool showMemberSignInCard;
  final bool showUnreadBadges;

  @override
  Widget build(BuildContext context) {
    final session = memberSession;
    return LifeTabScrollView(
      storageKey: const PageStorageKey<String>('life-serving-tab'),
      slivers: [
        LifePostFeedSliver(
          postsAsync: postsAsync,
          onRetry: onRetryPosts,
          emptyBody: '',
          showEmpty: false,
          compactBody: true,
          showRegistrationDetails: true,
          showUnreadBadge: showUnreadBadges,
        ),
        if (showMemberSignInCard)
          SliverToBoxAdapter(child: const LifeMemberSignInCard())
        else if (session != null)
          SliverToBoxAdapter(
            child: ServingAssignmentSection(
              assignmentsAsync: servingAsync,
              memberSession: session,
              onOpen: (assignment) => context.pushNamed(
                AppRouteNames.servingDetail,
                pathParameters: {'assignmentId': assignment.id},
              ),
            ),
          ),
      ],
    );
  }
}
