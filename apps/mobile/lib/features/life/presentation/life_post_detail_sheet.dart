import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/life_repository.dart';
import 'life_post_detail_page.dart';
import 'widgets/life_error_view.dart';
import 'widgets/life_loading_view.dart';

class LifePostDetailSheet extends ConsumerWidget {
  const LifePostDetailSheet({super.key, required this.postId});

  static Future<void> show(BuildContext context, {required String postId}) {
    final mediaQuery = MediaQuery.of(context);
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: true,
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: mediaQuery.viewInsets.bottom),
        child: LifePostDetailSheet(postId: postId),
      ),
    );
  }

  final String postId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.5,
      minChildSize: 0.5,
      maxChildSize: 0.85,
      builder: (context, scrollController) {
        final postAsync = ref.watch(lifePostByIdProvider(postId));
        return postAsync.when(
          loading: () => const _SheetStateContainer(child: LifeLoadingView()),
          error: (error, stackTrace) => _SheetStateContainer(
            child: LifeErrorView(
              onRetry: () => ref.invalidate(lifePostByIdProvider(postId)),
            ),
          ),
          data: (post) {
            if (post == null) {
              return _SheetStateContainer(
                child: LifeErrorView(
                  onRetry: () => ref.invalidate(lifePostByIdProvider(postId)),
                ),
              );
            }
            return LifePostDetailContent(
              post: post,
              scrollController: scrollController,
              bottomPadding: 24,
            );
          },
        );
      },
    );
  }
}

class _SheetStateContainer extends StatelessWidget {
  const _SheetStateContainer({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: MediaQuery.sizeOf(context).height * 0.5,
      child: child,
    );
  }
}
