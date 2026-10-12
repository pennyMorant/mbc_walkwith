import 'package:firebase_core/firebase_core.dart';

/// Placeholder Firebase options file.
///
/// Generate the real file locally by running:
///
/// ```sh
/// flutterfire configure
/// ```
///
/// Do not commit the generated project-specific values to the public repository.
/// Until then, accessing [currentPlatform] throws so the app can surface a clear
/// setup error instead of failing later with an opaque Firebase initialization
/// error.
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    throw UnsupportedError(
      'Firebase is not configured for this app yet. Run "flutterfire configure" '
      'from apps/mobile and keep the generated project values local.',
    );
  }
}
