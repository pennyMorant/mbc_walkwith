import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/secondary_app_bar.dart';
import '../data/life_repository.dart';
import '../domain/life_post.dart';
import '../domain/life_post_list_request.dart';
import 'life_post_detail_presentation.dart';
import 'widgets/life_error_view.dart';
import 'widgets/life_loading_view.dart';
import 'widgets/life_post_card.dart';

const _myRegistrationRequest = LifePostListRequest(limit: 100);

class MyEventRegistrationsPage extends ConsumerWidget {
  const MyEventRegistrationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final postsAsync = ref.watch(lifePostListProvider(_myRegistrationRequest));
    return Scaffold(
      appBar: SecondaryAppBar(title: l10n.myEventRegistrationsTitle),
      body: postsAsync.when(
        loading: () => const LifeLoadingView(),
        error: (error, stackTrace) => LifeErrorView(
          onRetry: () =>
              ref.invalidate(lifePostListProvider(_myRegistrationRequest)),
        ),
        data: (posts) {
          final registrations = posts.where(_isRegistered).toList()
            ..sort(_registrationOrder);
          if (registrations.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  l10n.myEventRegistrationsEmpty,
                  textAlign: TextAlign.center,
                ),
              ),
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
            itemCount: registrations.length,
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final post = registrations[index];
              return LifePostCard(
                post: post,
                compactBody: true,
                showRegistrationDetails: true,
                onTap: () => openLifePostDetail(context, ref, post),
              );
            },
          );
        },
      ),
    );
  }
}

bool _isRegistered(LifePost post) =>
    post.registrationSummary?.isRegistered ?? false;

int _registrationOrder(LifePost left, LifePost right) {
  final leftTime = left.startsAt ?? left.updatedAt;
  final rightTime = right.startsAt ?? right.updatedAt;
  if (leftTime == null && rightTime == null) return 0;
  if (leftTime == null) return 1;
  if (rightTime == null) return -1;
  return rightTime.compareTo(leftTime);
}
