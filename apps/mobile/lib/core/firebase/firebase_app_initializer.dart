import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../firebase_options.dart';

final firebaseAppInitializerProvider = Provider<FirebaseAppInitializer>(
  (ref) => FirebaseAppInitializer(),
);

class FirebaseAppInitializer {
  Future<FirebaseApp>? _initialization;

  bool get isConfigured {
    try {
      DefaultFirebaseOptions.currentPlatform;
      return true;
    } on UnsupportedError {
      return false;
    }
  }

  Future<FirebaseApp> ensureInitialized() {
    if (Firebase.apps.isNotEmpty) {
      return Future.value(Firebase.app());
    }
    return _initialization ??= _initialize().whenComplete(() {
      if (Firebase.apps.isEmpty) _initialization = null;
    });
  }

  Future<FirebaseApp> _initialize() async {
    FirebaseOptions options;
    try {
      options = DefaultFirebaseOptions.currentPlatform;
    } on UnsupportedError catch (error) {
      throw FirebaseSetupException(error.message?.toString());
    }
    return Firebase.initializeApp(options: options);
  }
}

class FirebaseSetupException implements Exception {
  const FirebaseSetupException([this.message]);

  final String? message;
}
