import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app_routes.dart';
import '../../../core/api/api_error.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/secondary_app_bar.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../data/group_repository.dart';
import '../domain/ministry_group.dart';
import 'widgets/life_error_view.dart';
import 'widgets/ministry_group_card.dart';

class GroupDetailPage extends ConsumerStatefulWidget {
  const GroupDetailPage({super.key, required this.groupId});

  final String groupId;

  @override
  ConsumerState<GroupDetailPage> createState() => _GroupDetailPageState();
}

class _GroupDetailPageState extends ConsumerState<GroupDetailPage> {
  bool _isSubmitting = false;

  @override
  Widget build(BuildContext context) {
    final groupAsync = ref.watch(ministryGroupByIdProvider(widget.groupId));

    return Scaffold(
      appBar: SecondaryAppBar(title: '', onBack: () => _goBack(context)),
      body: groupAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => LifeErrorView(
          onRetry: () =>
              ref.invalidate(ministryGroupByIdProvider(widget.groupId)),
        ),
        data: (group) => RefreshIndicator(
          onRefresh: () =>
              ref.refresh(ministryGroupByIdProvider(widget.groupId).future),
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
            children: [
              MinistryGroupCard(
                group: group,
                isSubmitting: _isSubmitting,
                descriptionMaxLines: null,
                onApply: group.canApply ? () => _apply(group) : null,
                onWithdraw: group.hasSubmittedApplication
                    ? () => _withdraw(group)
                    : null,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _apply(MinistryGroup group) async {
    final session = await ref.read(memberSessionProvider.future);
    if (!mounted) {
      return;
    }
    if (session == null) {
      await context.pushNamed(AppRouteNames.memberLoginEmail);
      return;
    }
    await _submit(
      group,
      () => ref.read(groupRepositoryProvider).applyToGroup(group.id, session),
      AppLocalizations.of(context)!.groupApplicationSubmitSuccess,
    );
  }

  Future<void> _withdraw(MinistryGroup group) async {
    final session = await ref.read(memberSessionProvider.future);
    if (!mounted || session == null) {
      return;
    }
    await _submit(
      group,
      () =>
          ref.read(groupRepositoryProvider).withdrawApplication(group, session),
      AppLocalizations.of(context)!.groupApplicationWithdrawSuccess,
    );
  }

  Future<void> _submit(
    MinistryGroup group,
    Future<void> Function() action,
    String successMessage,
  ) async {
    if (_isSubmitting) {
      return;
    }
    setState(() => _isSubmitting = true);
    try {
      await action();
      ref.invalidate(ministryGroupByIdProvider(group.id));
      ref.invalidate(ministryGroupsProvider);
      ref.invalidate(myMinistryGroupsProvider);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(successMessage)));
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(formatApiErrorMessage(error))));
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  void _goBack(BuildContext context) {
    if (context.canPop()) {
      context.pop();
      return;
    }
    context.goNamed(AppRouteNames.life);
  }
}
