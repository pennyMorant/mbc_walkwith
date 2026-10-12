import 'dart:math';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../storage/shared_preferences_provider.dart';

final externalUserIdentityRepositoryProvider =
    Provider<ExternalUserIdentityRepository>((ref) {
      return ExternalUserIdentityRepository(
        ref.watch(sharedPreferencesProvider),
      );
    });

final externalUserIdProvider = FutureProvider<String>((ref) {
  return ref.watch(externalUserIdentityRepositoryProvider).externalUserId();
});

class ExternalUserIdentityRepository {
  const ExternalUserIdentityRepository(this._preferences);

  static const _externalUserIdKey = 'external_user_id';

  final SharedPreferences _preferences;

  Future<String> externalUserId() async {
    final existing = _preferences.getString(_externalUserIdKey);
    if (existing != null && existing.startsWith('ext_')) {
      return existing;
    }
    final generated = _newExternalUserId();
    await _preferences.setString(_externalUserIdKey, generated);
    return generated;
  }
}

String _newExternalUserId() {
  final random = Random.secure();
  final timestamp = DateTime.now().microsecondsSinceEpoch.toRadixString(16);
  final a = random.nextInt(1 << 32).toRadixString(16).padLeft(8, '0');
  final b = random.nextInt(1 << 32).toRadixString(16).padLeft(8, '0');
  return 'ext_$timestamp$a$b';
}
