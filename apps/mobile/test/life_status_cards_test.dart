import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/life/domain/care_request.dart';
import 'package:mbc_walkwith/features/life/domain/prayer_request.dart';
import 'package:mbc_walkwith/features/life/domain/serving_assignment.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/care_request_card.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/prayer_request_card.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/serving_assignment_card.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('life cards label unknown statuses explicitly', (tester) async {
    await tester.pumpWidget(
      _localizedApp(
        child: ListView(
          children: [
            PrayerRequestCard(request: _unknownPrayerRequest, isMine: true),
            CareRequestCard(request: _unknownCareRequest),
            ServingAssignmentCard(
              assignment: _unknownServingAssignment,
              isSubmitting: false,
              onConfirm: () {},
              onLeave: () {},
            ),
          ],
        ),
      ),
    );

    expect(find.text('Unknown status'), findsNWidgets(3));
    expect(find.text('Pending'), findsNothing);
    expect(find.text('Submitted'), findsNothing);
    expect(find.text('Scheduled'), findsNothing);
  });

  testWidgets('serving card labels scheduled assignments explicitly', (
    tester,
  ) async {
    await tester.pumpWidget(
      _localizedApp(
        child: ServingAssignmentCard(
          assignment: _scheduledServingAssignment,
          isSubmitting: false,
          onConfirm: () {},
          onLeave: () {},
        ),
      ),
    );

    expect(find.text('Scheduled'), findsOneWidget);
    expect(find.text('Unknown status'), findsNothing);
  });

  testWidgets('prayer card labels review states explicitly', (tester) async {
    await tester.pumpWidget(
      _localizedApp(
        child: ListView(
          children: [
            PrayerRequestCard(request: _pendingPrayerRequest, isMine: true),
            PrayerRequestCard(request: _submittedPrayerRequest, isMine: true),
            PrayerRequestCard(request: _underReviewPrayerRequest, isMine: true),
          ],
        ),
      ),
    );

    expect(find.text('Pending'), findsNWidgets(3));
    expect(find.text('Unknown status'), findsNothing);
  });

  testWidgets('care card labels submitted status explicitly', (tester) async {
    await tester.pumpWidget(
      _localizedApp(child: CareRequestCard(request: _submittedCareRequest)),
    );

    expect(find.text('Submitted'), findsOneWidget);
    expect(find.text('Unknown status'), findsNothing);
  });

  testWidgets('care follow-up date stays visible in Spanish', (tester) async {
    await tester.pumpWidget(
      _localizedApp(
        locale: const Locale('es'),
        child: CareRequestCard(request: _careRequestWithFollowUp),
      ),
    );

    expect(find.textContaining('Próximo seguimiento'), findsOneWidget);
    expect(find.textContaining('10'), findsOneWidget);
  });
}

Widget _localizedApp({required Widget child, Locale? locale}) {
  return MaterialApp(
    locale: locale,
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    theme: AppTheme.build(null, Brightness.light),
    home: Scaffold(body: child),
  );
}

final _unknownPrayerRequest = PrayerRequest(
  id: 'prayer_unknown_status',
  title: 'Prayer request',
  body: 'Please pray for this family.',
  visibility: 'private',
  groupId: null,
  status: 'requires_review',
  submitterName: 'Member',
  createdAt: DateTime.utc(2026, 1, 4),
  updatedAt: DateTime.utc(2026, 1, 4),
);

final _pendingPrayerRequest = PrayerRequest(
  id: 'prayer_pending_status',
  title: 'Prayer request',
  body: 'Please pray for this family.',
  visibility: 'private',
  groupId: null,
  status: 'pending',
  submitterName: 'Member',
  createdAt: DateTime.utc(2026, 1, 4),
  updatedAt: DateTime.utc(2026, 1, 4),
);

final _submittedPrayerRequest = PrayerRequest(
  id: 'prayer_submitted_status',
  title: 'Prayer request',
  body: 'Please pray for this family.',
  visibility: 'private',
  groupId: null,
  status: 'submitted',
  submitterName: 'Member',
  createdAt: DateTime.utc(2026, 1, 4),
  updatedAt: DateTime.utc(2026, 1, 4),
);

final _underReviewPrayerRequest = PrayerRequest(
  id: 'prayer_under_review_status',
  title: 'Prayer request',
  body: 'Please pray for this family.',
  visibility: 'private',
  groupId: null,
  status: 'under_review',
  submitterName: 'Member',
  createdAt: DateTime.utc(2026, 1, 4),
  updatedAt: DateTime.utc(2026, 1, 4),
);

final _unknownCareRequest = CareRequest(
  id: 'care_unknown_status',
  userId: 'member_1',
  memberDisplayName: 'Member',
  memberEmail: 'member@example.com',
  title: 'Pastoral care',
  body: 'A pastoral care note.',
  status: 'requires_review',
  privacyLevel: 'pastoral_only',
  assigneeName: '',
  nextFollowUpAt: null,
  createdAt: DateTime.utc(2026, 1, 4),
  updatedAt: DateTime.utc(2026, 1, 4),
);

final _submittedCareRequest = CareRequest(
  id: 'care_submitted_status',
  userId: 'member_1',
  memberDisplayName: 'Member',
  memberEmail: 'member@example.com',
  title: 'Pastoral care',
  body: 'A pastoral care note.',
  status: 'submitted',
  privacyLevel: 'pastoral_only',
  assigneeName: '',
  nextFollowUpAt: null,
  createdAt: DateTime.utc(2026, 1, 4),
  updatedAt: DateTime.utc(2026, 1, 4),
);

final _careRequestWithFollowUp = CareRequest(
  id: 'care_follow_up_status',
  userId: 'member_1',
  memberDisplayName: 'Member',
  memberEmail: 'member@example.com',
  title: 'Pastoral care',
  body: 'A pastoral care note.',
  status: 'assigned',
  privacyLevel: 'pastoral_only',
  assigneeName: 'Pastor',
  nextFollowUpAt: DateTime.utc(2026, 7, 10),
  createdAt: DateTime.utc(2026, 1, 4),
  updatedAt: DateTime.utc(2026, 1, 4),
);

final _unknownServingAssignment = ServingAssignment(
  id: 'serving_unknown_status',
  teamName: 'Hospitality',
  roleName: 'Usher',
  title: 'Sunday welcome',
  startsAt: DateTime.utc(2026, 1, 4, 17),
  endsAt: null,
  location: 'Sanctuary',
  status: 'requires_review',
  note: '',
  responseNote: '',
);

final _scheduledServingAssignment = ServingAssignment(
  id: 'serving_scheduled_status',
  teamName: 'Hospitality',
  roleName: 'Usher',
  title: 'Sunday welcome',
  startsAt: DateTime.utc(2026, 1, 4, 17),
  endsAt: null,
  location: 'Sanctuary',
  status: 'scheduled',
  note: '',
  responseNote: '',
);
