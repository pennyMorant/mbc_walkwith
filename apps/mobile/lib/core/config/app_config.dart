import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final appConfigProvider = Provider<AppConfig>((ref) {
  return AppConfig.fromEnvironment();
});

class AppConfig {
  const AppConfig({
    required this.apiBaseUrl,
    required this.useMockRemoteData,
    this.debugMemberAuthBypass = false,
    this.debugMemberAccessToken = _defaultDebugMemberAccessToken,
  });

  factory AppConfig.fromEnvironment() {
    const apiBaseUrl = String.fromEnvironment('API_BASE_URL');
    const debugMemberAccessToken = String.fromEnvironment(
      'DEBUG_MEMBER_ACCESS_TOKEN',
      defaultValue: _defaultDebugMemberAccessToken,
    );

    return AppConfig(
      apiBaseUrl: apiBaseUrl.isEmpty ? _fallbackApiBaseUrl : apiBaseUrl,
      useMockRemoteData: const bool.fromEnvironment(
        'USE_MOCK_REMOTE_DATA',
        defaultValue: false,
      ),
      debugMemberAuthBypass:
          kDebugMode &&
          const bool.fromEnvironment(
            'DEBUG_MEMBER_AUTH_BYPASS',
            defaultValue: true,
          ),
      debugMemberAccessToken: debugMemberAccessToken.isEmpty
          ? _defaultDebugMemberAccessToken
          : debugMemberAccessToken,
    );
  }

  final String apiBaseUrl;
  final bool useMockRemoteData;
  final bool debugMemberAuthBypass;
  final String debugMemberAccessToken;
}

const _defaultDebugMemberAccessToken = 'mbc-debug-member-access';
const _fallbackApiBaseUrl = 'http://localhost:3020/v1';
