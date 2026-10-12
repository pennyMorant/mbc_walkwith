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
        displayWeight: 100,
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
}
