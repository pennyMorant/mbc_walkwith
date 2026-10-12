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
import 'ministry_group_section.dart';
import 'serving_assignment_section.dart';

class LifeWeekTabView extends StatelessWidget {
  const LifeWeekTabView({
    super.key,
    required this.posts,
    required this.showUnreadBadges,
  });

  final List<LifePost> posts;
  final bool showUnreadBadges;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return LifeTabScrollView(
      storageKey: const PageStorageKey<String>('life-week-tab'),
      slivers: [
        const SliverToBoxAdapter(child: LifeNewcomerActionCard()),
        if (posts.isEmpty)
          SliverToBoxAdapter(
            child: LifeEmptyTabCard(body: l10n.lifeTabWeekEmpty),
          )
        else
          LifePostSliverList(
            posts: posts,
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
    required this.posts,
    required this.showUnreadBadges,
  });

  final List<LifePost> posts;
  final bool showUnreadBadges;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return LifeTabScrollView(
      storageKey: const PageStorageKey<String>('life-events-tab'),
      slivers: [
        if (posts.isEmpty)
          SliverToBoxAdapter(
            child: LifeEmptyTabCard(body: l10n.lifeTabEventsEmpty),
          )
        else
          LifePostSliverList(
            posts: posts,
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
    required this.posts,
    required this.groupsAsync,
    required this.memberSession,
    required this.showUnreadBadges,
  });

  final List<LifePost> posts;
  final AsyncValue<List<MinistryGroup>> groupsAsync;
  final MemberSession? memberSession;
  final bool showUnreadBadges;

  @override
  Widget build(BuildContext context) {
    return LifeTabScrollView(
      storageKey: const PageStorageKey<String>('life-groups-tab'),
      slivers: [
        if (posts.isNotEmpty)
          LifePostSliverList(
            posts: posts,
            compactBody: true,
            showRegistrationDetails: true,
            showUnreadBadge: showUnreadBadges,
          ),
        if (memberSession == null)
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
    required this.posts,
    required this.coursesAsync,
    required this.memberSession,
    required this.showUnreadBadges,
  });

  final List<LifePost> posts;
  final AsyncValue<List<CourseLearning>> coursesAsync;
  final MemberSession? memberSession;
  final bool showUnreadBadges;

  @override
  Widget build(BuildContext context) {
    return LifeTabScrollView(
      storageKey: const PageStorageKey<String>('life-courses-tab'),
      slivers: [
        if (posts.isNotEmpty)
          LifePostSliverList(
            posts: posts,
            compactBody: true,
            showRegistrationDetails: true,
            showUnreadBadge: showUnreadBadges,
          ),
        if (memberSession == null)
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
    required this.posts,
    required this.servingAsync,
    required this.memberSession,
    required this.showUnreadBadges,
  });

  final List<LifePost> posts;
  final AsyncValue<List<ServingAssignment>> servingAsync;
  final MemberSession? memberSession;
  final bool showUnreadBadges;

  @override
  Widget build(BuildContext context) {
    final session = memberSession;
    return LifeTabScrollView(
      storageKey: const PageStorageKey<String>('life-serving-tab'),
      slivers: [
        if (posts.isNotEmpty)
          LifePostSliverList(
            posts: posts,
            compactBody: true,
            showRegistrationDetails: true,
            showUnreadBadge: showUnreadBadges,
          ),
        if (session == null)
          SliverToBoxAdapter(child: const LifeMemberSignInCard())
        else
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
