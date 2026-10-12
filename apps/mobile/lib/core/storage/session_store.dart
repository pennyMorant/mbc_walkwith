import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'shared_preferences_provider.dart';

final sessionStoreProvider = Provider<SessionStore>((ref) {
  return SecureSessionStore(
    secureStorage: const FlutterSecureStorage(),
    sharedPreferences: ref.watch(sharedPreferencesProvider),
  );
});

abstract interface class SessionStore {
  Future<String?> readAccessToken();

  Future<void> writeAccessToken(String accessToken);

  Future<void> clearAccessToken();

  Future<String?> readMemberProfileJson();

  Future<void> writeMemberProfileJson(String profileJson);

  Future<void> clearMemberProfileJson();

  Future<void> clearSession();
}

class SecureSessionStore implements SessionStore {
  const SecureSessionStore({
    required this.secureStorage,
    required this.sharedPreferences,
  });

  static const accessTokenKey = 'member_access_token';
  static const memberProfileKey = 'member_profile';

  final FlutterSecureStorage secureStorage;
  final SharedPreferences sharedPreferences;

  @override
  Future<String?> readAccessToken() {
    return secureStorage.read(key: accessTokenKey);
  }

  @override
  Future<void> writeAccessToken(String accessToken) {
    return secureStorage.write(key: accessTokenKey, value: accessToken);
  }

  @override
  Future<void> clearAccessToken() {
    return secureStorage.delete(key: accessTokenKey);
  }

  @override
  Future<String?> readMemberProfileJson() async {
    final secured = await secureStorage.read(key: memberProfileKey);
    final legacy = sharedPreferences.getString(memberProfileKey);
    if (legacy == null) {
      return secured;
    }
    if (secured == null) {
      await secureStorage.write(key: memberProfileKey, value: legacy);
    }
    await sharedPreferences.remove(memberProfileKey);
    return secured ?? legacy;
  }

  @override
  Future<void> writeMemberProfileJson(String profileJson) async {
    await sharedPreferences.remove(memberProfileKey);
    await secureStorage.write(key: memberProfileKey, value: profileJson);
  }

  @override
  Future<void> clearMemberProfileJson() async {
    await secureStorage.delete(key: memberProfileKey);
    await sharedPreferences.remove(memberProfileKey);
  }

  @override
  Future<void> clearSession() async {
    await clearAccessToken();
    await clearMemberProfileJson();
  }
}
