import 'package:flutter/widgets.dart';

String aiLocaleFor(Locale locale) {
  if (locale.languageCode == 'es') {
    return 'es';
  }
  if (locale.languageCode != 'zh') {
    return 'en';
  }
  final countryCode = locale.countryCode;
  if (locale.scriptCode == 'Hant' ||
      countryCode == 'TW' ||
      countryCode == 'HK' ||
      countryCode == 'MO') {
    return 'zh-Hant';
  }
  return 'zh-Hans';
}
