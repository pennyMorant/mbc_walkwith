import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/life/domain/life_post.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/life_post_read_state.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/life_unread_count_badge.dart';
import 'package:mbc_walkwith/theme/app_theme.dart';

void main() {
  test(
    'unread count respects badge visibility and includes every supplied post',
    () {
      const posts = [
        LifePost(
          id: 'weekly-bulletin',
          type: 'weekly_bulletin',
          title: 'Weekly bulletin',
          body: 'Body',
          meta: '',
          iconName: 'article',
        ),
        LifePost(
          id: 'read-event',
          type: 'event',
          title: 'Read event',
          body: 'Body',
          meta: '',
          iconName: 'event',
          isRead: true,
        ),
        LifePost(
          id: 'unread-event',
          type: 'event',
          title: 'Unread event',
          body: 'Body',
          meta: '',
          iconName: 'event',
        ),
      ];

      expect(lifePostUnreadCount(posts, enabled: true), 2);
      expect(lifePostUnreadCount(posts, enabled: false), 0);
    },
  );

  testWidgets('read state gives unread Life cards a stronger hierarchy', (
    tester,
  ) async {
    late LifePostReadState unread;
    late LifePostReadState read;
    late ColorScheme colorScheme;

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.build(null, Brightness.light),
        home: Builder(
          builder: (context) {
            colorScheme = Theme.of(context).colorScheme;
            unread = LifePostReadState.fromPost(_unreadPost);
            read = LifePostReadState.fromPost(_readPost);
            return const SizedBox();
          },
        ),
      ),
    );

    expect(unread.cardColor(colorScheme), isNot(read.cardColor(colorScheme)));
    expect(unread.titleWeight, FontWeight.w800);
    expect(read.titleWeight, FontWeight.w700);
  });

  testWidgets('unread count badge hides zero and caps large counts', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.build(null, Brightness.light),
        home: const Column(
          children: [
            LifeUnreadCountBadge(unreadCount: 0),
            LifeUnreadCountBadge(unreadCount: 140),
          ],
        ),
      ),
    );

    expect(find.text('0'), findsNothing);
    expect(find.text('99+'), findsOneWidget);
  });
}

const _unreadPost = LifePost(
  id: 'unread-life-post',
  type: 'announcement',
  title: 'Unread post',
  body: 'Body',
  meta: '',
  iconName: 'article',
);

const _readPost = LifePost(
  id: 'read-life-post',
  type: 'announcement',
  title: 'Read post',
  body: 'Body',
  meta: '',
  iconName: 'article',
  isRead: true,
);
