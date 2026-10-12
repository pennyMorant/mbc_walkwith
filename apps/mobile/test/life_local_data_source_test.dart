import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/database/app_database.dart';
import 'package:mbc_walkwith/features/life/data/dto/life_post_dto.dart';
import 'package:mbc_walkwith/features/life/data/local/life_local_data_source.dart';

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
        displayWeight: 100,
        ctaLabel: '报名参加',
        ctaUrl: 'https://example.com/register',
      ),
    ]);

    final posts = await dataSource.fetchLifePosts();

    expect(posts, hasLength(1));
    expect(posts.single.meta, 'Wednesday 7 PM');
    expect(posts.single.iconName, 'prayer');
    expect(posts.single.status, 'published');
    expect(posts.single.displayWeight, 100);
    expect(posts.single.ctaLabel, '报名参加');
    expect(posts.single.ctaUrl, 'https://example.com/register');
  });
}
