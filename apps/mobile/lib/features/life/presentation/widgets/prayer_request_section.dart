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

    if (publicPrayerRequestsAsync.isLoading ||
        memberPrayerRequestsAsync.isLoading) {
      return const Padding(
        padding: EdgeInsets.fromLTRB(20, 0, 20, 16),
        child: LinearProgressIndicator(),
      );
    }

    if (dedupedRequests.isEmpty &&
        (publicPrayerRequestsAsync.hasError ||
            memberPrayerRequestsAsync.hasError)) {
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

List<PrayerRequest> _dedupeRequests(List<PrayerRequest> requests) {
  final deduped = <String, PrayerRequest>{};
  for (final request in requests) {
    deduped.putIfAbsent(request.id, () => request);
  }
  return deduped.values.toList(growable: false);
}
