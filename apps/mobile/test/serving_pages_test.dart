import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/life/data/serving_repository.dart';
import 'package:mbc_walkwith/features/life/domain/serving_assignment.dart';
import 'package:mbc_walkwith/features/life/domain/serving_availability.dart';
import 'package:mbc_walkwith/features/life/domain/serving_check_in.dart';
import 'package:mbc_walkwith/features/life/presentation/my_serving_page.dart';
import 'package:mbc_walkwith/features/life/presentation/serving_assignment_detail_page.dart';
import 'package:mbc_walkwith/features/member_auth/data/member_session_repository.dart';
import 'package:mbc_walkwith/l10n/app_localizations.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  testWidgets('my serving exposes schedule and canonical availability', (
    tester,
  ) async {
    final repository = _TestServingRepository(
      availability: [
        ServingAvailability(
          id: 'availability-1',
          startsAt: DateTime(2026, 7, 19, 9),
          endsAt: DateTime(2026, 7, 19, 12),
          status: 'preferred',
          note: 'Morning preferred.',
        ),
      ],
    );

    await tester.pumpWidget(
      _localizedApp(
        overrides: [
          memberSessionProvider.overrideWith((ref) async => _memberSession),
          servingRepositoryProvider.overrideWithValue(repository),
        ],
        child: const MyServingPage(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Sunday worship usher'), findsOneWidget);
    expect(find.text('Schedule'), findsOneWidget);
    expect(find.text('Availability'), findsOneWidget);

    await tester.tap(find.text('Availability'));
    await tester.pumpAndSettle();

    expect(find.text('Preferred time'), findsOneWidget);
    expect(find.text('Morning preferred.'), findsOneWidget);
    expect(find.text('Add availability'), findsOneWidget);

    await tester.tap(find.text('Add availability'));
    await tester.pumpAndSettle();

    expect(find.text('New availability'), findsOneWidget);
    expect(find.text('Save availability'), findsOneWidget);

    Navigator.of(tester.element(find.text('New availability'))).pop();
    await tester.pumpAndSettle();
  });

  testWidgets('serving detail submits check-in and restores canonical status', (
    tester,
  ) async {
    final repository = _TestServingRepository();
    await tester.pumpWidget(
      _localizedApp(
        overrides: [
          memberSessionProvider.overrideWith((ref) async => _memberSession),
          servingRepositoryProvider.overrideWithValue(repository),
        ],
        child: const ServingAssignmentDetailPage(assignmentId: 'assignment-1'),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Sunday worship usher'), findsOneWidget);
    expect(find.text('Arrival has not been confirmed yet.'), findsOneWidget);

    await tester.tap(find.text('Confirm arrival'));
    await tester.pump();
    await tester.pump();
    await tester.pump();

    expect(find.text('Arrival confirmed.'), findsOneWidget);
    expect(find.text('Arrived'), findsOneWidget);
    expect(
      (await repository.getCheckIns(_memberSession)).single.status,
      'checked_in',
    );
    await tester.pump(const Duration(seconds: 5));
  });

  testWidgets('serving detail deep link asks guests to sign in', (
    tester,
  ) async {
    await tester.pumpWidget(
      _localizedApp(
        overrides: [memberSessionProvider.overrideWith((ref) async => null)],
        child: const ServingAssignmentDetailPage(assignmentId: 'assignment-1'),
      ),
    );
    await tester.pumpAndSettle();

    expect(
      find.text(
        'Sign in from Mine to see member-only groups, courses, serving, and care cards.',
      ),
      findsOneWidget,
    );
    expect(find.text('Sunday worship usher'), findsNothing);
  });
}

class _TestServingRepository implements ServingRepository {
  _TestServingRepository({List<ServingAvailability>? availability})
    : _availability = availability ?? [];

  final List<ServingAvailability> _availability;
  final List<ServingCheckIn> _checkIns = [];
  String _assignmentStatus = 'scheduled';

  @override
  Future<List<ServingAssignment>> getAssignments(MemberSession session) async {
    return [_assignment()];
  }

  @override
  Future<List<ServingAvailability>> getAvailability(
    MemberSession session,
  ) async {
    return List.unmodifiable(_availability);
  }

  @override
  Future<List<ServingCheckIn>> getCheckIns(MemberSession session) async {
    return List.unmodifiable(_checkIns);
  }

  @override
  Future<ServingAssignment> confirm(
    String assignmentId,
    MemberSession session,
  ) async {
    _assignmentStatus = 'confirmed';
    return _assignment();
  }

  @override
  Future<ServingAssignment> requestLeave(
    String assignmentId,
    MemberSession session,
  ) async {
    _assignmentStatus = 'declined';
    return _assignment();
  }

  @override
  Future<ServingAvailability> createAvailability(
    ServingAvailabilityDraft draft,
    MemberSession session,
  ) async {
    final record = ServingAvailability(
      id: 'availability-${_availability.length + 1}',
      startsAt: draft.startsAt,
      endsAt: draft.endsAt,
      status: draft.status,
      note: draft.note.trim(),
    );
    _availability.add(record);
    return record;
  }

  @override
  Future<ServingCheckIn> checkIn(
    String assignmentId,
    MemberSession session, {
    String note = '',
  }) async {
    final record = ServingCheckIn(
      id: 'check-in-1',
      assignmentId: assignmentId,
      status: 'checked_in',
      checkedInAt: DateTime(2026, 7, 19, 8, 55),
      note: note.trim(),
    );
    _checkIns
      ..clear()
      ..add(record);
    return record;
  }

  ServingAssignment _assignment() {
    return ServingAssignment(
      id: 'assignment-1',
      teamName: 'Hospitality',
      roleName: 'Usher',
      title: 'Sunday worship usher',
      startsAt: DateTime(2026, 7, 19, 9),
      endsAt: DateTime(2026, 7, 19, 11),
      location: 'Main Sanctuary',
      status: _assignmentStatus,
      note: '',
      responseNote: '',
    );
  }
}

Widget _localizedApp({
  required List<Override> overrides,
  required Widget child,
}) {
  return ProviderScope(
    overrides: overrides,
    child: MaterialApp(
      locale: const Locale('en'),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      theme: AppTheme.build(null, Brightness.light),
      home: child,
    ),
  );
}

const _memberSession = MemberSession(
  accessToken: 'member-token',
  member: MemberProfile(
    id: 'member-1',
    email: 'member@example.com',
    displayName: 'Member',
    roles: ['member'],
    appLocale: 'en',
    fellowshipGroupId: null,
    notificationSettings: MemberNotificationSettings.defaults,
  ),
);
