import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/api_client.dart';
import '../config/app_config.dart';
import 'app_settings.dart';

final appSettingsRepositoryProvider = Provider<AppSettingsRepository>((ref) {
  final config = ref.watch(appConfigProvider);
  if (config.useMockRemoteData) {
    return const DefaultAppSettingsRepository();
  }
  return ApiAppSettingsRepository(apiClient: ref.watch(apiClientProvider));
});

final appSettingsProvider = FutureProvider<AppSettings>((ref) {
  return ref.watch(appSettingsRepositoryProvider).getSettings();
});

abstract class AppSettingsRepository {
  Future<AppSettings> getSettings();
}

class DefaultAppSettingsRepository implements AppSettingsRepository {
  const DefaultAppSettingsRepository();

  @override
  Future<AppSettings> getSettings() async {
    return AppSettings.defaults;
  }
}

class ApiAppSettingsRepository implements AppSettingsRepository {
  const ApiAppSettingsRepository({required this.apiClient});

  final ApiClient apiClient;

  @override
  Future<AppSettings> getSettings() async {
    try {
      final response = await apiClient.getJsonMap('/settings/public?limit=200');
      final data = response['data'];
      if (data is! Map<String, Object?>) {
        return AppSettings.defaults;
      }
      final items = data['items'];
      if (items is! List<Object?>) {
        return AppSettings.defaults;
      }
      final values = <String, Object?>{};
      for (final item in items.cast<Map<String, Object?>>()) {
        final key = item['key'] as String?;
        if (key != null) {
          values[key] = item['value'];
        }
      }
      return AppSettings.fromSettingMap(values);
    } catch (_) {
      return AppSettings.defaults;
    }
  }
}
