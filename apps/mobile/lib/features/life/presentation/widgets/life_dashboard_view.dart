import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../member_auth/data/member_session_repository.dart';
import '../../domain/care_request.dart';
import '../../domain/course_learning.dart';
import '../../domain/life_post.dart';
import '../../domain/ministry_group.dart';
import '../../domain/prayer_request.dart';
import '../../domain/serving_assignment.dart';
import 'life_dashboard_tab_bar.dart';
import 'life_dashboard_tab_views.dart';
import 'life_post_classification.dart';
import 'life_post_read_state.dart';
import 'life_prayer_tab_view.dart';
import 'life_sunday_hero_state_view.dart';

class LifeDashboardView extends StatefulWidget {
  const LifeDashboardView({
    super.key,
    required this.weekPostsAsync,
    required this.monthPostsAsync,
    required this.heroPostAsync,
    required this.selectedTab,
    required this.onTabChanged,
    required this.onRetryWeekPosts,
    required this.onRetryMonthPosts,
    required this.onRetryHero,
    required this.prayerEnabled,
    required this.publicPrayerRequestsAsync,
    required this.memberPrayerRequestsAsync,
    required this.memberSession,
    required this.groupsAsync,
    required this.coursesAsync,
    required this.servingAsync,
    required this.careRequestsAsync,
    required this.memberSessionResolved,
  });

  final AsyncValue<List<LifePost>> weekPostsAsync;
  final AsyncValue<List<LifePost>> monthPostsAsync;
  final AsyncValue<LifePost?> heroPostAsync;
  final LifeDashboardTab selectedTab;
  final ValueChanged<LifeDashboardTab> onTabChanged;
  final VoidCallback onRetryWeekPosts;
  final VoidCallback onRetryMonthPosts;
  final VoidCallback onRetryHero;
  final bool prayerEnabled;
  final AsyncValue<List<PrayerRequest>> publicPrayerRequestsAsync;
  final AsyncValue<List<PrayerRequest>> memberPrayerRequestsAsync;
  final MemberSession? memberSession;
  final AsyncValue<List<MinistryGroup>> groupsAsync;
  final AsyncValue<List<CourseLearning>> coursesAsync;
  final AsyncValue<List<ServingAssignment>> servingAsync;
  final AsyncValue<List<CareRequest>> careRequestsAsync;
  final bool memberSessionResolved;

  @override
  State<LifeDashboardView> createState() => _LifeDashboardViewState();
}

class _LifeDashboardViewState extends State<LifeDashboardView>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: LifeDashboardTab.values.length,
      initialIndex: widget.selectedTab.index,
      vsync: this,
    )..addListener(_handleTabChange);
  }

  @override
  void didUpdateWidget(covariant LifeDashboardView oldWidget) {
    super.didUpdateWidget(oldWidget);
    final selectedIndex = widget.selectedTab.index;
    if (_tabController.index != selectedIndex) {
      _tabController.animateTo(selectedIndex);
    }
  }

  @override
  void dispose() {
    _tabController
      ..removeListener(_handleTabChange)
      ..dispose();
    super.dispose();
  }

  void _handleTabChange() {
    final tab = LifeDashboardTab.values[_tabController.index];
    if (tab != widget.selectedTab) {
      widget.onTabChanged(tab);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final heroPost = widget.heroPostAsync.value;
    final weekPosts = widget.weekPostsAsync.value ?? const <LifePost>[];
    final weekCardPostsAsync = widget.weekPostsAsync.whenData(
      (posts) => _withoutHero(posts, heroPost),
    );
    final eventPostsAsync = _categoryPosts(
      widget.monthPostsAsync,
      heroPost: heroPost,
      matches: (post) =>
          lifePostIsEventLike(post) &&
          !lifePostIsGroupLike(post) &&
          !lifePostIsCourseLike(post) &&
          !lifePostIsServingLike(post) &&
          !lifePostIsPrayerLike(post),
    );
    final groupPostsAsync = _categoryPosts(
      widget.monthPostsAsync,
      heroPost: heroPost,
      matches: lifePostIsGroupLike,
    );
    final coursePostsAsync = _categoryPosts(
      widget.monthPostsAsync,
      heroPost: heroPost,
      matches: lifePostIsCourseLike,
    );
    final servingPostsAsync = _categoryPosts(
      widget.monthPostsAsync,
      heroPost: heroPost,
      matches: lifePostIsServingLike,
    );
    final prayerPostsAsync = _categoryPosts(
      widget.monthPostsAsync,
      heroPost: heroPost,
      matches: lifePostIsPrayerLike,
    );
    final eventPosts = eventPostsAsync.value ?? const <LifePost>[];
    final groupPosts = groupPostsAsync.value ?? const <LifePost>[];
    final coursePosts = coursePostsAsync.value ?? const <LifePost>[];
    final servingPosts = servingPostsAsync.value ?? const <LifePost>[];
    final prayerPosts = prayerPostsAsync.value ?? const <LifePost>[];
    final memberSession = widget.memberSession;
    final showUnreadBadges = memberSession != null;
    final unreadCounts = <LifeDashboardTab, int>{
      LifeDashboardTab.week: lifePostUnreadCount(
        weekPosts,
        enabled: showUnreadBadges,
      ),
      LifeDashboardTab.events: lifePostUnreadCount(
        eventPosts,
        enabled: showUnreadBadges,
      ),
      LifeDashboardTab.groups: lifePostUnreadCount(
        groupPosts,
        enabled: showUnreadBadges,
      ),
      LifeDashboardTab.courses: lifePostUnreadCount(
        coursePosts,
        enabled: showUnreadBadges,
      ),
      LifeDashboardTab.serving: lifePostUnreadCount(
        servingPosts,
        enabled: showUnreadBadges,
      ),
      LifeDashboardTab.prayer: lifePostUnreadCount(
        prayerPosts,
        enabled: showUnreadBadges,
      ),
    };

    return NestedScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      headerSliverBuilder: (context, innerBoxIsScrolled) => [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
            child: LifeSundayHeroStateView(
              postAsync: widget.heroPostAsync,
              showUnreadBadge: showUnreadBadges,
              onRetry: widget.onRetryHero,
            ),
          ),
        ),
        SliverPersistentHeader(
          pinned: true,
          delegate: LifeDashboardTabBarHeader(
            tabBar: TabBar(
              controller: _tabController,
              isScrollable: true,
              tabAlignment: TabAlignment.start,
              padding: EdgeInsets.zero,
              labelStyle: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
              unselectedLabelStyle: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
              tabs: [
                for (final tab in LifeDashboardTab.values)
                  Tab(
                    child: LifeDashboardTabLabel(
                      label: tab.label(l10n),
                      unreadCount: unreadCounts[tab] ?? 0,
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
      body: TabBarView(
        controller: _tabController,
        children: [
          LifeWeekTabView(
            postsAsync: weekCardPostsAsync,
            onRetry: widget.onRetryWeekPosts,
            showNewcomerAction:
                widget.memberSessionResolved && memberSession == null,
            showUnreadBadges: showUnreadBadges,
          ),
          LifeEventsTabView(
            postsAsync: eventPostsAsync,
            onRetry: widget.onRetryMonthPosts,
            showUnreadBadges: showUnreadBadges,
          ),
          LifeGroupsTabView(
            postsAsync: groupPostsAsync,
            onRetryPosts: widget.onRetryMonthPosts,
            groupsAsync: widget.groupsAsync,
            memberSession: memberSession,
            showMemberSignInCard:
                widget.memberSessionResolved && memberSession == null,
            showUnreadBadges: showUnreadBadges,
          ),
          LifeCoursesTabView(
            postsAsync: coursePostsAsync,
            onRetryPosts: widget.onRetryMonthPosts,
            coursesAsync: widget.coursesAsync,
            memberSession: memberSession,
            showMemberSignInCard:
                widget.memberSessionResolved && memberSession == null,
            showUnreadBadges: showUnreadBadges,
          ),
          LifeServingTabView(
            postsAsync: servingPostsAsync,
            onRetryPosts: widget.onRetryMonthPosts,
            servingAsync: widget.servingAsync,
            memberSession: memberSession,
            showMemberSignInCard:
                widget.memberSessionResolved && memberSession == null,
            showUnreadBadges: showUnreadBadges,
          ),
          LifePrayerTabView(
            postsAsync: prayerPostsAsync,
            onRetryPosts: widget.onRetryMonthPosts,
            prayerEnabled: widget.prayerEnabled,
            publicPrayerRequestsAsync: widget.publicPrayerRequestsAsync,
            memberPrayerRequestsAsync: widget.memberPrayerRequestsAsync,
            memberSession: widget.memberSession,
            careRequestsAsync: widget.careRequestsAsync,
            showUnreadBadges: showUnreadBadges,
          ),
        ],
      ),
    );
  }
}

AsyncValue<List<LifePost>> _categoryPosts(
  AsyncValue<List<LifePost>> source, {
  required LifePost? heroPost,
  required bool Function(LifePost post) matches,
}) {
  return source.whenData(
    (posts) => _withoutHero(posts.where(matches).toList(), heroPost),
  );
}

List<LifePost> _withoutHero(List<LifePost> posts, LifePost? heroPost) {
  if (heroPost == null) {
    return posts;
  }
  return posts.where((post) => post.id != heroPost.id).toList();
}
