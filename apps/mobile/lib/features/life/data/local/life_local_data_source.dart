import 'package:drift/drift.dart';

import '../../../../core/database/app_database.dart';
import '../../domain/life_post_list_request.dart';
import '../dto/life_post_dto.dart';

class LifeLocalDataSource {
  const LifeLocalDataSource({required this.database});

  final AppDatabase database;

  Future<List<LifePostDto>> fetchLifePosts({
    LifePostListRequest request = const LifePostListRequest(),
  }) async {
    final query = database.select(database.localLifePosts)
      ..orderBy([
        (post) => OrderingTerm.desc(post.displayWeight),
        (post) => OrderingTerm.desc(post.startsAt),
        (post) => OrderingTerm.desc(post.updatedAt),
      ]);
    final posts = await query.get();
    return posts
        .map(_postFromRow)
        .where((post) => _matchesRequest(post, request))
        .take(request.limit)
        .toList(growable: false);
  }

  Future<LifePostDto?> fetchLifePostById(String postId) async {
    final query = database.select(database.localLifePosts)
      ..where((post) => post.id.equals(postId))
      ..limit(1);
    final post = await query.getSingleOrNull();
    return post == null ? null : _postFromRow(post);
  }

  Future<void> deleteLifePost(String postId) async {
    await (database.delete(
      database.localLifePosts,
    )..where((post) => post.id.equals(postId))).go();
  }

  Future<void> replaceLifePosts(List<LifePostDto> posts) async {
    final now = DateTime.now().toUtc();

    await database.transaction(() async {
      await database.delete(database.localLifePosts).go();
      for (final post in posts) {
        await _insertLifePost(post, now);
      }
    });
  }

  Future<void> upsertLifePost(LifePostDto post) async {
    await _insertLifePost(post, DateTime.now().toUtc(), upsert: true);
  }

  Future<void> _insertLifePost(
    LifePostDto post,
    DateTime fallbackUpdatedAt, {
    bool upsert = false,
  }) async {
    final companion = LocalLifePostsCompanion.insert(
      id: post.id,
      type: post.type,
      title: post.title,
      body: post.body,
      meta: Value(post.meta),
      iconName: Value(post.iconName),
      startsAt: Value(_dateFromString(post.startsAt)),
      endsAt: Value(_dateFromString(post.endsAt)),
      visibility: post.visibility ?? 'public',
      status: Value(post.status),
      imageUrl: Value(post.imageUrl),
      displayWeight: Value(post.displayWeight),
      ctaLabel: Value(post.ctaLabel),
      ctaUrl: Value(post.ctaUrl),
      updatedAt: _dateFromString(post.updatedAt) ?? fallbackUpdatedAt,
    );
    await database
        .into(database.localLifePosts)
        .insert(
          companion,
          mode: upsert ? InsertMode.insertOrReplace : InsertMode.insert,
        );
  }
}

LifePostDto _postFromRow(LocalLifePost post) {
  final startsAt = post.startsAt?.toIso8601String();
  return LifePostDto(
    id: post.id,
    type: post.type,
    title: post.title,
    body: post.body,
    meta: post.meta.isNotEmpty ? post.meta : _metaFromDate(post.startsAt),
    iconName: post.iconName,
    startsAt: startsAt,
    endsAt: post.endsAt?.toIso8601String(),
    visibility: post.visibility,
    status: post.status,
    imageUrl: post.imageUrl,
    displayWeight: post.displayWeight,
    ctaLabel: post.ctaLabel,
    ctaUrl: post.ctaUrl,
    updatedAt: post.updatedAt.toIso8601String(),
    isRead: true,
  );
}

DateTime? _dateFromString(String? value) {
  return value == null ? null : DateTime.tryParse(value)?.toUtc();
}

String _metaFromDate(DateTime? value) {
  return value?.toLocal().toString().split('.').first ?? '';
}

bool _matchesRequest(LifePostDto post, LifePostListRequest request) {
  final query = request.query?.trim().toLowerCase();
  if (query != null && query.isNotEmpty) {
    final haystack = [
      post.title,
      post.body,
      post.meta,
      post.type,
    ].whereType<String>().join(' ').toLowerCase();
    if (!haystack.contains(query)) {
      return false;
    }
  }

  final type = request.type?.trim();
  if (type != null && type.isNotEmpty && post.type != type) {
    return false;
  }

  return _touchesRange(
    _dateFromString(post.startsAt) ?? _dateFromString(post.updatedAt),
    _dateFromString(post.endsAt),
    request,
  );
}

bool _touchesRange(
  DateTime? startsAt,
  DateTime? endsAt,
  LifePostListRequest request,
) {
  if (request.from == null && request.to == null) {
    return true;
  }
  final start = startsAt;
  if (start == null) {
    return false;
  }
  final end = endsAt ?? start;
  if (request.from != null && !end.isAfter(request.from!)) {
    return false;
  }
  if (request.to != null && !start.isBefore(request.to!)) {
    return false;
  }
  return true;
}
