import '../../domain/life_post.dart';

bool lifePostIsSundayMain(LifePost post) {
  return post.type == 'weekly_bulletin' || post.type == 'sunday';
}

bool lifePostIsEventLike(LifePost post) {
  if (post.registrationEnabled) {
    return true;
  }
  return post.type == 'event' || post.type == 'fellowship';
}

bool lifePostIsGroupLike(LifePost post) {
  return post.type == 'group';
}

bool lifePostIsCourseLike(LifePost post) {
  return post.type == 'course';
}

bool lifePostIsServingLike(LifePost post) {
  return post.type == 'serving';
}

bool lifePostIsPrayerLike(LifePost post) {
  return post.type == 'prayer' || post.type == 'care';
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
  if (a.sort != b.sort) {
    return b.sort.compareTo(a.sort);
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
