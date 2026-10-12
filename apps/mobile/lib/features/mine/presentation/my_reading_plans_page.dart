import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app_routes.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/secondary_app_bar.dart';
import '../../study/data/reading_plan_repository.dart';
import '../../study/domain/reading_plan.dart';
import 'widgets/reading_plan_assignment_card.dart';
import 'widgets/reading_plan_history_sheet.dart';

class MyReadingPlansPage extends ConsumerStatefulWidget {
  const MyReadingPlansPage({super.key});

  @override
  ConsumerState<MyReadingPlansPage> createState() => _MyReadingPlansPageState();
}

class _MyReadingPlansPageState extends ConsumerState<MyReadingPlansPage> {
  static const _historyPageSize = 20;

  _ReadingPlanView _view = _ReadingPlanView.current;
  String? _busyAssignmentId;
  String? _historyBaseKey;
  String? _historyNextCursor;
  List<ReadingPlanAssignment> _additionalHistory = const [];
  bool _isLoadingMoreHistory = false;
  bool _historyLoadMoreFailed = false;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final assignmentsAsync = _view == _ReadingPlanView.current
        ? ref.watch(activeReadingPlanAssignmentsProvider)
        : ref.watch(readingPlanHistoryProvider).whenData((page) {
            _syncHistoryBasePage(page);
            return [...page.items, ..._additionalHistory];
          });

    return Scaffold(
      appBar: SecondaryAppBar(
        title: l10n.mineReadingPlansTitle,
        onBack: () => _goBack(context),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 14),
            child: SizedBox(
              width: double.infinity,
              child: SegmentedButton<_ReadingPlanView>(
                showSelectedIcon: false,
                segments: [
                  ButtonSegment(
                    value: _ReadingPlanView.current,
                    label: Text(l10n.readingPlanCurrentTab),
                  ),
                  ButtonSegment(
                    value: _ReadingPlanView.history,
                    label: Text(l10n.readingPlanHistoryTab),
                  ),
                ],
                selected: {_view},
                onSelectionChanged: (selection) {
                  setState(() => _view = selection.first);
                },
              ),
            ),
          ),
          Expanded(
            child: assignmentsAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stackTrace) =>
                  _ErrorView(onRetry: _invalidateCurrentView),
              data: (assignments) => RefreshIndicator(
                onRefresh: _refreshCurrentView,
                child: ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
                  children: [
                    if (assignments.isEmpty)
                      _EmptyView(
                        message: _view == _ReadingPlanView.current
                            ? l10n.readingPlanCurrentEmpty
                            : l10n.readingPlanHistoryEmpty,
                      )
                    else
                      for (final assignment in assignments) ...[
                        IgnorePointer(
                          ignoring: _busyAssignmentId == assignment.id,
                          child: Opacity(
                            opacity: _busyAssignmentId == assignment.id
                                ? 0.6
                                : 1,
                            child: ReadingPlanAssignmentCard(
                              assignment: assignment,
                              onTap: () => assignment.isHistory
                                  ? _openHistory(assignment)
                                  : context.goNamed(AppRouteNames.study),
                              onPause: assignment.status == 'active'
                                  ? () => _updateStatus(assignment, 'paused')
                                  : null,
                              onResume: assignment.status == 'paused'
                                  ? () => _updateStatus(assignment, 'active')
                                  : null,
                              onAbandon: assignment.isHistory
                                  ? null
                                  : () => _confirmAbandon(assignment),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                      ],
                    if (_view == _ReadingPlanView.history &&
                        _historyNextCursor != null) ...[
                      const SizedBox(height: 4),
                      if (_isLoadingMoreHistory)
                        const Center(child: CircularProgressIndicator())
                      else
                        SizedBox(
                          width: double.infinity,
                          child: AppButton(
                            label: _historyLoadMoreFailed
                                ? l10n.retryAction
                                : l10n.readingPlanLoadMoreAction,
                            icon: _historyLoadMoreFailed
                                ? Icons.refresh_rounded
                                : Icons.expand_more_rounded,
                            onPressed: _loadMoreHistory,
                          ),
                        ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _updateStatus(
    ReadingPlanAssignment assignment,
    String status,
  ) async {
    setState(() => _busyAssignmentId = assignment.id);
    try {
      final identity = await readReadingPlanIdentityForAction(ref);
      await ref
          .read(readingPlanRepositoryProvider)
          .updateAssignmentStatus(
            assignmentId: assignment.id,
            status: status,
            identity: identity,
          );
      invalidateReadingPlanAssignmentProviders(ref);
    } catch (_) {
      _showActionError();
    } finally {
      if (mounted) setState(() => _busyAssignmentId = null);
    }
  }

  Future<void> _openHistory(ReadingPlanAssignment assignment) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: false,
      builder: (sheetContext) => ReadingPlanHistorySheet(
        assignmentId: assignment.id,
        onRestart: (history) {
          Navigator.of(sheetContext).pop();
          _restart(history);
        },
      ),
    );
  }

  Future<void> _restart(ReadingPlanAssignment assignment) async {
    final activeAssignments = ref
        .read(activeReadingPlanAssignmentsProvider)
        .value;
    if (activeAssignments?.any((item) => item.planId == assignment.planId) ??
        false) {
      setState(() => _view = _ReadingPlanView.current);
      return;
    }
    setState(() => _busyAssignmentId = assignment.id);
    try {
      final identity = await readReadingPlanIdentityForAction(ref);
      await ref
          .read(readingPlanRepositoryProvider)
          .selfAssign(assignment.planId, identity);
      invalidateReadingPlanAssignmentProviders(ref);
      if (!mounted) return;
      setState(() => _view = _ReadingPlanView.current);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            AppLocalizations.of(context)!.readingPlanRestartedMessage,
          ),
        ),
      );
    } catch (_) {
      _showActionError();
    } finally {
      if (mounted) setState(() => _busyAssignmentId = null);
    }
  }

  Future<void> _confirmAbandon(ReadingPlanAssignment assignment) async {
    final l10n = AppLocalizations.of(context)!;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(l10n.readingPlanAbandonAction),
        content: Text(l10n.readingPlanAbandonConfirmBody),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: Text(MaterialLocalizations.of(context).cancelButtonLabel),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: Text(l10n.readingPlanAbandonAction),
          ),
        ],
      ),
    );
    if (confirmed ?? false) {
      await _updateStatus(assignment, 'abandoned');
    }
  }

  Future<void> _refreshCurrentView() async {
    if (_view == _ReadingPlanView.current) {
      await ref
          .refresh(activeReadingPlanAssignmentsProvider.future)
          .then<void>((_) {});
      return;
    }
    setState(_resetHistoryPagination);
    await ref.refresh(readingPlanHistoryProvider.future).then<void>((_) {});
  }

  void _invalidateCurrentView() {
    if (_view == _ReadingPlanView.current) {
      ref.invalidate(activeReadingPlanAssignmentsProvider);
    } else {
      ref.invalidate(readingPlanHistoryProvider);
    }
  }

  void _showActionError() {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(AppLocalizations.of(context)!.readingPlanActionError),
      ),
    );
  }

  void _syncHistoryBasePage(ReadingPlanAssignmentPage page) {
    final key = [
      for (final item in page.items) '${item.id}:${item.updatedAt}',
      page.nextCursor ?? '',
    ].join('|');
    if (_historyBaseKey == key) return;
    _historyBaseKey = key;
    _historyNextCursor = page.nextCursor;
    _additionalHistory = const [];
    _historyLoadMoreFailed = false;
  }

  Future<void> _loadMoreHistory() async {
    final cursor = _historyNextCursor;
    if (cursor == null || _isLoadingMoreHistory) return;
    setState(() {
      _isLoadingMoreHistory = true;
      _historyLoadMoreFailed = false;
    });
    try {
      final identity = await readReadingPlanIdentityForAction(ref);
      final page = await ref
          .read(readingPlanRepositoryProvider)
          .listMyAssignments(
            identity,
            scope: 'history',
            limit: _historyPageSize,
            cursor: cursor,
          );
      if (!mounted) return;
      final existingIds = {
        ...?ref
            .read(readingPlanHistoryProvider)
            .value
            ?.items
            .map((item) => item.id),
        ..._additionalHistory.map((item) => item.id),
      };
      setState(() {
        _additionalHistory = [
          ..._additionalHistory,
          ...page.items.where((item) => existingIds.add(item.id)),
        ];
        _historyNextCursor = page.nextCursor;
      });
    } catch (_) {
      if (mounted) setState(() => _historyLoadMoreFailed = true);
    } finally {
      if (mounted) setState(() => _isLoadingMoreHistory = false);
    }
  }

  void _resetHistoryPagination() {
    _historyBaseKey = null;
    _historyNextCursor = null;
    _additionalHistory = const [];
    _historyLoadMoreFailed = false;
    _isLoadingMoreHistory = false;
  }

  void _goBack(BuildContext context) {
    if (context.canPop()) {
      context.pop();
    } else {
      context.goNamed(AppRouteNames.mine);
    }
  }
}

class _EmptyView extends StatelessWidget {
  const _EmptyView({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(padding: const EdgeInsets.all(18), child: Text(message)),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Center(
      child: FilledButton.icon(
        onPressed: onRetry,
        icon: const Icon(Icons.refresh),
        label: Text(l10n.retryAction),
      ),
    );
  }
}

enum _ReadingPlanView { current, history }
