import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/api/api_client.dart';
import '../../../core/config/app_config.dart';
import '../domain/bible_place.dart';

final biblePlacesRepositoryProvider = Provider<BiblePlacesRepository>((ref) {
  final assetRepository = AssetBiblePlacesRepository();
  final config = ref.watch(appConfigProvider);
  if (config.useMockRemoteData) {
    return assetRepository;
  }
  return RemoteFirstBiblePlacesRepository(
    apiClient: ref.watch(apiClientProvider),
    assetRepository: assetRepository,
  );
});

final biblePlacesProvider = FutureProvider.family<List<BiblePlace>, String>((
  ref,
  translationId,
) {
  return ref.watch(biblePlacesRepositoryProvider).getPlaces(translationId);
});

abstract class BiblePlacesRepository {
  Future<List<BiblePlace>> getPlaces(String translationId);
}

class AssetBiblePlacesRepository implements BiblePlacesRepository {
  AssetBiblePlacesRepository({AssetBundle? assetBundle})
    : assetBundle = assetBundle ?? rootBundle;

  final AssetBundle assetBundle;

  @override
  Future<List<BiblePlace>> getPlaces(String translationId) async {
    final raw = await assetBundle.loadString(
      'assets/bible_knowledge/places.json',
    );
    final rows = (jsonDecode(raw) as List<Object?>)
        .cast<Map<String, Object?>>();

    return rows.map((row) => _placeFromJson(row, translationId)).toList();
  }
}

class RemoteFirstBiblePlacesRepository implements BiblePlacesRepository {
  const RemoteFirstBiblePlacesRepository({
    required this.apiClient,
    required this.assetRepository,
  });

  final ApiClient apiClient;
  final BiblePlacesRepository assetRepository;

  @override
  Future<List<BiblePlace>> getPlaces(String translationId) async {
    try {
      final places = await _fetchRemotePlaces(translationId);
      if (places.isNotEmpty) {
        return places;
      }
    } catch (_) {
      // Fall back to bundled knowledge when the backend is unavailable.
    }
    return assetRepository.getPlaces(translationId);
  }

  Future<List<BiblePlace>> _fetchRemotePlaces(String translationId) async {
    final query = Uri(
      queryParameters: {
        'type': 'place',
        'translationId': translationId,
        'locale': _localeForTranslationId(translationId),
        'limit': '100',
      },
    ).query;
    final response = await apiClient.getJsonMap('/bible-knowledge?$query');
    final data = response['data'];
    final items = data is Map<String, Object?> ? data['items'] : null;
    if (items is! List<Object?>) {
      return const [];
    }

    return items
        .cast<Map<String, Object?>>()
        .where((json) => json['translationId'] == translationId)
        .map((json) => _placeFromApiJson(json, translationId))
        .toList(growable: false);
  }
}

BiblePlace _placeFromJson(Map<String, Object?> row, String translationId) {
  final localeSuffix = _localeSuffixForTranslationId(translationId);
  final aliasesByTranslation =
      (row['aliases'] as Map<String, Object?>?) ?? const {};
  final rawAliases =
      (aliasesByTranslation[translationId] as List<Object?>?) ?? const [];
  final aliases = rawAliases.cast<String>().toList(growable: false);
  final verseAliases = _localizedVerseAliases(row, translationId);
  final description = row['description$localeSuffix'] as String;
  final summary = (row['summary$localeSuffix'] as String?) ?? description;
  final sections = _localizedSections(
    row: row,
    localeSuffix: localeSuffix,
    fallbackBody: description,
  );

  return BiblePlace(
    id: row['id'] as String,
    name: row['name$localeSuffix'] as String,
    category: row['category$localeSuffix'] as String,
    summary: summary,
    description: description,
    sections: sections,
    aliases: aliases,
    verseAliases: verseAliases,
  );
}

BiblePlace _placeFromApiJson(Map<String, Object?> row, String translationId) {
  final localeSuffix = _localeSuffixForTranslationId(translationId);
  final description = (row['description'] as String?) ?? '';
  final summary = (row['summary'] as String?) ?? description;
  final sections = _sectionsFromApiJson(
    row['sections'],
    localeSuffix: localeSuffix,
    fallbackBody: description,
  );
  return BiblePlace(
    id: row['id'] as String? ?? '',
    name: row['name'] as String? ?? '',
    category: row['category'] as String? ?? '',
    summary: summary,
    description: description,
    sections: sections,
    aliases: ((row['aliases'] as List<Object?>?) ?? const [])
        .cast<String>()
        .toList(growable: false),
    verseAliases: _verseAliasesFromApiJson(row['verseAliases']),
  );
}

List<BiblePlaceSection> _sectionsFromApiJson(
  Object? value, {
  required String localeSuffix,
  required String fallbackBody,
}) {
  final sections = ((value as List<Object?>?) ?? const [])
      .cast<Map<String, Object?>>()
      .map(
        (section) => BiblePlaceSection(
          type: section['type'] as String? ?? 'overview',
          title:
              _nonEmptyString(section['title']) ??
              _fallbackSectionTitle(localeSuffix),
          body: _nonEmptyString(section['body']) ?? fallbackBody,
        ),
      )
      .where((section) => section.body.trim().isNotEmpty)
      .toList(growable: false);

  if (sections.isNotEmpty) {
    return sections;
  }
  return [
    BiblePlaceSection(
      type: 'overview',
      title: _fallbackSectionTitle(localeSuffix),
      body: fallbackBody,
    ),
  ];
}

List<BiblePlaceSection> _localizedSections({
  required Map<String, Object?> row,
  required String localeSuffix,
  required String fallbackBody,
}) {
  final rawSections = (row['sections'] as List<Object?>?) ?? const [];
  final sections = rawSections
      .cast<Map<String, Object?>>()
      .map((section) {
        return BiblePlaceSection(
          type: (section['type'] as String?) ?? 'overview',
          title:
              (section['title$localeSuffix'] as String?) ??
              _fallbackSectionTitle(localeSuffix),
          body: (section['body$localeSuffix'] as String?) ?? fallbackBody,
        );
      })
      .where((section) => section.body.trim().isNotEmpty)
      .toList(growable: false);

  if (sections.isNotEmpty) {
    return sections;
  }

  return [
    BiblePlaceSection(
      type: 'overview',
      title: _fallbackSectionTitle(localeSuffix),
      body: fallbackBody,
    ),
  ];
}

String _fallbackSectionTitle(String localeSuffix) {
  return switch (localeSuffix) {
    'ZhHans' => '简介',
    'ZhHant' => '簡介',
    _ => 'Overview',
  };
}

String _localeSuffixForTranslationId(String translationId) {
  return switch (translationId) {
    'cuvs' => 'ZhHans',
    'cuvt' => 'ZhHant',
    _ => 'En',
  };
}

String? _nonEmptyString(Object? value) {
  if (value is! String) {
    return null;
  }
  final trimmed = value.trim();
  return trimmed.isEmpty ? null : trimmed;
}

Map<String, List<String>> _localizedVerseAliases(
  Map<String, Object?> row,
  String translationId,
) {
  final rawVerseAliases =
      (row['verseAliases'] as Map<String, Object?>?) ?? const {};
  if (rawVerseAliases.isEmpty) {
    return const {};
  }

  return rawVerseAliases.map((verseId, aliasesByTranslation) {
    final aliasesMap =
        (aliasesByTranslation as Map<String, Object?>?) ?? const {};
    final rawAliases =
        (aliasesMap[translationId] as List<Object?>?) ?? const [];
    return MapEntry(verseId, rawAliases.cast<String>().toList(growable: false));
  });
}

Map<String, List<String>> _verseAliasesFromApiJson(Object? value) {
  final aliases = (value as Map<String, Object?>?) ?? const {};
  return aliases.map((verseId, rawAliases) {
    return MapEntry(
      verseId,
      ((rawAliases as List<Object?>?) ?? const []).cast<String>().toList(
        growable: false,
      ),
    );
  });
}

String _localeForTranslationId(String translationId) {
  return switch (translationId) {
    'cuvs' => 'zh-Hans',
    'cuvt' => 'zh-Hant',
    _ => 'en',
  };
}
