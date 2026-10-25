import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app_routes.dart';
import '../../study/domain/reading_plan.dart';
import '../../study/presentation/widgets/reading_plan_detail_sheet.dart';
import 'widgets/reading_plan_catalog_sheet.dart';

Future<void> showReadingPlanCatalog(BuildContext context) async {
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: false,
    builder: (sheetContext) => ReadingPlanCatalogSheet(
      onOpenPlan: (plan) {
        Navigator.of(sheetContext).pop();
        _showReadingPlan(context, plan);
      },
    ),
  );
}

Future<void> _showReadingPlan(BuildContext context, ReadingPlan plan) async {
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: false,
    builder: (sheetContext) => ReadingPlanDetailSheet(
      plan: plan,
      onOpenReference: (reference) {
        Navigator.of(sheetContext).pop();
        context.pushNamed(
          AppRouteNames.studyReader,
          pathParameters: {
            'bookId': reference.bookId,
            'chapter': '${reference.chapter}',
          },
          queryParameters: {'verse': '${reference.startVerse}'},
        );
      },
    ),
  );
}
