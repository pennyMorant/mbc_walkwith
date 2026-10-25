import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
import 'package:mbc_walkwith/core/api/api_error.dart';
import 'package:mbc_walkwith/core/config/app_config.dart';
import 'package:mbc_walkwith/features/study/data/bible_people_repository.dart';
import 'package:mbc_walkwith/features/study/data/bible_places_repository.dart';
import 'package:mbc_walkwith/features/study/domain/bible_person.dart';
import 'package:mbc_walkwith/features/study/domain/bible_place.dart';

void main() {
  test(
    'remote people fallback section titles follow translation locale',
    () async {
      final repository = RemoteFirstBiblePeopleRepository(
        apiClient: _StaticApiClient(
          _knowledgeResponse(_personItem('cuvs', sections: const [])),
        ),
        assetRepository: const _EmptyPeopleRepository(),
      );

      final people = await repository.getPeople('cuvs');

      expect(people.single.sections.single.title, '简介');
    },
  );

  test(
    'remote place missing section title follows translation locale',
    () async {
      final repository = RemoteFirstBiblePlacesRepository(
        apiClient: _StaticApiClient(
          _knowledgeResponse(
            _placeItem(
              'cuvt',
              sections: const [
                {'type': 'context', 'title': '', 'body': '地點背景'},
              ],
            ),
          ),
        ),
        assetRepository: const _EmptyPlacesRepository(),
      );

      final places = await repository.getPlaces('cuvt');

      expect(places.single.sections.single.title, '簡介');
    },
  );

  test('remote Bible knowledge uses English fallback for WEB', () async {
    final repository = RemoteFirstBiblePeopleRepository(
      apiClient: _StaticApiClient(
        _knowledgeResponse(_personItem('web', sections: const [])),
      ),
      assetRepository: const _EmptyPeopleRepository(),
    );

    final people = await repository.getPeople('web');

    expect(people.single.sections.single.title, 'Overview');
  });

  test('falls back to bundled knowledge only for API failures', () async {
    final repository = RemoteFirstBiblePeopleRepository(
      apiClient: _ThrowingApiClient(),
      assetRepository: const _FallbackPeopleRepository(),
    );

    final people = await repository.getPeople('web');

    expect(people.single.id, 'fallback-person');
  });

  test('does not hide malformed people or place contracts', () async {
    final malformed = _StaticApiClient({'data': <String, Object?>{}});
    final people = RemoteFirstBiblePeopleRepository(
      apiClient: malformed,
      assetRepository: const _FallbackPeopleRepository(),
    );
    final places = RemoteFirstBiblePlacesRepository(
      apiClient: malformed,
      assetRepository: const _FallbackPlacesRepository(),
    );

    await expectLater(people.getPeople('web'), throwsFormatException);
    await expectLater(places.getPlaces('web'), throwsFormatException);
  });
}

Map<String, Object?> _knowledgeResponse(Map<String, Object?> item) {
  return {
    'data': {
      'items': [item],
    },
  };
}

Map<String, Object?> _personItem(
  String translationId, {
  required List<Map<String, Object?>> sections,
}) {
  return {
    'id': 'jesus',
    'type': 'person',
    'locale': translationId == 'web' ? 'en' : 'zh',
    'translationId': translationId,
    'name': '耶稣',
    'category': '人物',
    'summary': '摘要',
    'description': '说明',
    'sections': sections,
    'aliases': const ['耶稣'],
    'verseAliases': const <String, Object?>{},
    'status': 'published',
  };
}

Map<String, Object?> _placeItem(
  String translationId, {
  required List<Map<String, Object?>> sections,
}) {
  return {
    'id': 'bethlehem',
    'type': 'place',
    'locale': translationId == 'web' ? 'en' : 'zh',
    'translationId': translationId,
    'name': '伯利恒',
    'category': '地点',
    'summary': '摘要',
    'description': '说明',
    'sections': sections,
    'aliases': const ['伯利恒'],
    'verseAliases': const <String, Object?>{},
    'status': 'published',
  };
}

class _StaticApiClient extends ApiClient {
  _StaticApiClient(this.response)
    : super(config: const AppConfig(apiBaseUrl: '', useMockRemoteData: false));

  final Map<String, Object?> response;

  @override
  Future<Map<String, Object?>> getJsonMap(String path) async {
    return response;
  }
}

class _ThrowingApiClient extends ApiClient {
  _ThrowingApiClient()
    : super(config: const AppConfig(apiBaseUrl: '', useMockRemoteData: false));

  @override
  Future<Map<String, Object?>> getJsonMap(String path) async {
    throw const ApiError(message: 'offline');
  }
}

class _EmptyPeopleRepository implements BiblePeopleRepository {
  const _EmptyPeopleRepository();

  @override
  Future<List<BiblePerson>> getPeople(String translationId) async {
    return const [];
  }
}

class _EmptyPlacesRepository implements BiblePlacesRepository {
  const _EmptyPlacesRepository();

  @override
  Future<List<BiblePlace>> getPlaces(String translationId) async {
    return const [];
  }
}

class _FallbackPeopleRepository implements BiblePeopleRepository {
  const _FallbackPeopleRepository();

  @override
  Future<List<BiblePerson>> getPeople(String translationId) async {
    return const [
      BiblePerson(
        id: 'fallback-person',
        name: 'Fallback',
        role: 'Role',
        summary: '',
        description: '',
        sections: [],
        aliases: [],
        verseAliases: {},
        relatedVerseIds: [],
      ),
    ];
  }
}

class _FallbackPlacesRepository implements BiblePlacesRepository {
  const _FallbackPlacesRepository();

  @override
  Future<List<BiblePlace>> getPlaces(String translationId) async {
    return const [
      BiblePlace(
        id: 'fallback-place',
        name: 'Fallback',
        category: 'Place',
        summary: '',
        description: '',
        sections: [],
        aliases: [],
        verseAliases: {},
      ),
    ];
  }
}
