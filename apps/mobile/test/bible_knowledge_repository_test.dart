import 'package:flutter_test/flutter_test.dart';
import 'package:mbc_walkwith/core/api/api_client.dart';
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
                {'type': 'context', 'body': '地點背景'},
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
    'translationId': translationId,
    'name': '耶稣',
    'category': '人物',
    'summary': '摘要',
    'description': '说明',
    'sections': sections,
    'aliases': const ['耶稣'],
    'verseAliases': const <String, Object?>{},
  };
}

Map<String, Object?> _placeItem(
  String translationId, {
  required List<Map<String, Object?>> sections,
}) {
  return {
    'id': 'bethlehem',
    'translationId': translationId,
    'name': '伯利恒',
    'category': '地点',
    'summary': '摘要',
    'description': '说明',
    'sections': sections,
    'aliases': const ['伯利恒'],
    'verseAliases': const <String, Object?>{},
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
