import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/app_routes.dart';
import '../../../../core/api/api_error.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../member_auth/data/member_session_repository.dart';
import '../../data/group_repository.dart';
import '../../domain/ministry_group.dart';
import 'life_dashboard_support_widgets.dart';
import 'ministry_group_card.dart';

class MinistryGroupSection extends ConsumerStatefulWidget {
  const MinistryGroupSection({
    super.key,
    required this.groupsAsync,
    required this.memberSession,
  });

  final AsyncValue<List<MinistryGroup>> groupsAsync;
  final MemberSession? memberSession;

  @override
  ConsumerState<MinistryGroupSection> createState() =>
      _MinistryGroupSectionState();
}

class _MinistryGroupSectionState extends ConsumerState<MinistryGroupSection> {
  String? _submittingGroupId;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    if (widget.groupsAsync.isLoading) {
      return const Padding(
        padding: EdgeInsets.fromLTRB(20, 0, 20, 16),
        child: LinearProgressIndicator(),
      );
    }
    if (widget.groupsAsync.hasError) {
      return LifeEmptyTabCard(
        title: l10n.groupsTitle,
        body: l10n.lifeSectionLoadError,
        action: TextButton.icon(
          onPressed: () => ref.invalidate(ministryGroupsProvider),
          icon: const Icon(Icons.refresh),
          label: Text(l10n.retryAction),
        ),
      );
    }

    final groups = widget.groupsAsync.value ?? const <MinistryGroup>[];
    if (groups.isEmpty) {
      return LifeEmptyTabCard(
        title: l10n.groupsTitle,
        body: l10n.groupsEmptyBody,
      );
    }
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
      child: Column(
        children: [
          for (final group in groups) ...[
            MinistryGroupCard(
              group: group,
              isSubmitting: _submittingGroupId == group.id,
              onApply: widget.memberSession == null
                  ? null
                  : () => _apply(group),
              onWithdraw:
                  widget.memberSession == null || !group.hasSubmittedApplication
                  ? null
                  : () => _withdraw(group),
              onOpen: () => context.pushNamed(
                AppRouteNames.groupDetail,
                pathParameters: {'groupId': group.id},
              ),
            ),
            const SizedBox(height: 8),
          ],
        ],
      ),
    );
  }

  Future<void> _apply(MinistryGroup group) async {
    final memberSession = widget.memberSession;
    if (_submittingGroupId != null || memberSession == null) {
      return;
    }
    setState(() => _submittingGroupId = group.id);
    try {
      await ref
          .read(groupRepositoryProvider)
          .applyToGroup(group.id, memberSession);
      ref.invalidate(ministryGroupsProvider);
      ref.invalidate(ministryGroupByIdProvider(group.id));
      ref.invalidate(myMinistryGroupsProvider);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            AppLocalizations.of(context)!.groupApplicationSubmitSuccess,
          ),
        ),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(formatApiErrorMessage(error))));
    } finally {
      if (mounted) {
        setState(() => _submittingGroupId = null);
      }
    }
  }

  Future<void> _withdraw(MinistryGroup group) async {
    final memberSession = widget.memberSession;
    if (_submittingGroupId != null || memberSession == null) {
      return;
    }
    setState(() => _submittingGroupId = group.id);
    try {
      await ref
          .read(groupRepositoryProvider)
          .withdrawApplication(group, memberSession);
      ref.invalidate(ministryGroupsProvider);
      ref.invalidate(ministryGroupByIdProvider(group.id));
      ref.invalidate(myMinistryGroupsProvider);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            AppLocalizations.of(context)!.groupApplicationWithdrawSuccess,
          ),
        ),
      );
    } catch (error) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(formatApiErrorMessage(error))));
    } finally {
      if (mounted) {
        setState(() => _submittingGroupId = null);
      }
    }
  }
}
