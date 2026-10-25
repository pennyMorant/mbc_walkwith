import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../member_auth/data/member_session_repository.dart';
import '../../data/prayer_repository.dart';
import '../../domain/prayer_request.dart';
import 'life_dashboard_support_widgets.dart';
import 'prayer_request_card.dart';

class PrayerRequestSection extends ConsumerWidget {
  const PrayerRequestSection({
    super.key,
    required this.publicPrayerRequestsAsync,
    required this.memberPrayerRequestsAsync,
    required this.memberSession,
  });

  final AsyncValue<List<PrayerRequest>> publicPrayerRequestsAsync;
  final AsyncValue<List<PrayerRequest>> memberPrayerRequestsAsync;
  final MemberSession? memberSession;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final publicRequests = publicPrayerRequestsAsync.maybeWhen(
      data: (requests) => requests,
      orElse: () => const <PrayerRequest>[],
    );
    final memberRequests = memberPrayerRequestsAsync.maybeWhen(
      data: (requests) => requests,
      orElse: () => const <PrayerRequest>[],
    );
    final requests = <PrayerRequest>[
      if (memberSession != null) ...memberRequests,
      ...publicRequests,
    ];
    final dedupedRequests = _dedupeRequests(requests);
    final isLoading =
        publicPrayerRequestsAsync.isLoading ||
        (memberSession != null && memberPrayerRequestsAsync.isLoading);
    final hasPartialError =
        publicPrayerRequestsAsync.hasError ||
        (memberSession != null && memberPrayerRequestsAsync.hasError);

    if (isLoading && dedupedRequests.isEmpty) {
      return const Padding(
        padding: EdgeInsets.fromLTRB(20, 0, 20, 16),
        child: LinearProgressIndicator(),
      );
    }

    if (dedupedRequests.isEmpty && hasPartialError) {
      return LifeEmptyTabCard(
        title: l10n.prayerTitle,
        body: l10n.lifeSectionLoadError,
        action: TextButton.icon(
          onPressed: () {
            ref.invalidate(publicPrayerRequestsProvider);
            ref.invalidate(memberPrayerRequestsProvider);
          },
          icon: const Icon(Icons.refresh),
          label: Text(l10n.retryAction),
        ),
      );
    }

    if (dedupedRequests.isEmpty) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Text(l10n.prayerEmptyBody),
          ),
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
      child: Column(
        children: [
          if (isLoading) ...[
            const LinearProgressIndicator(),
            const SizedBox(height: 12),
          ],
          if (hasPartialError) ...[
            _PrayerPartialErrorNotice(
              onRetry: () {
                ref.invalidate(publicPrayerRequestsProvider);
                ref.invalidate(memberPrayerRequestsProvider);
              },
            ),
            const SizedBox(height: 12),
          ],
          for (final request in dedupedRequests) ...[
            PrayerRequestCard(
              request: request,
              isMine:
                  memberSession != null &&
                  memberRequests.any((item) => item.id == request.id),
            ),
            const SizedBox(height: 8),
          ],
        ],
      ),
    );
  }
}

class _PrayerPartialErrorNotice extends StatelessWidget {
  const _PrayerPartialErrorNotice({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    return Material(
      color: colorScheme.errorContainer,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 10, 8, 10),
        child: Row(
          children: [
            Expanded(
              child: Text(
                l10n.lifeSectionLoadError,
                style: TextStyle(color: colorScheme.onErrorContainer),
              ),
            ),
            IconButton(
              onPressed: onRetry,
              tooltip: l10n.retryAction,
              color: colorScheme.onErrorContainer,
              icon: const Icon(Icons.refresh),
            ),
          ],
        ),
      ),
    );
  }
}

List<PrayerRequest> _dedupeRequests(List<PrayerRequest> requests) {
  final deduped = <String, PrayerRequest>{};
  for (final request in requests) {
    deduped.putIfAbsent(request.id, () => request);
  }
  return deduped.values.toList(growable: false);
}
