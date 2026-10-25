import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/app_button.dart';
import '../../../../shared/widgets/app_chip.dart';
import '../../../study/data/reading_plan_repository.dart';
import '../../../study/domain/reading_plan.dart';

class ReadingPlanCatalogSheet extends ConsumerWidget {
  const ReadingPlanCatalogSheet({super.key, required this.onOpenPlan});

  final ValueChanged<ReadingPlan> onOpenPlan;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final plansAsync = ref.watch(publishedReadingPlansProvider);
    final assignmentsAsync = ref.watch(activeReadingPlanAssignmentsProvider);

    return SafeArea(
      top: false,
      child: FractionallySizedBox(
        heightFactor: 0.85,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const _SheetHandle(),
              Text(
                l10n.readingPlanCatalogTitle,
                style: Theme.of(context).textTheme.headlineSmall
                    ?.copyWith(fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 6),
              Text(
                l10n.readingPlanCatalogBody,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: plansAsync.when(
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                  error: (error, stackTrace) => _CatalogError(
                    onRetry: () =>
                        ref.invalidate(publishedReadingPlansProvider),
                  ),
                  data: (plans) => assignmentsAsync.when(
                    loading: () =>
                        const Center(child: CircularProgressIndicator()),
                    error: (error, stackTrace) => _CatalogError(
                      onRetry: () =>
                          ref.invalidate(activeReadingPlanAssignmentsProvider),
                    ),
                    data: (assignments) {
                      final assignedPlanIds = {
                        for (final assignment in assignments) assignment.planId,
                      };
                      final available = plans
                          .where((plan) => !assignedPlanIds.contains(plan.id))
                          .toList(growable: false);
                      if (available.isEmpty) {
                        return Center(
                          child: Text(
                            l10n.readingPlanCatalogEmpty,
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.bodyLarge
                                ?.copyWith(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .onSurfaceVariant,
                                ),
                          ),
                        );
                      }
                      return RefreshIndicator(
                        onRefresh: () async {
                          await Future.wait([
                            ref.refresh(publishedReadingPlansProvider.future),
                            ref.refresh(
                              activeReadingPlanAssignmentsProvider.future,
                            ),
                          ]);
                        },
                        child: ListView.separated(
                          physics: const AlwaysScrollableScrollPhysics(),
                          itemCount: available.length,
                          separatorBuilder: (_, _) =>
                              const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final plan = available[index];
                            return _CatalogPlanCard(
                              plan: plan,
                              onTap: () => onOpenPlan(plan),
                            );
                          },
                        ),
                      );
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CatalogPlanCard extends StatelessWidget {
  const _CatalogPlanCard({required this.plan, required this.onTap});

  final ReadingPlan plan;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                plan.title,
                style: Theme.of(context).textTheme.titleMedium
                    ?.copyWith(fontWeight: FontWeight.w700),
              ),
              if (plan.description.trim().isNotEmpty) ...[
                const SizedBox(height: 6),
                Text(
                  plan.description,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
              const SizedBox(height: 12),
              AppChip(
                icon: Icons.calendar_month_outlined,
                label: l10n.readingPlanDaysLabel(plan.durationDays),
                selected: true,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CatalogError extends StatelessWidget {
  const _CatalogError({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(l10n.readingPlanLoadErrorBody, textAlign: TextAlign.center),
          const SizedBox(height: 12),
          AppButton(
            label: l10n.retryAction,
            icon: Icons.refresh_rounded,
            onPressed: onRetry,
          ),
        ],
      ),
    );
  }
}

class _SheetHandle extends StatelessWidget {
  const _SheetHandle();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: 36,
        height: 4,
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.outlineVariant,
          borderRadius: BorderRadius.circular(2),
        ),
      ),
    );
  }
}
