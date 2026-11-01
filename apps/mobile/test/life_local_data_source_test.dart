import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/database/app_database.dart';
import 'package:mbc_walkwith/features/life/data/dto/life_post_dto.dart';
import 'package:mbc_walkwith/features/life/data/local/life_local_data_source.dart';
import 'package:mbc_walkwith/features/life/domain/life_post_list_request.dart';

import 'test_database.dart';

void main() {
  test('life post cache preserves meta and icon fields', () async {
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);
    final dataSource = LifeLocalDataSource(database: database);

    await dataSource.replaceLifePosts([
      const LifePostDto(
        id: 'life-prayer-night',
        type: 'announcement',
        title: 'Prayer Night',
        body: 'Join us for prayer.',
        meta: 'Wednesday 7 PM',
        iconName: 'prayer',
        visibility: 'public',
        status: 'published',
        sort: 100,
        ctaLabel: '报名参加',
        ctaUrl: 'https://example.com/register',
      ),
    ]);

    final posts = await dataSource.fetchLifePosts();

    expect(posts, hasLength(1));
    expect(posts.single.meta, 'Wednesday 7 PM');
    expect(posts.single.iconName, 'prayer');
    expect(posts.single.status, 'published');
    expect(posts.single.sort, 100);
    expect(posts.single.ctaLabel, '报名参加');
    expect(posts.single.ctaUrl, 'https://example.com/register');
  });

  test('life post cache includes a point event at the range start', () async {
    final database = AppDatabase(openTestDatabaseConnection());
    addTearDown(database.close);
    final dataSource = LifeLocalDataSource(database: database);
    const boundary = '2026-08-01T07:00:00.000Z';

    await dataSource.replaceLifePosts([
      const LifePostDto(
        id: 'month-boundary',
        type: 'announcement',
        title: 'Month boundary',
        body: 'Visible at the first instant of the selected month.',
        meta: '',
        iconName: 'event',
        startsAt: boundary,
        visibility: 'public',
      ),
    ]);

    final included = await dataSource.fetchLifePosts(
      request: LifePostListRequest(
        from: DateTime.parse(boundary),
        to: DateTime.parse('2026-09-01T07:00:00.000Z'),
      ),
    );
    final excluded = await dataSource.fetchLifePosts(
      request: LifePostListRequest(
        from: DateTime.parse('2026-07-01T07:00:00.000Z'),
        to: DateTime.parse(boundary),
      ),
    );

    expect(included.map((post) => post.id), contains('month-boundary'));
    expect(excluded.map((post) => post.id), isNot(contains('month-boundary')));
  });
}
