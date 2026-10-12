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
import 'life_sunday_hero_card.dart';

class LifeDashboardView extends StatefulWidget {
  const LifeDashboardView({
    super.key,
    required this.weekPosts,
    required this.monthPosts,
    required this.heroPost,
    required this.selectedTab,
    required this.onTabChanged,
    required this.prayerEnabled,
    required this.publicPrayerRequestsAsync,
    required this.memberPrayerRequestsAsync,
    required this.memberSession,
    required this.groupsAsync,
    required this.coursesAsync,
    required this.servingAsync,
    required this.careRequestsAsync,
  });

  final List<LifePost> weekPosts;
  final List<LifePost> monthPosts;
  final LifePost? heroPost;
  final LifeDashboardTab selectedTab;
  final ValueChanged<LifeDashboardTab> onTabChanged;
  final bool prayerEnabled;
  final AsyncValue<List<PrayerRequest>> publicPrayerRequestsAsync;
  final AsyncValue<List<PrayerRequest>> memberPrayerRequestsAsync;
  final MemberSession? memberSession;
  final AsyncValue<List<MinistryGroup>> groupsAsync;
  final AsyncValue<List<CourseLearning>> coursesAsync;
  final AsyncValue<List<ServingAssignment>> servingAsync;
  final AsyncValue<List<CareRequest>> careRequestsAsync;

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
    final heroPost = widget.heroPost;
    final weekPosts = [...widget.weekPosts]..sort(compareLifePostTimeline);
    final monthPosts = [...widget.monthPosts]..sort(compareLifePostTimeline);
    final weekCardPosts = _withoutHero(weekPosts, heroPost);
    final groupPosts = monthPosts.where(lifePostIsGroupLike).toList()
      ..sort(compareLifePostTimeline);
    final coursePosts = monthPosts.where(lifePostIsCourseLike).toList()
      ..sort(compareLifePostTimeline);
    final servingPosts = monthPosts.where(lifePostIsServingLike).toList()
      ..sort(compareLifePostTimeline);
    final prayerPosts = monthPosts.where(lifePostIsPrayerLike).toList()
      ..sort(compareLifePostTimeline);
    final eventPosts =
        monthPosts
            .where(
              (post) =>
                  lifePostIsEventLike(post) &&
                  !lifePostIsGroupLike(post) &&
                  !lifePostIsCourseLike(post) &&
                  !lifePostIsServingLike(post) &&
                  !lifePostIsPrayerLike(post),
            )
            .toList()
          ..sort(compareLifePostTimeline);
    final eventCardPosts = _withoutHero(eventPosts, heroPost);
    final groupCardPosts = _withoutHero(groupPosts, heroPost);
    final courseCardPosts = _withoutHero(coursePosts, heroPost);
    final servingCardPosts = _withoutHero(servingPosts, heroPost);
    final prayerCardPosts = _withoutHero(prayerPosts, heroPost);
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
            child: LifeSundayHeroCard(
              post: heroPost,
              showUnreadBadge: showUnreadBadges,
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
            posts: weekCardPosts,
            showUnreadBadges: showUnreadBadges,
          ),
          LifeEventsTabView(
            posts: eventCardPosts,
            showUnreadBadges: showUnreadBadges,
          ),
          LifeGroupsTabView(
            posts: groupCardPosts,
            groupsAsync: widget.groupsAsync,
            memberSession: memberSession,
            showUnreadBadges: showUnreadBadges,
          ),
          LifeCoursesTabView(
            posts: courseCardPosts,
            coursesAsync: widget.coursesAsync,
            memberSession: memberSession,
            showUnreadBadges: showUnreadBadges,
          ),
          LifeServingTabView(
            posts: servingCardPosts,
            servingAsync: widget.servingAsync,
            memberSession: memberSession,
            showUnreadBadges: showUnreadBadges,
          ),
          LifePrayerTabView(
            posts: prayerCardPosts,
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

List<LifePost> _withoutHero(List<LifePost> posts, LifePost? heroPost) {
  if (heroPost == null) {
    return posts;
  }
  return posts.where((post) => post.id != heroPost.id).toList();
}
