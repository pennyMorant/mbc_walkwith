import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app_routes.dart';
import '../domain/life_post.dart';
import 'life_post_detail_sheet.dart';

enum LifePostDetailPresentationMode { sheet, page }

final lifePostDetailPresentationModeProvider =
    Provider<LifePostDetailPresentationMode>(
      (ref) => LifePostDetailPresentationMode.sheet,
    );

Future<void> openLifePostDetail(
  BuildContext context,
  WidgetRef ref,
  LifePost post,
) {
  final mode = ref.read(lifePostDetailPresentationModeProvider);
  if (mode == LifePostDetailPresentationMode.page) {
    context.pushNamed(
      AppRouteNames.lifePostDetail,
      pathParameters: {'postId': post.id},
    );
    return Future<void>.value();
  }
  return LifePostDetailSheet.show(context, postId: post.id);
}
