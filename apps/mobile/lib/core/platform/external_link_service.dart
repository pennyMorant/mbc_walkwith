import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

final externalLinkServiceProvider = Provider<ExternalLinkService>((ref) {
  return const ExternalLinkService();
});

class ExternalLinkService {
  const ExternalLinkService();

  Future<bool> openExternalUrl(String? url) async {
    final value = url?.trim();
    if (value == null || value.isEmpty) {
      return false;
    }
    final uri = Uri.tryParse(value);
    if (uri == null) {
      return false;
    }
    return openExternalUri(uri);
  }

  Future<bool> openExternalUri(Uri uri) {
    return launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}
