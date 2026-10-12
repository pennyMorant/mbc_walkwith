import '../../domain/life_post.dart';

bool lifePostIsSundayMain(LifePost post) {
  final type = _normalized(post.type);
  final title = _normalized(post.title);
  return _containsAny(type, const [
        'sunday',
        'worship',
        'service',
        'weekly_bulletin',
        'bulletin',
        '主日',
        '崇拜',
        '周报',
        '週報',
      ]) ||
      _containsAny(title, const ['主日', '崇拜', 'sunday worship']);
}

bool lifePostIsEventLike(LifePost post) {
  if (post.registrationEnabled) {
    return true;
  }
  final type = _normalized(post.type);
  return _containsAny(type, const [
    'event',
    'activity',
    'fellowship',
    'retreat',
    'camp',
    'signup',
    'registration',
    '活动',
    '活動',
    '团契',
    '團契',
    '营会',
    '營會',
    '报名',
    '報名',
  ]);
}

bool lifePostIsGroupLike(LifePost post) {
  final source = _normalized('${post.type} ${post.title}');
  return _containsAny(source, const [
    'group',
    'fellowship',
    'cell',
    '团契',
    '團契',
    '小组',
    '小組',
  ]);
}

bool lifePostIsCourseLike(LifePost post) {
  final source = _normalized('${post.type} ${post.title}');
  return _containsAny(source, const [
    'course',
    'class',
    'lesson',
    'training',
    '课程',
    '課程',
    '课堂',
    '課堂',
    '培训',
    '培訓',
  ]);
}

bool lifePostIsServingLike(LifePost post) {
  final source = _normalized('${post.type} ${post.title}');
  return _containsAny(source, const [
    'serving',
    'service_opportunity',
    'volunteer',
    'ministry',
    '服事',
    '事奉',
    '同工',
  ]);
}

bool lifePostIsPrayerLike(LifePost post) {
  final source = _normalized('${post.type} ${post.title}');
  return _containsAny(source, const [
    'prayer',
    'care',
    '代祷',
    '代禱',
    '祷告',
    '禱告',
    '关怀',
    '關懷',
  ]);
}

List<LifePost> lifePostWeekTimeline(List<LifePost> posts, {DateTime? now}) {
  final anchor = now ?? DateTime.now();
  final startOfToday = DateTime(anchor.year, anchor.month, anchor.day);
  final startOfWeek = startOfToday.subtract(Duration(days: anchor.weekday % 7));
  final endOfWeek = startOfWeek.add(const Duration(days: 7));
  return posts
      .where((post) => _postTouchesRange(post, startOfWeek, endOfWeek))
      .toList()
    ..sort(compareLifePostTimeline);
}

LifePost? lifePostHero(List<LifePost> posts) {
  if (posts.isEmpty) {
    return null;
  }
  final sundayPosts = posts.where(lifePostIsSundayMain).toList();
  if (sundayPosts.isNotEmpty) {
    sundayPosts.sort(_compareHeroPriority);
    return sundayPosts.first;
  }

  final upcomingPosts =
      posts
          .where(
            (post) =>
                post.startsAt != null && post.startsAt!.isAfter(DateTime.now()),
          )
          .toList()
        ..sort(compareLifePostStartTime);
  if (upcomingPosts.isNotEmpty) {
    return upcomingPosts.first;
  }

  return posts.first;
}

int compareLifePostStartTime(LifePost a, LifePost b) {
  final aStartsAt = a.startsAt;
  final bStartsAt = b.startsAt;
  if (aStartsAt == null && bStartsAt == null) {
    return a.title.compareTo(b.title);
  }
  if (aStartsAt == null) {
    return 1;
  }
  if (bStartsAt == null) {
    return -1;
  }
  return aStartsAt.compareTo(bStartsAt);
}

int compareLifePostTimeline(LifePost a, LifePost b) {
  final aTime = a.startsAt ?? a.updatedAt;
  final bTime = b.startsAt ?? b.updatedAt;
  if (aTime == null && bTime == null) {
    return a.title.compareTo(b.title);
  }
  if (aTime == null) {
    return 1;
  }
  if (bTime == null) {
    return -1;
  }
  return aTime.compareTo(bTime);
}

int _compareHeroPriority(LifePost a, LifePost b) {
  if (a.displayWeight != b.displayWeight) {
    return b.displayWeight.compareTo(a.displayWeight);
  }
  return compareLifePostStartTime(a, b);
}

bool _postTouchesRange(LifePost post, DateTime start, DateTime end) {
  final postStart = post.startsAt ?? post.updatedAt;
  if (postStart == null) {
    return false;
  }
  final postEnd = post.endsAt ?? postStart;
  return postEnd.isAfter(start) && postStart.isBefore(end);
}

bool _containsAny(String source, List<String> candidates) {
  return candidates.any((candidate) => source.contains(candidate));
}

String _normalized(String value) {
  return value.trim().toLowerCase().replaceAll('-', '_').replaceAll(' ', '_');
}
