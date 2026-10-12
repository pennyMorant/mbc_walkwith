import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app_routes.dart';
import '../../../core/api/api_error.dart';
import '../../../core/platform/external_link_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/utils/app_formatters.dart';
import '../../../shared/widgets/app_markdown_body.dart';
import '../../../shared/widgets/secondary_app_bar.dart';
import '../../member_auth/data/member_session_repository.dart';
import '../data/life_repository.dart';
import '../domain/life_post.dart';
import 'life_post_read_controller.dart';
import 'widgets/event_registration_card.dart';
import 'widgets/life_error_view.dart';
import 'widgets/life_loading_view.dart';
import 'widgets/life_post_image_fallback.dart';

class LifePostDetailPage extends ConsumerWidget {
  const LifePostDetailPage({super.key, required this.postId});

  final String postId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final postAsync = ref.watch(lifePostByIdProvider(postId));

    return Scaffold(
      appBar: SecondaryAppBar(title: '', onBack: () => _goBack(context)),
      body: postAsync.when(
        loading: () => const LifeLoadingView(),
        error: (error, stackTrace) => LifeErrorView(
          onRetry: () => ref.invalidate(lifePostByIdProvider(postId)),
        ),
        data: (post) {
          if (post == null) {
            return LifeErrorView(
              onRetry: () => ref.invalidate(lifePostByIdProvider(postId)),
            );
          }
          return LifePostDetailContent(post: post);
        },
      ),
    );
  }

  void _goBack(BuildContext context) {
    if (context.canPop()) {
      context.pop();
      return;
    }
    context.goNamed(AppRouteNames.life);
  }
}

class LifePostDetailContent extends ConsumerStatefulWidget {
  const LifePostDetailContent({
    super.key,
    required this.post,
    this.scrollController,
    this.bottomPadding = 0,
  });

  final LifePost post;
  final ScrollController? scrollController;
  final double bottomPadding;

  @override
  ConsumerState<LifePostDetailContent> createState() =>
      _LifePostDetailContentState();
}

class _LifePostDetailContentState extends ConsumerState<LifePostDetailContent> {
  final _registrationNoteController = TextEditingController();
  bool _isSubmittingRegistration = false;
  int _registrationPartySize = 1;
  String? _pendingReadKey;
  String? _lastMarkedReadKey;

  @override
  void initState() {
    super.initState();
    _syncRegistrationFormFromPost(widget.post);
  }

  @override
  void didUpdateWidget(covariant LifePostDetailContent oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.post.id != widget.post.id ||
        oldWidget.post.registrationSummary?.myPartySize !=
            widget.post.registrationSummary?.myPartySize ||
        oldWidget.post.registrationSummary?.myNote !=
            widget.post.registrationSummary?.myNote) {
      _syncRegistrationFormFromPost(widget.post);
    }
    final maxPartySize = widget.post.registrationMaxPartySize;
    if (_registrationPartySize > maxPartySize) {
      _registrationPartySize = maxPartySize;
    }
  }

  @override
  void dispose() {
    _registrationNoteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final colorScheme = Theme.of(context).colorScheme;
    final post = widget.post;
    final memberSession = ref
        .watch(memberSessionProvider)
        .maybeWhen(data: (session) => session, orElse: () => null);
    final detailDateLabel = _detailDateLabel(context, post);
    _scheduleMarkRead(memberSession, post);

    return CustomScrollView(
      controller: widget.scrollController,
      slivers: [
        if (post.imageUrl != null && post.imageUrl!.isNotEmpty)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 18),
              child: AspectRatio(
                aspectRatio: 16 / 9,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    post.imageUrl!,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return LifePostImageFallback(post: post);
                    },
                  ),
                ),
              ),
            ),
          ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
            child: Text(
              post.title,
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
            child: AppMarkdownBody(
              data: post.body,
              emptyFallback: l10n.lifePostNoBody,
              emptyColor: colorScheme.onSurfaceVariant,
            ),
          ),
        ),
        if (detailDateLabel != null)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
              child: Text(
                detailDateLabel,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        if (post.registrationEnabled)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 18),
              child: EventRegistrationCard(
                post: post,
                isSubmitting: _isSubmittingRegistration,
                isSignedIn: memberSession != null,
                onSignIn: () =>
                    context.pushNamed(AppRouteNames.memberLoginEmail),
                onRegister: memberSession == null
                    ? null
                    : () => _registerForEvent(memberSession),
                onUpdate: memberSession == null
                    ? null
                    : () => _updateEventRegistration(memberSession),
                onCancel: memberSession == null
                    ? null
                    : () => _cancelEventRegistration(memberSession),
                onCheckIn: memberSession == null ? null : _openCheckInScanner,
                noteController: _registrationNoteController,
                partySize: _registrationPartySize,
                onPartySizeChanged: (value) {
                  setState(() => _registrationPartySize = value);
                },
              ),
            ),
          ),
        if (_hasAction(post))
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 18),
              child: Align(
                alignment: Alignment.centerLeft,
                child: FilledButton.icon(
                  onPressed: () => _openActionUrl(
                    post,
                    ref.read(externalLinkServiceProvider),
                  ),
                  icon: const Icon(Icons.open_in_new),
                  label: Text(_actionLabel(l10n, post)),
                ),
              ),
            ),
          ),
        if (widget.bottomPadding > 0)
          SliverToBoxAdapter(child: SizedBox(height: widget.bottomPadding)),
      ],
    );
  }

  Future<void> _registerForEvent(MemberSession session) async {
    await _runRegistrationAction(
      successMessage: AppLocalizations.of(context)!.eventRegistrationSuccess,
      action: () => ref
          .read(lifeRepositoryProvider)
          .registerForEvent(
            widget.post.id,
            session,
            partySize: _registrationPartySize,
            note: _registrationNoteController.text,
          ),
    );
  }

  Future<void> _updateEventRegistration(MemberSession session) async {
    await _runRegistrationAction(
      successMessage: AppLocalizations.of(
        context,
      )!.eventRegistrationUpdateSuccess,
      action: () => ref
          .read(lifeRepositoryProvider)
          .updateEventRegistration(
            widget.post.id,
            session,
            partySize: _registrationPartySize,
            note: _registrationNoteController.text,
          ),
    );
  }

  Future<void> _cancelEventRegistration(MemberSession session) async {
    await _runRegistrationAction(
      successMessage: AppLocalizations.of(
        context,
      )!.eventRegistrationCancelSuccess,
      action: () => ref
          .read(lifeRepositoryProvider)
          .cancelEventRegistration(widget.post.id, session),
    );
  }

  void _openCheckInScanner() {
    context.pushNamed(AppRouteNames.lifeCheckInScan);
  }

  Future<void> _runRegistrationAction({
    required String successMessage,
    required Future<LifePost> Function() action,
  }) async {
    if (_isSubmittingRegistration) {
      return;
    }

    setState(() => _isSubmittingRegistration = true);
    try {
      await action();
      _registrationNoteController.clear();
      ref.invalidate(lifePostByIdProvider(widget.post.id));
      ref.invalidate(lifePostsProvider);
      ref.invalidate(lifePostListProvider);
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(successMessage)));
    } catch (error) {
      if (!mounted) {
        return;
      }
      final message = _registrationErrorMessage(
        AppLocalizations.of(context)!,
        error,
      );
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(message)));
    } finally {
      if (mounted) {
        setState(() => _isSubmittingRegistration = false);
      }
    }
  }

  void _syncRegistrationFormFromPost(LifePost post) {
    final summary = post.registrationSummary;
    _registrationPartySize = (summary?.myPartySize ?? 1)
        .clamp(1, post.registrationMaxPartySize)
        .toInt();
    _registrationNoteController.text = summary?.myNote ?? "";
  }

  void _scheduleMarkRead(MemberSession? session, LifePost post) {
    if (session == null || post.isRead) {
      return;
    }
    final readKey = _markReadKey(post);
    if (_pendingReadKey == readKey || _lastMarkedReadKey == readKey) {
      return;
    }
    _pendingReadKey = readKey;
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) {
        return;
      }
      var didMarkRead = false;
      try {
        await markLifePostReadAndRefresh(ref, post: post, session: session);
        didMarkRead = true;
      } catch (_) {
        // Read state is server-owned. A failed write should not interrupt reading.
      } finally {
        if (mounted && _pendingReadKey == readKey) {
          _pendingReadKey = null;
          if (didMarkRead) {
            _lastMarkedReadKey = readKey;
          }
        }
      }
    });
  }
}

String _markReadKey(LifePost post) {
  return '${post.id}:${post.updatedAt?.toIso8601String() ?? ''}';
}

String? _detailDateLabel(BuildContext context, LifePost post) {
  if (post.startsAt != null) {
    return formatDateRangeByDay(context, post.startsAt!, end: post.endsAt);
  }
  final updatedAt = post.updatedAt;
  return updatedAt == null ? null : formatDateOnly(context, updatedAt);
}

bool _hasAction(LifePost post) {
  final label = post.ctaLabel?.trim();
  final url = post.ctaUrl?.trim();
  return label != null && label.isNotEmpty && url != null && url.isNotEmpty;
}

String _registrationErrorMessage(AppLocalizations l10n, Object error) {
  if (error is! ApiError) {
    return formatApiErrorMessage(error);
  }
  return switch (error.code) {
    'event_not_found' => l10n.eventRegistrationUnavailable,
    'event_capacity_full' => l10n.eventRegistrationFull,
    'event_not_open' => l10n.eventRegistrationClosed,
    'event_party_size_invalid' => l10n.eventRegistrationPartySizeInvalid,
    'registration_not_found' => l10n.eventRegistrationNotFound,
    'check_in_not_allowed' => l10n.eventRegistrationCheckInLocked,
    'authentication_required' ||
    'auth_required' => l10n.eventRegistrationSignInBody,
    _ => error.message,
  };
}

String _actionLabel(AppLocalizations l10n, LifePost post) {
  final label = post.ctaLabel?.trim();
  return label == null || label.isEmpty ? l10n.lifePostActionOpen : label;
}

Future<void> _openActionUrl(
  LifePost post,
  ExternalLinkService linkService,
) async {
  await linkService.openExternalUrl(post.ctaUrl);
}
