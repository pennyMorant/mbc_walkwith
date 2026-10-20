import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/features/life/domain/life_post.dart';
import 'package:mbc_walkwith/features/life/presentation/widgets/life_post_classification.dart';

void main() {
  test('Sunday post stays the hero over higher-weight non-Sunday updates', () {
    final hero = lifePostHero([
      const LifePost(
        id: 'announcement',
        type: 'announcement',
        title: 'VPS 测试生活内容',
        body: 'Important update',
        meta: '',
        iconName: 'church',
        sort: 100,
      ),
      LifePost(
        id: 'sunday',
        type: 'sunday',
        title: 'Sunday Worship',
        body: 'Join worship.',
        meta: '',
        iconName: 'church',
        startsAt: DateTime.utc(2026, 6, 28, 17),
      ),
    ]);

    expect(hero?.id, 'sunday');
  });

  test('Registration-enabled life posts are event cards', () {
    const post = LifePost(
      id: 'fellowship',
      type: 'fellowship',
      title: 'Friday Fellowship',
      body: 'Bible sharing and dinner.',
      meta: '',
      iconName: 'groups',
      registrationEnabled: true,
    );

    expect(lifePostIsEventLike(post), isTrue);
  });

  test('localized titles do not override the canonical post type', () {
    const post = LifePost(
      id: 'announcement',
      type: 'announcement',
      title: '小组课程与代祷更新',
      body: 'A translated announcement title must not change tabs.',
      meta: '',
      iconName: 'church',
    );

    expect(lifePostIsGroupLike(post), isFalse);
    expect(lifePostIsCourseLike(post), isFalse);
    expect(lifePostIsPrayerLike(post), isFalse);
  });
}
