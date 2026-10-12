import 'dart:async';
import 'dart:math';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class FirebasePushDeviceRegistration {
  const FirebasePushDeviceRegistration({
    required FirebaseMessaging messaging,
    required SharedPreferences preferences,
  }) : _messaging = messaging,
       _preferences = preferences;

  static const _installationIdKey = 'push_installation_id';

  final FirebaseMessaging _messaging;
  final SharedPreferences _preferences;

  Future<String?> resolvePushToken(String? pushTokenOverride) async {
    if (pushTokenOverride?.trim().isNotEmpty == true) {
      return pushTokenOverride!.trim();
    }
    if (defaultTargetPlatform == TargetPlatform.iOS) {
      await _waitForApnsToken();
    }
    return _messaging.getToken();
  }

  Future<String> installationId() async {
    final existing = _preferences.getString(_installationIdKey);
    if (existing != null && existing.isNotEmpty) {
      return existing;
    }
    final random = Random.secure().nextInt(1 << 32).toRadixString(16);
    final installationId =
        'install-${DateTime.now().microsecondsSinceEpoch.toRadixString(16)}-$random';
    await _preferences.setString(_installationIdKey, installationId);
    return installationId;
  }

  static String platformValue() {
    return switch (defaultTargetPlatform) {
      TargetPlatform.iOS => 'ios',
      TargetPlatform.android => 'android',
      _ => 'android',
    };
  }

  Future<void> _waitForApnsToken() async {
    for (var attempt = 0; attempt < 20; attempt += 1) {
      final token = await _messaging.getAPNSToken();
      if (token != null && token.isNotEmpty) {
        return;
      }
      await Future<void>.delayed(const Duration(milliseconds: 250));
    }
  }
}
