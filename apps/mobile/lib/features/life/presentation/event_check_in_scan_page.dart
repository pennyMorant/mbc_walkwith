import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../../app/app_routes.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/widgets/secondary_app_bar.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../data/life_repository.dart';
import '../domain/life_post.dart';
import 'event_check_in_error_message.dart';

class EventCheckInScanPage extends ConsumerStatefulWidget {
  const EventCheckInScanPage({super.key});

  @override
  ConsumerState<EventCheckInScanPage> createState() =>
      _EventCheckInScanPageState();
}

class _EventCheckInScanPageState extends ConsumerState<EventCheckInScanPage> {
  final MobileScannerController _scannerController = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
  );

  bool _isSubmitting = false;
  String? _errorMessage;
  LifePost? _checkedInPost;

  @override
  void dispose() {
    _scannerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final session = ref
        .watch(memberSessionProvider)
        .maybeWhen(data: (session) => session, orElse: () => null);

    return Scaffold(
      appBar: SecondaryAppBar(
        title: l10n.eventCheckInScanTitle,
        onBack: () => _goBack(context),
      ),
      body: session == null
          ? _SignInRequiredView(
              onSignIn: () => context.pushNamed(AppRouteNames.memberLoginEmail),
            )
          : _checkedInPost == null
          ? _ScannerView(
              controller: _scannerController,
              isSubmitting: _isSubmitting,
              errorMessage: _errorMessage,
              onDetect: (capture) => _handleScan(capture, session),
            )
          : _CheckInSuccessView(
              post: _checkedInPost!,
              onViewEvent: () => context.goNamed(
                AppRouteNames.lifePostDetail,
                pathParameters: {'postId': _checkedInPost!.id},
              ),
              onScanAgain: _scanAgain,
            ),
    );
  }

  Future<void> _handleScan(
    BarcodeCapture capture,
    MemberSession session,
  ) async {
    if (_isSubmitting || _checkedInPost != null) {
      return;
    }
    final code = capture.barcodes
        .map((barcode) => barcode.rawValue?.trim())
        .whereType<String>()
        .where((value) => value.isNotEmpty)
        .firstOrNull;
    if (code == null) {
      return;
    }
    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });
    await _scannerController.stop();
    try {
      final post = await ref
          .read(lifeRepositoryProvider)
          .checkInEventRegistrationWithCode(code, session);
      ref.invalidate(lifePostByIdProvider(post.id));
      ref.invalidate(lifePostsProvider);
      ref.invalidate(lifePostListProvider);
      if (!mounted) {
        return;
      }
      setState(() {
        _checkedInPost = post;
        _isSubmitting = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _errorMessage = eventCheckInErrorMessage(
          AppLocalizations.of(context)!,
          error,
        );
        _isSubmitting = false;
      });
      await _scannerController.start();
    }
  }

  Future<void> _scanAgain() async {
    setState(() {
      _checkedInPost = null;
      _errorMessage = null;
      _isSubmitting = false;
    });
    await _scannerController.start();
  }

  void _goBack(BuildContext context) {
    if (context.canPop()) {
      context.pop();
      return;
    }
    context.goNamed(AppRouteNames.life);
  }
}

class _ScannerView extends StatelessWidget {
  const _ScannerView({
    required this.controller,
    required this.isSubmitting,
    required this.errorMessage,
    required this.onDetect,
  });

  final MobileScannerController controller;
  final bool isSubmitting;
  final String? errorMessage;
  final ValueChanged<BarcodeCapture> onDetect;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;

    return Stack(
      fit: StackFit.expand,
      children: [
        MobileScanner(controller: controller, onDetect: onDetect),
        Container(color: Colors.black.withValues(alpha: 0.28)),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const Spacer(),
                Container(
                  width: 260,
                  height: 260,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(32),
                    border: Border.all(color: Colors.white, width: 3),
                  ),
                ),
                const SizedBox(height: 24),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          l10n.eventCheckInScanPrompt,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w800),
                        ),
                        if (isSubmitting) ...[
                          const SizedBox(height: 14),
                          const LinearProgressIndicator(),
                        ],
                        if (errorMessage != null) ...[
                          const SizedBox(height: 12),
                          Text(
                            errorMessage!,
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(color: colorScheme.error),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const Spacer(),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _CheckInSuccessView extends StatelessWidget {
  const _CheckInSuccessView({
    required this.post,
    required this.onViewEvent,
    required this.onScanAgain,
  });

  final LifePost post;
  final VoidCallback onViewEvent;
  final VoidCallback onScanAgain;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(22),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.check_circle, size: 54, color: colorScheme.primary),
                const SizedBox(height: 14),
                Text(
                  l10n.eventCheckInScanSuccessTitle,
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 8),
                Text(
                  post.title,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 18),
                FilledButton.icon(
                  onPressed: onViewEvent,
                  icon: const Icon(Icons.event_available_outlined),
                  label: Text(l10n.eventCheckInScanViewEvent),
                ),
                TextButton(
                  onPressed: onScanAgain,
                  child: Text(l10n.eventCheckInScanAgain),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SignInRequiredView extends StatelessWidget {
  const _SignInRequiredView({required this.onSignIn});

  final VoidCallback onSignIn;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(22),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.login, size: 44),
                const SizedBox(height: 12),
                Text(
                  l10n.eventCheckInScanSignInRequired,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: onSignIn,
                  icon: const Icon(Icons.login),
                  label: Text(l10n.memberSignInAction),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
