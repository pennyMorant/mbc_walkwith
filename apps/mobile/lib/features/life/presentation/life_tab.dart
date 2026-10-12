import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../app/app_routes.dart';
import '../../../core/settings/app_settings.dart';
import '../../../core/settings/app_settings_repository.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/utils/date_period.dart';
import '../../../shared/widgets/period_picker_button.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../../shell/widgets/shell_app_bar.dart';
import '../data/care_repository.dart';
import '../data/course_repository.dart';
import '../data/group_repository.dart';
import '../data/life_repository.dart';
import '../data/prayer_repository.dart';
import '../data/serving_repository.dart';
import '../domain/life_post.dart';
import '../domain/life_post_list_request.dart';
import 'widgets/life_dashboard_tab_bar.dart';
import 'widgets/life_dashboard_view.dart';
import 'widgets/life_error_view.dart';
import 'widgets/life_loading_view.dart';
import 'widgets/life_post_classification.dart';

class LifeTab extends ConsumerStatefulWidget {
  const LifeTab({super.key});

  @override
  ConsumerState<LifeTab> createState() => _LifeTabState();
}

class _LifeTabState extends ConsumerState<LifeTab> {
  DatePeriod _monthPeriod = DatePeriod.current(DatePeriodMode.month);
  LifeDashboardTab _selectedTab = LifeDashboardTab.week;

  LifePostListRequest get _monthRequest => _requestForPeriod(_monthPeriod);

  LifePostListRequest get _weekRequest {
    return _requestForPeriod(DatePeriod.current(DatePeriodMode.week));
  }

  LifePostListRequest get _activeRequest {
    return _selectedTab == LifeDashboardTab.week ? _weekRequest : _monthRequest;
  }

  LifePostListRequest _requestForPeriod(DatePeriod period) {
    return LifePostListRequest(
      limit: 80,
      from: period.queryFrom,
      to: period.queryTo,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final weekRequest = _weekRequest;
    final monthRequest = _monthRequest;
    final activeRequest = _activeRequest;
    final activePostsAsync = ref.watch(lifePostListProvider(activeRequest));
    final weekPosts = _postsOrEmpty(
      ref.watch(lifePostListProvider(weekRequest)),
    );
    final monthPosts = _postsOrEmpty(
      ref.watch(lifePostListProvider(monthRequest)),
    );
    final heroPost = ref
        .watch(lifePostListProvider(_latestHeroRequest))
        .maybeWhen(data: lifePostHero, orElse: () => null);
    final memberSession = ref
        .watch(memberSessionProvider)
        .maybeWhen(data: (session) => session, orElse: () => null);
    final settings = ref
        .watch(appSettingsProvider)
        .maybeWhen(
          data: (settings) => settings,
          orElse: () => AppSettings.defaults,
        );

    return Scaffold(
      appBar: ShellAppBar(
        title: l10n.lifeTitle,
        actions: [
          IconButton(
            tooltip: l10n.eventCheckInScanAction,
            onPressed: () => context.pushNamed(AppRouteNames.lifeCheckInScan),
            icon: const Icon(Icons.qr_code_scanner_outlined),
          ),
          Padding(
            padding: const EdgeInsetsDirectional.only(end: 8),
            child: PeriodPickerButton(
              period: _monthPeriod,
              onChanged: _changeMonth,
              labelBuilder: _lifeMonthLabel,
            ),
          ),
        ],
      ),
      body: activePostsAsync.when(
        loading: () => const LifeLoadingView(),
        error: (error, stackTrace) => LifeErrorView(
          onRetry: () => ref.invalidate(lifePostListProvider(activeRequest)),
        ),
        data: (_) => RefreshIndicator(
          triggerMode: RefreshIndicatorTriggerMode.onEdge,
          onRefresh: () => _refreshLife(
            ref,
            weekRequest: weekRequest,
            monthRequest: monthRequest,
          ),
          notificationPredicate: _lifeRefreshNotificationPredicate,
          child: LifeDashboardView(
            weekPosts: weekPosts,
            monthPosts: monthPosts,
            heroPost: heroPost,
            selectedTab: _selectedTab,
            onTabChanged: _changeTab,
            prayerEnabled: settings.prayerEnabled,
            publicPrayerRequestsAsync: ref.watch(publicPrayerRequestsProvider),
            memberPrayerRequestsAsync: ref.watch(memberPrayerRequestsProvider),
            memberSession: memberSession,
            groupsAsync: ref.watch(ministryGroupsProvider),
            coursesAsync: ref.watch(coursesProvider),
            servingAsync: ref.watch(servingAssignmentsProvider),
            careRequestsAsync: ref.watch(careRequestsProvider),
          ),
        ),
      ),
    );
  }

  void _changeMonth(DatePeriod period) {
    setState(() {
      _monthPeriod = period.mode == DatePeriodMode.month
          ? period
          : DatePeriod.fromDate(
              mode: DatePeriodMode.month,
              date: period.anchor,
            );
    });
  }

  void _changeTab(LifeDashboardTab tab) {
    if (tab == _selectedTab) {
      return;
    }
    setState(() {
      _selectedTab = tab;
    });
  }
}

Future<void> _refreshLife(
  WidgetRef ref, {
  required LifePostListRequest weekRequest,
  required LifePostListRequest monthRequest,
}) async {
  final refreshedWeekPosts = ref.refresh(
    lifePostListProvider(weekRequest).future,
  );
  final refreshedMonthPosts = ref.refresh(
    lifePostListProvider(monthRequest).future,
  );
  final refreshedHero = ref.refresh(
    lifePostListProvider(_latestHeroRequest).future,
  );
  await Future.wait([refreshedWeekPosts, refreshedMonthPosts, refreshedHero]);
  _refreshLifeSupportData(ref);
}

void _refreshLifeSupportData(WidgetRef ref) {
  ref.invalidate(publicPrayerRequestsProvider);
  ref.invalidate(memberPrayerRequestsProvider);
  ref.invalidate(ministryGroupsProvider);
  ref.invalidate(coursesProvider);
  ref.invalidate(servingAssignmentsProvider);
  ref.invalidate(careRequestsProvider);
}

bool _lifeRefreshNotificationPredicate(ScrollNotification notification) {
  final metrics = notification.metrics;
  if (metrics.axis != Axis.vertical) {
    return false;
  }
  return metrics.extentBefore <= _refreshTopEdgeTolerance ||
      metrics.pixels <= metrics.minScrollExtent + _refreshTopEdgeTolerance;
}

const _refreshTopEdgeTolerance = 24.0;
const _latestHeroRequest = LifePostListRequest(limit: 50);

List<LifePost> _postsOrEmpty(AsyncValue<List<LifePost>> postsAsync) {
  return postsAsync.maybeWhen(data: (posts) => posts, orElse: () => const []);
}

String _lifeMonthLabel(BuildContext context, DatePeriod period) {
  final locale = Localizations.localeOf(context).toLanguageTag();
  return DateFormat.MMM(locale).format(period.start);
}
