import 'dart:ui';

class BibleTranslation {
  const BibleTranslation({
    required this.id,
    required this.localeCode,
    required this.name,
    required this.abbreviation,
  });

  final String id;
  final String localeCode;
  final String name;
  final String abbreviation;

  bool get usesEnglishNames => id == web.id;
  bool get usesTraditionalChineseNames => id == cuvt.id;

  static const web = BibleTranslation(
    id: 'web',
    localeCode: 'en',
    name: 'World English Bible',
    abbreviation: 'WEB',
  );

  static const cuvs = BibleTranslation(
    id: 'cuvs',
    localeCode: 'zh-Hans',
    name: '新标点和合本',
    abbreviation: '和合本',
  );

  static const cuvt = BibleTranslation(
    id: 'cuvt',
    localeCode: 'zh-Hant',
    name: '新標點和合本',
    abbreviation: '和合本',
  );

  static const values = [web, cuvs, cuvt];

  static BibleTranslation fromLocale(Locale locale) {
    if (locale.languageCode != 'zh') {
      return web;
    }

    final scriptCode = locale.scriptCode;
    if (scriptCode == 'Hant') {
      return cuvt;
    }
    if (scriptCode == 'Hans') {
      return cuvs;
    }

    return switch (locale.countryCode) {
      'TW' || 'HK' || 'MO' => cuvt,
      _ => cuvs,
    };
  }

  static BibleTranslation fromId(String id) {
    return values.firstWhere(
      (translation) => translation.id == id,
      orElse: () => web,
    );
  }
}
