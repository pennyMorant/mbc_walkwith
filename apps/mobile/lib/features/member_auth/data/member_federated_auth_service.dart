import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../../core/firebase/firebase_app_initializer.dart';

final memberFederatedAuthServiceProvider = Provider<MemberFederatedAuthService>(
  (ref) => FirebaseMemberFederatedAuthService(
    firebaseInitializer: ref.watch(firebaseAppInitializerProvider),
  ),
);

enum MemberFederatedProvider { google, apple }

abstract class MemberFederatedAuthService {
  bool get isAvailable;

  Future<String> obtainIdToken(MemberFederatedProvider provider);
}

class FirebaseMemberFederatedAuthService implements MemberFederatedAuthService {
  FirebaseMemberFederatedAuthService({
    required FirebaseAppInitializer firebaseInitializer,
    GoogleSignIn? googleSignIn,
  }) : _firebaseInitializer = firebaseInitializer,
       _googleSignIn = googleSignIn ?? GoogleSignIn.instance;

  static const _googleServerClientId = String.fromEnvironment(
    'GOOGLE_SERVER_CLIENT_ID',
  );

  final FirebaseAppInitializer _firebaseInitializer;
  final GoogleSignIn _googleSignIn;
  bool _googleInitialized = false;

  @override
  bool get isAvailable => _firebaseInitializer.isConfigured;

  @override
  Future<String> obtainIdToken(MemberFederatedProvider provider) async {
    if (kIsWeb ||
        (defaultTargetPlatform != TargetPlatform.android &&
            defaultTargetPlatform != TargetPlatform.iOS)) {
      throw const MemberFederatedAuthException('platform_unsupported');
    }

    try {
      final firebaseApp = await _firebaseInitializer.ensureInitialized();
      final auth = FirebaseAuth.instanceFor(app: firebaseApp);
      try {
        final credential = switch (provider) {
          MemberFederatedProvider.google => await _signInWithGoogle(
            auth,
            firebaseApp.options.iosClientId,
          ),
          MemberFederatedProvider.apple => await auth.signInWithProvider(
            AppleAuthProvider()
              ..addScope('email')
              ..addScope('name'),
          ),
        };
        final idToken = await credential.user?.getIdToken(true);
        if (idToken == null || idToken.isEmpty) {
          throw const MemberFederatedAuthException('id_token_missing');
        }
        return idToken;
      } finally {
        await _clearTemporarySession(auth, provider);
      }
    } on MemberFederatedAuthException {
      rethrow;
    } on FirebaseSetupException {
      throw const MemberFederatedAuthException('firebase_not_configured');
    } on GoogleSignInException catch (error) {
      if (error.code == GoogleSignInExceptionCode.canceled) {
        _reportCanceledGoogleSignIn(error);
        throw const MemberFederatedAuthCanceled();
      }
      throw MemberFederatedAuthException('google_sign_in_failed', cause: error);
    } on FirebaseAuthException catch (error) {
      if (error.code == 'web-context-canceled' ||
          error.code == 'canceled' ||
          error.code == 'popup-closed-by-user') {
        throw const MemberFederatedAuthCanceled();
      }
      throw MemberFederatedAuthException('firebase_auth_failed', cause: error);
    }
  }

  void _reportCanceledGoogleSignIn(GoogleSignInException error) {
    // Android may report provider misconfiguration as a cancellation. Keep a
    // stable, non-sensitive diagnostic so release logs can distinguish this
    // path from a button that never reached the provider SDK.
    debugPrint(
      '{"event":"member_google_sign_in_canceled",'
      '"hasDescription":${error.description?.isNotEmpty == true},'
      '"hasDetails":${error.details != null}}',
    );
  }

  Future<UserCredential> _signInWithGoogle(
    FirebaseAuth auth,
    String? iosClientId,
  ) async {
    if (!_googleInitialized) {
      await _googleSignIn.initialize(
        clientId: defaultTargetPlatform == TargetPlatform.iOS
            ? iosClientId
            : null,
        serverClientId: _googleServerClientId.isEmpty
            ? null
            : _googleServerClientId,
      );
      _googleInitialized = true;
    }
    if (!_googleSignIn.supportsAuthenticate()) {
      throw const MemberFederatedAuthException('platform_unsupported');
    }
    final account = await _googleSignIn.authenticate();
    final googleIdToken = account.authentication.idToken;
    if (googleIdToken == null || googleIdToken.isEmpty) {
      throw const MemberFederatedAuthException('google_id_token_missing');
    }
    return auth.signInWithCredential(
      GoogleAuthProvider.credential(idToken: googleIdToken),
    );
  }

  Future<void> _clearTemporarySession(
    FirebaseAuth auth,
    MemberFederatedProvider provider,
  ) async {
    try {
      await auth.signOut();
    } catch (_) {}
    if (provider == MemberFederatedProvider.google && _googleInitialized) {
      try {
        await _googleSignIn.signOut();
      } catch (_) {}
    }
  }
}

class MemberFederatedAuthException implements Exception {
  const MemberFederatedAuthException(this.code, {this.cause});

  final String code;
  final Object? cause;
}

class MemberFederatedAuthCanceled extends MemberFederatedAuthException {
  const MemberFederatedAuthCanceled() : super('canceled');
}
