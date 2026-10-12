import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app_routes.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/secondary_app_bar.dart';
import '../../life/data/group_repository.dart';
import '../../life/domain/ministry_group.dart';
import '../../life/presentation/widgets/life_error_view.dart';
import '../../life/presentation/widgets/ministry_group_card.dart';
import '../../member_auth/data/member_session_repository.dart';

class MyGroupsPage extends ConsumerWidget {
  const MyGroupsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final sessionAsync = ref.watch(memberSessionProvider);

    return Scaffold(
      appBar: SecondaryAppBar(
        title: l10n.groupMyGroupsTitle,
        onBack: () => _goBack(context),
      ),
      body: sessionAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) =>
            LifeErrorView(onRetry: () => ref.invalidate(memberSessionProvider)),
        data: (session) => session == null
            ? _GuestGroupsView(
                onSignIn: () =>
                    context.pushNamed(AppRouteNames.memberLoginEmail),
              )
            : _MyGroupsList(groupsAsync: ref.watch(myMinistryGroupsProvider)),
      ),
    );
  }

  void _goBack(BuildContext context) {
    if (context.canPop()) {
      context.pop();
      return;
    }
    context.goNamed(AppRouteNames.mine);
  }
}

class _MyGroupsList extends ConsumerWidget {
  const _MyGroupsList({required this.groupsAsync});

  final AsyncValue<List<MinistryGroup>> groupsAsync;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    return groupsAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stackTrace) => LifeErrorView(
        onRetry: () => ref.invalidate(myMinistryGroupsProvider),
      ),
      data: (groups) => RefreshIndicator(
        onRefresh: () => ref.refresh(myMinistryGroupsProvider.future),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
          children: [
            if (groups.isEmpty)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Text(l10n.groupMyGroupsEmptyBody),
                ),
              )
            else
              for (final group in groups) ...[
                MinistryGroupCard(
                  group: group,
                  isSubmitting: false,
                  onApply: null,
                  onOpen: () => context.pushNamed(
                    AppRouteNames.groupDetail,
                    pathParameters: {'groupId': group.id},
                  ),
                ),
                const SizedBox(height: 8),
              ],
          ],
        ),
      ),
    );
  }
}

class _GuestGroupsView extends StatelessWidget {
  const _GuestGroupsView({required this.onSignIn});

  final VoidCallback onSignIn;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l10n.groupSignInToViewMineBody),
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: onSignIn,
                  icon: const Icon(Icons.login),
                  label: Text(l10n.memberSignInAction),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
